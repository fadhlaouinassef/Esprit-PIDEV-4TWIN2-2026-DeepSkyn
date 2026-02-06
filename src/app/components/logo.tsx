
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2 font-bold text-xl", className)}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#156d95] via-[#1a7aaa] to-[#0d4a6b] rounded-lg"></div>
            <span className="bg-gradient-to-r from-[#202020] to-[#156d95] bg-clip-text text-transparent">DeepSkyN</span>
        </div>
    );
}
