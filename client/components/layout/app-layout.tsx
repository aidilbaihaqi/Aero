"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppBottomNav } from "./app-bottom-nav";
import { AppHeader } from "./app-header";
import { cn } from "@/lib/utils";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const pathname = usePathname();

    // Hide search on settings
    const showSearch = !pathname?.startsWith("/settings");

    return (
        <div className="relative min-h-screen bg-[#F5F5F5] dark:bg-neutral-900 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.4] bg-[radial-gradient(#0000001a_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#ffffff1a_1px,transparent_1px)]"></div>

            {/* Desktop: Collapsible Sidebar */}
            <AppSidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Mobile: Bottom Dock */}
            <AppBottomNav />

            {/* Main Content Area */}
            <div
                className={cn(
                    "relative z-10 min-h-screen transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[260px]"
                )}
            >
                {/* Header */}
                <AppHeader
                    onMobileMenuClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    showSearch={showSearch}
                />

                {/* Page Content */}
                <main className="p-6 pb-24 lg:px-10 lg:pb-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
