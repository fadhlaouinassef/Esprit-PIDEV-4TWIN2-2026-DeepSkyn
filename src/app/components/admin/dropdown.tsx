
"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    className?: string;
}

export function Dropdown({ children, isOpen, setIsOpen, className }: DropdownProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
            {children}
        </div>
    );
}

export function DropdownTrigger({ children, className, onClick, ...props }: any) {
    return (
        <div
            className={className}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}

export function DropdownContent({ children, className, align = "center", isOpen }: any) {
    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "absolute top-full z-50 mt-2 min-w-[300px] origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg focus:outline-none dark:border-gray-700 dark:bg-gray-800",
                align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
                className
            )}
        >
            {children}
        </div>
    );
}
