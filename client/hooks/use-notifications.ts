import { useState } from 'react';
import type { Notification } from '@/lib/notifications';

const initialNotifications: Notification[] = [
    {
        id: '1',
        type: 'price_alert',
        title: 'Harga Turun: BTH - CGK',
        message: 'Tiket Lion Air turun drastis menjadi Rp 550.000. Cek sekarang sebelum harga naik lagi!',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
        read: false,
        route: 'BTH-CGK',
        priceChange: -15,
        actionUrl: '/dashboard',
    },
    {
        id: '2',
        type: 'success',
        title: 'Scraping Selesai',
        message: 'Proses pengambilan data harga tiket berhasil diselesaikan. 156 penerbangan baru ditemukan.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        read: false,
    },
    {
        id: '3',
        type: 'warning',
        title: 'Koneksi Lambat',
        message: 'Beberapa request ke maskapai mengalami latency tinggi. Retrying otomatis aktif.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        read: true,
    },
    {
        id: '4',
        type: 'price_alert',
        title: 'Harga Naik: TNJ - CGK',
        message: 'Tiket Garuda Indonesia naik menjadi Rp 1.450.000 untuk penerbangan besok.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        route: 'TNJ-CGK',
        priceChange: 12,
    },
];

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAsUnread = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: false } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAll,
    };
}
