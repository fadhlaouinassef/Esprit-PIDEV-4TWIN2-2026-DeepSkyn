"use client"

import { cn } from "@/lib/utils"

interface AnimatedOrbProps {
    size?: number
    variant?: "blue" | "red"
}

export function AnimatedOrb({ size = 36, variant = "blue" }: AnimatedOrbProps) {
    const colorClass = variant === "red"
        ? "bg-red-500/20 border-red-500/50"
        : "bg-primary/20 border-primary/50"

    return (
        <div
            className={cn(
                "rounded-full border flex items-center justify-center animate-pulse",
                colorClass
            )}
            style={{ width: size, height: size }}
        >
            <div className={cn(
                "rounded-full",
                variant === "red" ? "bg-red-500" : "bg-primary"
            )} style={{ width: size * 0.4, height: size * 0.4 }} />
        </div>
    )
}
