"use client";

import { useState } from "react";
import Link from "next/link";
import { Plane, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// New Components
import { GlobalSearch } from "@/components/global-search";
import { NotificationPanel } from "@/components/notification-panel";

interface AppHeaderProps {
    onMobileMenuClick: () => void;
    showSearch?: boolean;
}

export function AppHeader({ onMobileMenuClick, showSearch = true }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between px-6 lg:px-10 bg-transparent">
            {/* Mobile Logo & Toggle (< lg) */}
            <div className="flex items-center gap-3 lg:hidden">
                <Button variant="ghost" size="icon" onClick={onMobileMenuClick} className="mr-2">
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                    <Plane className="h-5 w-5 -rotate-45" />
                </div>
                <span className="font-display text-xl font-bold">Aero</span>
            </div>

            {/* Desktop Greeting (Visible >= lg) */}
            <div className="hidden lg:block">
                <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Beranda
                </h1>
                <p className="text-neutral-500">
                    Pantau harga tiket pesawat real-time
                </p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 lg:gap-6 ml-auto lg:ml-0">
                {/* Global Search */}
                {showSearch && (
                    <div className="hidden lg:block relative">
                        <GlobalSearch />
                    </div>
                )}

                {/* Notifications Panel */}
                <NotificationPanel />

                {/* User Profile */}
                <div className="h-8 w-px bg-neutral-200 lg:block hidden dark:bg-neutral-700"></div>
                <div className="flex items-center gap-3">
                    <div className="hidden text-right lg:block">
                        <div className="font-bold text-sm">Admin</div>
                        <div className="text-xs text-neutral-500">admin@aeroprice.com</div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/settings" className="w-full">Pengaturan</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                <Link href="/login" className="w-full">Keluar</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
