"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Plane,
    LineChart,
    History,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppBottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: LayoutDashboard },
        { name: "Routes", href: "/routes", icon: Plane },
        { name: "Analytics", href: "/analytics", icon: LineChart },
        { name: "History", href: "/history", icon: History },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/20 bg-black/80 px-2 py-2 shadow-2xl backdrop-blur-xl lg:hidden">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                            "group relative flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-300",
                            isActive
                                ? "bg-white/20 text-white"
                                : "text-neutral-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        <Icon
                            className={cn(
                                "h-6 w-6 transition-transform duration-300",
                                isActive && "scale-110"
                            )}
                        />
                        {isActive && (
                            <span className="absolute -bottom-8 scale-100 text-[10px] font-medium text-black transition-all duration-300">
                                {/* Optional Label Indicator */}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
