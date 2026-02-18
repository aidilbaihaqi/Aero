import { TrendingDown, TrendingUp, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'price_alert' | 'system' | 'success' | 'warning';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    route?: string;
    priceChange?: number;
    actionUrl?: string;
}

export function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";

    return "Baru saja";
}

export function getNotificationColor(type: Notification['type']) {
    switch (type) {
        case 'price_alert':
            return {
                iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                icon: 'text-blue-600 dark:text-blue-400',
            };
        case 'success':
            return {
                iconBg: 'bg-green-100 dark:bg-green-900/30',
                icon: 'text-green-600 dark:text-green-400',
            };
        case 'warning':
            return {
                iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                icon: 'text-orange-600 dark:text-orange-400',
            };
        case 'system':
        default:
            return {
                iconBg: 'bg-neutral-100 dark:bg-neutral-800',
                icon: 'text-neutral-600 dark:text-neutral-400',
            };
    }
}
