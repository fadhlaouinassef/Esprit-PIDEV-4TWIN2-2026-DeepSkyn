"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

interface DropdownProps {
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            {children}
        </div>
    );
}

export function DropdownTrigger({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
}) {
    return (
        <div onClick={onClick} className={cn("inline-flex", className)}>
            {children}
        </div>
    );
}

export function DropdownContent({
    children,
    isOpen,
    className,
    align = "end",
}: {
    children: React.ReactNode;
    isOpen: boolean;
    className?: string;
    align?: "start" | "end" | "center";
}) {
    if (!isOpen) return null;

    const alignStyles = {
        start: "left-0",
        end: "right-0",
        center: "left-1/2 -translate-x-1/2",
    };

    return (
        <div
            className={cn(
                "absolute z-50 rounded-xl",
                alignStyles[align],
                className
            )}
        >
            {children}
        </div>
    );
}
