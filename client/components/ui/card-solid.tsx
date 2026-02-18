import * as React from "react";
import { cn } from "@/lib/utils";

interface CardSolidProps extends React.ComponentProps<"div"> {
    glow?: boolean;
}

function CardSolid({ className, glow = false, ...props }: CardSolidProps) {
    return (
        <div
            data-component="card-solid"
            className={cn(
                "bg-[var(--background-dark)] text-[var(--foreground-inverse)]",
                "border border-[var(--border-dark)]",
                "rounded-lg p-6",
                "shadow-md",
                glow && "transition-shadow hover:shadow-[var(--shadow-glow)]",
                className
            )}
            {...props}
        />
    );
}

function CardSolidHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-solid-header"
            className={cn("flex flex-col gap-2 mb-4", className)}
            {...props}
        />
    );
}

function CardSolidTitle({ className, ...props }: React.ComponentProps<"h3">) {
    return (
        <h3
            data-slot="card-solid-title"
            className={cn(
                "font-display font-bold text-2xl leading-none",
                "text-[var(--foreground-inverse)]",
                className
            )}
            {...props}
        />
    );
}

function CardSolidDescription({
    className,
    ...props
}: React.ComponentProps<"p">) {
    return (
        <p
            data-slot="card-solid-description"
            className={cn(
                "font-body text-sm",
                "text-[var(--foreground-muted)]",
                className
            )}
            {...props}
        />
    );
}

function CardSolidContent({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-solid-content"
            className={cn("font-body", className)}
            {...props}
        />
    );
}

function CardSolidFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-solid-footer"
            className={cn("flex items-center gap-4 mt-4", className)}
            {...props}
        />
    );
}

export {
    CardSolid,
    CardSolidHeader,
    CardSolidTitle,
    CardSolidDescription,
    CardSolidContent,
    CardSolidFooter,
};
