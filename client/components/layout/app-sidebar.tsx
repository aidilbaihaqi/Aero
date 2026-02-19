"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Plane,
    LineChart,
    History,
    Download,
    Settings,
    LogOut,
    ChevronLeft,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
    isCollapsed?: boolean;
    isMobileOpen?: boolean;
    onToggle?: () => void;
    onMobileClose?: () => void;
    onLogout?: () => void;
}

export function AppSidebar({
    isCollapsed = false,
    isMobileOpen = false,
    onToggle,
    onMobileClose,
    onLogout,
}: AppSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: "Beranda", href: "/dashboard", icon: LayoutDashboard },
        { name: "Rute", href: "/routes", icon: Plane },
        { name: "Analisis", href: "/analytics", icon: LineChart },
        { name: "Riwayat", href: "/history", icon: History },
        { name: "Ekspor", href: "/export", icon: Download },
    ];

    return (
        <aside
            className={cn(
                // Base styles
                "fixed left-0 top-0 z-50 h-screen flex-col border-r border-neutral-200 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 ease-in-out dark:border-neutral-800 dark:bg-black/80",
                // Desktop: always visible, collapsible width
                "hidden lg:flex",
                isCollapsed ? "lg:w-[80px]" : "lg:w-[260px]",
                // Mobile: slide-in overlay
                isMobileOpen && "!flex w-[280px]"
            )}
        >
            {/* Desktop: Floating Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-9 z-50 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-colors hover:bg-neutral-100 hover:text-black dark:border-neutral-800 dark:bg-neutral-900 lg:flex"
            >
                <ChevronLeft
                    className={cn(
                        "h-3 w-3 transition-transform duration-300",
                        isCollapsed && "rotate-180"
                    )}
                />
            </button>

            {/* Logo Section */}
            <div
                className={cn(
                    "flex h-24 items-center px-6 transition-all",
                    isCollapsed && !isMobileOpen ? "justify-center" : "justify-between"
                )}
            >
                <div
                    className={cn(
                        "flex items-center",
                        isCollapsed && !isMobileOpen ? "gap-0" : "gap-3"
                    )}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                        <Plane className="h-6 w-6 -rotate-45" />
                    </div>
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-300",
                            isCollapsed && !isMobileOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                        )}
                    >
                        <span className="block font-display text-xl font-bold leading-none text-neutral-900 dark:text-white">
                            Aero
                        </span>
                        <span className="whitespace-nowrap text-xs text-neutral-500">
                            Pantau Harga Premium
                        </span>
                    </div>
                </div>

                {/* Mobile: Close Button */}
                {isMobileOpen && (
                    <button
                        onClick={onMobileClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation Section */}
            <div className="flex flex-1 flex-col justify-between px-4 pb-8">
                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname?.startsWith(item.href);
                        const collapsed = isCollapsed && !isMobileOpen;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onMobileClose}
                                className={cn(
                                    "flex items-center rounded-xl py-3.5 text-sm font-medium transition-all duration-300 relative group",
                                    collapsed
                                        ? "justify-center px-0 gap-0"
                                        : "px-4 gap-4",
                                    isActive
                                        ? "bg-black text-white shadow-lg dark:bg-white dark:text-black"
                                        : "text-neutral-500 hover:bg-neutral-100 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-5 w-5 shrink-0",
                                        isActive ? "opacity-100" : "opacity-70"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 whitespace-nowrap",
                                        collapsed
                                            ? "w-0 opacity-0"
                                            : "w-auto opacity-100"
                                    )}
                                >
                                    {item.name}
                                </span>

                                {/* Tooltip for Collapsed State */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100 pointer-events-none z-50">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="space-y-2">
                    <Link
                        href="/settings"
                        onClick={onMobileClose}
                        className={cn(
                            "flex items-center rounded-xl py-3.5 text-sm font-medium transition-colors",
                            isCollapsed && !isMobileOpen
                                ? "justify-center px-0 gap-0"
                                : "px-4 gap-4",
                            pathname?.startsWith("/settings")
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : "text-neutral-500 hover:bg-neutral-100 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        )}
                    >
                        <Settings className="h-5 w-5 shrink-0" />
                        <span
                            className={cn(
                                "overflow-hidden transition-all duration-300 whitespace-nowrap",
                                isCollapsed && !isMobileOpen ? "w-0 opacity-0" : "w-auto opacity-100"
                            )}
                        >
                            Pengaturan
                        </span>
                    </Link>

                    <button
                        onClick={onLogout}
                        className={cn(
                            "flex w-full items-center rounded-xl py-3.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20",
                            isCollapsed && !isMobileOpen
                                ? "justify-center px-0 gap-0"
                                : "px-4 gap-4"
                        )}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span
                            className={cn(
                                "overflow-hidden transition-all duration-300 whitespace-nowrap",
                                isCollapsed && !isMobileOpen
                                    ? "w-0 opacity-0"
                                    : "w-auto opacity-100"
                            )}
                        >
                            Keluar
                        </span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
