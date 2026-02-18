import Link from 'next/link';
import { TrendingDown, TrendingUp, CheckCircle, AlertTriangle, Info, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notifications';
import { timeAgo, getNotificationColor } from '@/lib/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onMarkAsUnread: (id: string) => void;
    onDelete: (id: string) => void;
}

// Get icon based on notification type
function getNotificationIcon(notification: Notification) {
    if (notification.type === 'price_alert') {
        if (notification.priceChange && notification.priceChange < 0) {
            return TrendingDown;
        }
        return TrendingUp;
    }

    const icons = {
        system: Info,
        success: CheckCircle,
        warning: AlertTriangle,
        price_alert: Info // Fallback
    };

    return icons[notification.type] || Info;
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete
}: NotificationItemProps) {
    const Icon = getNotificationIcon(notification);
    const colors = getNotificationColor(notification.type);

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
    };

    const content = (
        <div
            className={cn(
                "group relative flex gap-3 p-4 rounded-xl transition-colors cursor-pointer border border-transparent",
                !notification.read && "bg-blue-50/50 dark:bg-blue-900/10",
                "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            )}
            onClick={handleClick}
        >
            {/* Unread Indicator */}
            {!notification.read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
            )}

            {/* Icon */}
            <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", colors.iconBg)}>
                <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-0.5">
                            {notification.title}
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {notification.message}
                        </p>
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {notification.read ? (
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsUnread(notification.id);
                                }}>
                                    Tandai belum dibaca
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                }}>
                                    Tandai sudah dibaca
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(notification.id);
                                }}
                                className="text-red-600 dark:text-red-400"
                            >
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-neutral-500">
                        {timeAgo(notification.timestamp)}
                    </span>
                    {notification.route && (
                        <>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                                {notification.route}
                            </span>
                        </>
                    )}
                    {notification.priceChange && (
                        <>
                            <span className="text-xs text-neutral-400">•</span>
                            <span className={cn(
                                "text-xs font-semibold",
                                notification.priceChange < 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {notification.priceChange > 0 ? '+' : ''}{notification.priceChange}%
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // Wrap in Link if actionUrl is provided
    if (notification.actionUrl) {
        return (
            <Link href={notification.actionUrl} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
