
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { Dropdown, DropdownContent, DropdownTrigger } from "./dropdown";

const notificationList = [
    {
        image: "/avatar.png",
        title: "Piter Joined the Team!",
        subTitle: "Congratulate him",
    },
    {
        image: "/avatar.png",
        title: "New message",
        subTitle: "Devid sent a new message",
    },
    {
        image: "/avatar.png",
        title: "New Payment received",
        subTitle: "Check your earnings",
    },
    {
        image: "/avatar.png",
        title: "Jolly completed tasks",
        subTitle: "Assign new task",
    },
    {
        image: "/avatar.png",
        title: "Roman Joined the Team!",
        subTitle: "Congratulate him",
    },
];

export function Notification() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDotVisible, setIsDotVisible] = useState(true);
    const isMobile = useIsMobile();

    return (
        <Dropdown
            isOpen={isOpen}
            setIsOpen={(open) => {
                setIsOpen(open);
                if (open) setIsDotVisible(false);
            }}
        >
            <DropdownTrigger
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                aria-label="View Notifications"
            >
                <span className="relative">
                    <Bell className="w-5 h-5" />

                    {isDotVisible && (
                        <span
                            className={cn(
                                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800",
                            )}
                        >
                            <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-500 opacity-75" />
                        </span>
                    )}
                </span>
            </DropdownTrigger>

            <DropdownContent
                isOpen={isOpen}
                align={isMobile ? "end" : "end"}
                className="border border-gray-100 bg-white px-3.5 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-800 w-[max-content] min-w-[20rem] right-0 translate-x-0"
            >
                <div className="mb-1 flex items-center justify-between px-2 py-1.5">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Notifications
                    </span>
                    <span className="rounded-md bg-[#156d95] px-[9px] py-0.5 text-xs font-medium text-white">
                        5 new
                    </span>
                </div>

                <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto custom-scrollbar">
                    {notificationList.map((item, index) => (
                        <li key={index} role="menuitem">
                            <Link
                                href="#"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-4 rounded-xl px-2 py-2 outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="size-12 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                                    <Image
                                        src={item.image}
                                        className="size-full object-cover"
                                        width={48}
                                        height={48}
                                        alt="User"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <strong className="block text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {item.title}
                                    </strong>

                                    <span className="block truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {item.subTitle}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>

                <Link
                    href="#"
                    onClick={() => setIsOpen(false)}
                    className="block rounded-xl border border-[#156d95] p-2.5 text-center text-sm font-bold tracking-wide text-[#156d95] outline-none transition-all hover:bg-[#156d95]/5 focus:bg-[#156d95]/5"
                >
                    See all notifications
                </Link>
            </DropdownContent>
        </Dropdown>
    );
}
