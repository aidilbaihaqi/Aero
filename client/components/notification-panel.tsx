import { useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationItem } from '@/components/notification-item';
import { useNotifications } from '@/hooks/use-notifications';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationPanel() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        clearAll
    } = useNotifications();

    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    const filteredNotifications = activeTab === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const hasNotifications = notifications.length > 0;
    const hasUnread = unreadCount > 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-neutral-500 shadow-sm transition-transform hover:scale-105 active:scale-95 dark:bg-neutral-800">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <>
                            {/* Red dot indicator */}
                            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-800" />
                            {/* Badge counter (optional, can be toggled) */}
                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[400px] p-0 shadow-xl"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
                    <h3 className="font-display text-lg font-semibold">Notifikasi</h3>
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-8 text-xs"
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Tandai semua
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                {hasNotifications && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b border-neutral-200 dark:border-neutral-700 px-4">
                            <TabsList className="w-full justify-start h-10 bg-transparent p-0">
                                <TabsTrigger
                                    value="all"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-white"
                                >
                                    Semua
                                    {notifications.length > 0 && (
                                        <span className="ml-2 text-xs text-neutral-500">
                                            {notifications.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="unread"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-white"
                                >
                                    Belum Dibaca
                                    {hasUnread && (
                                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            {unreadCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Notification List */}
                        <TabsContent value={activeTab} className="m-0">
                            {filteredNotifications.length > 0 ? (
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-1 p-2">
                                        {filteredNotifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onMarkAsRead={markAsRead}
                                                onMarkAsUnread={markAsUnread}
                                                onDelete={deleteNotification}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                        <Bell className="h-8 w-8 text-neutral-400" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                                        Tidak ada notifikasi
                                    </p>
                                    <p className="text-xs text-neutral-500 text-center">
                                        {activeTab === 'unread'
                                            ? 'Semua notifikasi sudah dibaca'
                                            : 'Belum ada notifikasi untuk ditampilkan'
                                        }
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Empty State (when no notifications at all) */}
                {!hasNotifications && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                            <Bell className="h-8 w-8 text-neutral-400" />
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                            Tidak ada notifikasi
                        </p>
                        <p className="text-xs text-neutral-500 text-center">
                            Anda akan menerima notifikasi di sini
                        </p>
                    </div>
                )}

                {/* Footer Actions */}
                {hasNotifications && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAll}
                            className="w-full justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Semua Notifikasi
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
