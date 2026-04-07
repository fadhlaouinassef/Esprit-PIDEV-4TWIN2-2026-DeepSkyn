"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type AudioToggleButtonProps = {
    enabled: boolean;
    onToggle: () => void;
    label?: string;
    className?: string;
};

export function AudioToggleButton({
    enabled,
    onToggle,
    label = "Audio",
    className,
}: AudioToggleButtonProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={enabled}
            title={enabled ? "Disable automatic audio" : "Enable automatic audio"}
            className={cn(
                "group relative inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5",
                "border transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#156d95]/40",
                enabled
                    ? "border-[#156d95]/50 bg-gradient-to-r from-[#156d95] to-[#0f5474] text-white shadow-[0_10px_30px_rgba(21,109,149,0.35)]"
                    : "border-gray-200 bg-white/95 text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:border-[#156d95]/35 hover:text-[#156d95] dark:border-gray-700 dark:bg-gray-800/95 dark:text-gray-300",
                className
            )}
        >
            <span
                className={cn(
                    "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
                    enabled && "opacity-100 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%)]"
                )}
            />

            <span
                className={cn(
                    "relative inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    enabled ? "bg-white/20" : "bg-[#156d95]/10"
                )}
            >
                {enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </span>

            <span className="relative text-[10px] font-black uppercase tracking-[0.14em]">
                {label}
            </span>

            <span className="relative ml-1 flex items-end gap-0.5">
                <span className={cn("h-2 w-0.5 rounded-full", enabled ? "bg-white animate-pulse" : "bg-[#156d95]/45")} />
                <span className={cn("h-3 w-0.5 rounded-full", enabled ? "bg-white/90 animate-pulse" : "bg-[#156d95]/55")} />
                <span className={cn("h-2.5 w-0.5 rounded-full", enabled ? "bg-white/80 animate-pulse" : "bg-[#156d95]/40")} />
            </span>
        </button>
    );
}
