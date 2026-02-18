import * as React from "react";
import { cn } from "@/lib/utils";

interface CardGlassProps extends React.ComponentProps<"div"> {
    variant?: "default" | "white";
}

function CardGlass({
    className,
    variant = "default",
    ...props
}: CardGlassProps) {
    return (
        <div
            data-component="card-glass"
            data-variant={variant}
            className={cn(
                "rounded-lg p-6",
                "backdrop-blur-[10px]",
                variant === "default" && [
                    "bg-[var(--glass-bg)]",
                    "border border-[var(--glass-border)]",
                    "shadow-lg",
                ],
                variant === "white" && [
                    "bg-[var(--glass-white-bg)]",
                    "border border-[var(--glass-white-border)]",
                    "shadow-sm",
                ],
                className
            )}
            {...props}
        />
    );
}

function CardGlassHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-glass-header"
            className={cn("flex flex-col gap-2 mb-4", className)}
            {...props}
        />
    );
}

function CardGlassTitle({ className, ...props }: React.ComponentProps<"h3">) {
    return (
        <h3
            data-slot="card-glass-title"
            className={cn(
                "font-display font-semibold text-lg leading-none",
                className
            )}
            {...props}
        />
    );
}

function CardGlassDescription({
    className,
    ...props
}: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="card-glass-description"
            className={cn(
                "font-body text-sm",
                "text-[var(--foreground-secondary)]",
                className
            )}
            {...props}
        />
    );
}

function CardGlassContent({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-glass-content"
            className={cn("font-body", className)}
            {...props}
        />
    );
}

function CardGlassFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-glass-footer"
            className={cn("flex items-center gap-4 mt-4", className)}
            {...props}
        />
    );
}

export {
    CardGlass,
    CardGlassHeader,
    CardGlassTitle,
    CardGlassDescription,
    CardGlassContent,
    CardGlassFooter,
};
