import { useState, useEffect } from 'react';
import type { Notification } from '@/lib/notifications';
import api from "@/lib/axios";
import { toast } from "sonner";

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/api/notifications");
            // Normalize dates
            const normalized = res.data.map((n: any) => ({
                ...n,
                timestamp: new Date(n.created_at)
            }));
            setNotifications(normalized);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (String(n.id) === id ? { ...n, read: true } : n))
        );
        try {
            await api.patch(`/api/notifications/${id}/read`);
        } catch {
            // Revert on fail? Nah, just log
            console.error("Failed to mark as read");
        }
    };

    const markAsUnread = async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (String(n.id) === id ? { ...n, read: false } : n))
        );
        try {
            await api.patch(`/api/notifications/${id}/unread`);
        } catch {
            console.error("Failed to mark as unread");
        }
    };

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await api.patch("/api/notifications/read-all");
            toast.success("Semua notifikasi ditandai sudah dibaca");
        } catch {
            console.error("Failed to mark all as read");
        }
    };

    const deleteNotification = async (id: string) => {
        setNotifications((prev) => prev.filter((n) => String(n.id) !== id));
        try {
            await api.delete(`/api/notifications/${id}`);
            toast.success("Notifikasi dihapus");
        } catch {
            console.error("Failed to delete notification");
        }
    };

    const clearAll = async () => {
        setNotifications([]);
        try {
            await api.delete("/api/notifications/all");
            toast.success("Semua notifikasi dihapus");
        } catch {
            console.error("Failed to clear notifications");
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refresh: fetchNotifications,
    };
}
