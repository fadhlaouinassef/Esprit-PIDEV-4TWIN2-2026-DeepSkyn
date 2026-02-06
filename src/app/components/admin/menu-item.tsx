
"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface MenuItemProps {
    children: React.ReactNode;
    isActive?: boolean;
    className?: string;
    onClick?: () => void;
    as?: "button" | "link" | "div";
    href?: string;
}

export function MenuItem({
    children,
    isActive,
    className,
    onClick,
    as = "div",
    href,
}: MenuItemProps) {
    const Comp = as === "link" && href ? Link : (as === "button" ? "button" : "div");

    const props = as === "link" && href ? { href } : {};

    return (
        // @ts-ignore - Link usage with generic component tricky in TS
        <Comp
            {...props}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                isActive
                    ? "bg-[#156d95]/10 text-[#156d95] dark:bg-[#156d95]/20"
                    : "text-gray-600 dark:text-gray-400",
                className
            )}
        >
            {children}
        </Comp>
    );
}
