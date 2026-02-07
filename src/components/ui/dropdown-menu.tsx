"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Minimal DropdownMenu using standard React state since Radix is missing
export function DropdownMenu({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false)
    return (
        <div className="relative inline-block">
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as any, { isOpen, setIsOpen })
                }
                return child
            })}
        </div>
    )
}

export function DropdownMenuTrigger({ asChild, children, isOpen, setIsOpen }: any) {
    return (
        <div onClick={() => setIsOpen(!isOpen)}>
            {children}
        </div>
    )
}

export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}

export function DropdownMenuContent({ children, isOpen, align, side, sideOffset, className }: any) {
    if (!isOpen) return null
    return (
        <div className={cn(
            "absolute bottom-full mb-2 left-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-md animate-in fade-in-80",
            className
        )}>
            {children}
        </div>
    )
}

export function DropdownMenuItem({ children, onClick, className }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-zinc-100 focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
        >
            {children}
        </div>
    )
}
