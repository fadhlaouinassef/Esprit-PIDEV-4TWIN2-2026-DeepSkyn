"use client";

import { cn } from "@/lib/utils";
import { LoadingLink } from "../LoadingLink";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { USER_NAV_DATA } from "./data";
import { ArrowLeft, ChevronUp, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import Image from "next/image";
import { useAppSelector } from "@/store/hooks";
import { ThemePicker } from "../ui/ThemePicker";
import { SIDEBAR_THEMES } from "@/store/slices/uiThemeSlice";
import { useHydrated } from "@/hooks/use-hydrated";

type UserSubItem = { title: string; url: string };

interface SidebarProps {
    userName?: string;
    userPhoto?: string;
}

export function Sidebar({ userName: propUserName, userPhoto: propUserPhoto }: SidebarProps) {
    const pathname = usePathname();
    const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const user = useAppSelector((state) => state.auth.user);
    const sidebarTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);
    const hydrated = useHydrated();
    const appliedTheme = hydrated ? sidebarTheme : SIDEBAR_THEMES[0];
    const isCollapsedDesktop = !isMobile && !isOpen;
    const activeParentTitle = USER_NAV_DATA.flatMap((section) => section.items).find((item) =>
        item.items.some((subItem: UserSubItem) => subItem.url === pathname)
    )?.title;

    // Use Redux state if available, otherwise fallback to props
    const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || propUserName || "User" : (propUserName || "User");
    const userPhoto = user?.photo || propUserPhoto;

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    };

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
                    "max-w-72.5 overflow-hidden border-r border-gray-200 bg-white transition-[width,padding] duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark h-full",
                    isMobile ? "fixed bottom-0 top-0 z-50 rounded-r-3xl h-screen" : "sticky top-0 h-screen",
                    isMobile
                        ? (isOpen ? "w-72.5" : "w-0 min-w-0 pr-0 pl-0 border-none")
                        : (isOpen ? "w-72.5" : "w-22"),
                )}
                style={{
                    borderRightColor: `${appliedTheme.color}30`,
                    backgroundImage: `linear-gradient(180deg, ${appliedTheme.color}08 0%, transparent 28%)`,
                }}
                aria-label="Main navigation"
                aria-hidden={isMobile && !isOpen}
            >
                <div className={cn("flex h-full flex-col py-6", isCollapsedDesktop ? "px-3" : "pl-6.25 pr-1.75")}>
                    <div className={cn("relative", isCollapsedDesktop ? "pr-0" : "pr-4.5")}>
                        {/* User Profile Header */}
                        <div className={cn("mb-8 flex items-center", isCollapsedDesktop ? "justify-center" : "gap-2 px-2")}>
                            <LoadingLink
                                href={"/user/profile"}
                                onClick={() => isMobile && toggleSidebar()}
                                className={cn("block", isCollapsedDesktop ? "px-0" : "flex-1")}
                            >
                                <div className={cn("flex items-center group", isCollapsedDesktop ? "justify-center" : "gap-3")}> 
                                    <div className="size-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-200 dark:border-gray-700 group-hover:border-[#156d95] transition-colors">
                                        <Image
                                            src={userPhoto || "/avatar.png"}
                                            width={48}
                                            height={48}
                                            alt={userName || "User"}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    {!isCollapsedDesktop && (
                                        <div className="flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#156d95] transition-colors">
                                                {userName || "User"}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                User Account
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </LoadingLink>

                            {!isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className={cn(
                                        "inline-flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-all duration-300 ease-in-out",
                                        isCollapsedDesktop ? "size-10 ml-0" : "size-10"
                                    )}
                                    title={isOpen ? "Réduire la sidebar" : "Ouvrir la sidebar"}
                                    aria-label={isOpen ? "Réduire la sidebar" : "Ouvrir la sidebar"}
                                >
                                    {isOpen ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
                                </button>
                            )}
                        </div>

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

                    <div className={cn("custom-scrollbar flex-1 overflow-y-auto", isCollapsedDesktop ? "pr-0" : "pr-3")} data-lenis-prevent>
                        {USER_NAV_DATA.map((section) => (
                            <div key={section.label} className="mb-6">
                                {!isCollapsedDesktop && (
                                    <h2 className="mb-4 px-3 text-sm font-bold uppercase tracking-widest text-gray-500/70">
                                        {section.label}
                                    </h2>
                                )}

                                <nav role="navigation" aria-label={section.label}>
                                    <ul className="space-y-1">
                                        {section.items.map((item) => (
                                            <li key={item.title}>
                                                {isCollapsedDesktop ? (
                                                    <MenuItem
                                                        as="link"
                                                        href={item.url}
                                                        isActive={pathname === item.url}
                                                        accentColor={appliedTheme.color}
                                                        className="justify-center px-0"
                                                    >
                                                        <item.icon className="size-5 shrink-0" aria-hidden="true" />
                                                    </MenuItem>
                                                ) : item.items.length > 0 ? (
                                                    <div>
                                                        <MenuItem
                                                            onClick={() => toggleExpanded(item.title)}
                                                            accentColor={appliedTheme.color}
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

                                                        {(expandedItems.includes(item.title) || activeParentTitle === item.title) && (
                                                            <ul
                                                                className="ml-9 mr-0 space-y-1 pt-1"
                                                                role="menu"
                                                            >
                                                                {item.items.map((subItem: UserSubItem) => (
                                                                    <li key={subItem.title} role="none">
                                                                        <MenuItem
                                                                            as="link"
                                                                            href={subItem.url}
                                                                            isActive={pathname === subItem.url}
                                                                            accentColor={appliedTheme.color}
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
                                                        accentColor={appliedTheme.color}
                                                        className={cn(isCollapsedDesktop && "justify-center px-0")}
                                                    >
                                                        <item.icon
                                                            className="size-5 shrink-0"
                                                            aria-hidden="true"
                                                        />
                                                        {!isCollapsedDesktop && <span>{item.title}</span>}
                                                    </MenuItem>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        ))}
                    </div>

                    {/* Theme Picker */}
                    <div className={cn("mt-6 border-t border-gray-200 pt-6 dark:border-gray-800", isCollapsedDesktop ? "px-1" : "px-3")}>
                        <ThemePicker isCollapsed={isCollapsedDesktop} />
                    </div>
                </div>
            </aside>
        </>
    );
}
