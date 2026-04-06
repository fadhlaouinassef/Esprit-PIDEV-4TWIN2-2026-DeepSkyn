"use client";

import { cn } from "@/lib/utils";
import { LoadingLink } from "../LoadingLink";
import React from "react";

interface MenuItemProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    as?: "link" | "button";
    href?: string;
    isActive?: boolean;
    accentColor?: string;
}

export function MenuItem({
    children,
    className,
    onClick,
    as = "button",
    href = "#",
    isActive = false,
    accentColor = "#156d95",
}: MenuItemProps) {
    const baseStyles = "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200";
    const activeStyles = isActive
        ? "dark:bg-opacity-20"
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900/50 dark:hover:text-white";

    if (as === "link") {
        return (
            <LoadingLink
                href={href}
                className={cn(baseStyles, activeStyles, className)}
                style={isActive ? { backgroundColor: `${accentColor}1A`, color: accentColor } : undefined}
            >
                {children}
            </LoadingLink>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(baseStyles, activeStyles, className)}
            style={isActive ? { backgroundColor: `${accentColor}1A`, color: accentColor } : undefined}
        >
            {children}
        </button>
    );
}
