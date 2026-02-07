"use client";

import { Search, Menu, Moon, Sun } from "lucide-react";
import { useSidebarContext } from "./sidebar-context";
import { useState } from "react";
import { UserInfo } from "./UserInfo";
import { cn } from "@/lib/utils";

interface HeaderProps {
    userName?: string;
    userPhoto?: string;
}

export function Header({ userName, userPhoto }: HeaderProps) {
    const { toggleSidebar } = useSidebarContext();
    const [darkMode, setDarkMode] = useState(false);

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-dark md:px-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-lg border border-gray-100 p-1.5 dark:border-gray-700 dark:bg-gray-900 transition-colors hover:bg-gray-50 lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                    <span className="sr-only">Toggle Sidebar</span>
                </button>

                <div className="max-sm:hidden">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        User Dashboard
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                <div className="relative hidden md:block w-70">
                    <input
                        type="search"
                        placeholder="Search"
                        className="w-full rounded-full border-none bg-gray-50 py-3 pl-12 pr-5 text-sm outline-none transition-all focus:ring-1 focus:ring-gray-200 dark:bg-gray-900/50 dark:text-white dark:focus:ring-gray-700"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <div
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex cursor-pointer items-center rounded-full bg-gray-100 p-1 dark:bg-gray-800"
                >
                    <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                        !darkMode ? "bg-white shadow-sm text-gray-900" : "text-gray-400"
                    )}>
                        <Sun className="w-5 h-5" />
                    </div>
                    <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300",
                        darkMode ? "bg-primary shadow-sm text-white" : "text-gray-400"
                    )}>
                        <Moon className="w-5 h-5" />
                    </div>
                </div>

                <UserInfo name={userName} photo={userPhoto} />
            </div>
        </header>
    );
}
