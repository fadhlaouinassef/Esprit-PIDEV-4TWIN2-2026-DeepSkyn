"use client";

import { cn } from "@/lib/utils";
import { LoadingLink } from "../LoadingLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { USER_NAV_DATA } from "./data";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";

interface SidebarProps {
    userName?: string;
    userPhoto?: string;
}

export function Sidebar({ userName: propUserName, userPhoto: propUserPhoto }: SidebarProps) {
    const pathname = usePathname();
    const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const user = useAppSelector((state) => state.auth.user);

    // Use Redux state if available, otherwise fallback to props
    const userName = user ? `${user.nom || ''} ${user.prenom || ''}`.trim() || "User" : (propUserName || "User");
    const userPhoto = user?.photo || propUserPhoto;

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    };

    useEffect(() => {
        USER_NAV_DATA.some((section) => {
            return section.items.some((item) => {
                if ('url' in item && item.url === pathname) return true;
                return item.items.some((subItem: any) => {
                    if (subItem.url === pathname) {
                        if (!expandedItems.includes(item.title)) {
                            toggleExpanded(item.title);
                        }
                        return true;
                    }
                    return false;
                });
            });
        });
    }, [pathname]);

    return (
        <>
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    "max-w-[290px] border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark h-full",
                    isMobile ? "fixed bottom-0 top-0 z-50 rounded-r-3xl h-screen" : "sticky top-0 h-screen",
                    isOpen ? "w-[290px]" : "w-0 min-w-0 pr-0 pl-0 border-none",
                )}
                aria-label="Main navigation"
                aria-hidden={!isOpen}
            >
                <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
                    <div className="relative pr-4.5">
                        {/* User Profile Header */}
                        <LoadingLink
                            href={"/user/settings/profile"}
                            onClick={() => isMobile && toggleSidebar()}
                            className="block mb-8 px-2"
                        >
                            <div className="flex items-center gap-3 group">
                                <div className="size-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-200 dark:border-gray-700 group-hover:border-[#156d95] transition-colors">
                                    <Image
                                        src={userPhoto || "/avatar.png"}
                                        width={48}
                                        height={48}
                                        alt={userName || "User"}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#156d95] transition-colors">
                                        {userName || "User"}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        User Account
                                    </span>
                                </div>
                            </div>
                        </LoadingLink>

                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                className="absolute right-0 top-0 p-2"
                            >
                                <span className="sr-only">Close Menu</span>
                                <ArrowLeft className="size-6" />
                            </button>
                        )}
                    </div>

                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-3" data-lenis-prevent>
                        {USER_NAV_DATA.map((section) => (
                            <div key={section.label} className="mb-6">
                                <h2 className="mb-4 px-3 text-sm font-bold uppercase tracking-widest text-gray-500/70">
                                    {section.label}
                                </h2>

                                <nav role="navigation" aria-label={section.label}>
                                    <ul className="space-y-1">
                                        {section.items.map((item) => (
                                            <li key={item.title}>
                                                {item.items.length > 0 ? (
                                                    <div>
                                                        <MenuItem
                                                            onClick={() => toggleExpanded(item.title)}
                                                            className="w-full cursor-pointer"
                                                        >
                                                            <item.icon
                                                                className="size-5 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                            <span>{item.title}</span>
                                                            <ChevronUp
                                                                className={cn(
                                                                    "ml-auto size-4 transition-transform duration-200",
                                                                    !expandedItems.includes(item.title) &&
                                                                    "rotate-180",
                                                                )}
                                                                aria-hidden="true"
                                                            />
                                                        </MenuItem>

                                                        {expandedItems.includes(item.title) && (
                                                            <ul
                                                                className="ml-9 mr-0 space-y-1 pt-1"
                                                                role="menu"
                                                            >
                                                                {item.items.map((subItem: any) => (
                                                                    <li key={subItem.title} role="none">
                                                                        <MenuItem
                                                                            as="link"
                                                                            href={subItem.url}
                                                                            isActive={pathname === subItem.url}
                                                                        >
                                                                            <span>{subItem.title}</span>
                                                                        </MenuItem>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <MenuItem
                                                        as="link"
                                                        href={item.url}
                                                        isActive={pathname === item.url}
                                                    >
                                                        <item.icon
                                                            className="size-5 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                        <span>{item.title}</span>
                                                    </MenuItem>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
