"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

interface MenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    as?: "link" | "button";
    href?: string;
    isActive?: boolean;
}

export function MenuItem({
    children,
    className,
    onClick,
    as = "button",
    href = "#",
    isActive = false,
}: MenuItemProps) {
    const baseStyles = "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200";
    const activeStyles = isActive
        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-white"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900/50 dark:hover:text-white";

    if (as === "link") {
        return (
            <Link
                href={href}
                className={cn(baseStyles, activeStyles, className)}
            >
                {children}
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(baseStyles, activeStyles, className)}
        >
            {children}
        </button>
    );
}
