import { ReactNode } from "react";

interface GuestLayoutProps {
    children: ReactNode;
}

export default function GuestLayout({ children }: GuestLayoutProps) {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {children}
        </div>
    );
}
