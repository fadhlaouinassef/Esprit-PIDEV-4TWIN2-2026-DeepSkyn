
"use client";

import { Logo } from "@/app/components/logo";
import { cn } from "@/lib/utils";
import { LoadingLink } from "../LoadingLink";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar() {
    const pathname = usePathname();
    const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    };

    useEffect(() => {
        // Keep collapsible open, when it's subpage is active
        NAV_DATA.some((section) => {
            return section.items.some((item) => {
                return item.items.some((subItem: any) => {
                    if (subItem.url === pathname) {
                        if (!expandedItems.includes(item.title)) {
                            toggleExpanded(item.title);
                        }
                        return true;
                    }
                });
            });
        });
    }, [pathname]);

    return (
        <>
            {/* Mobile Overlay */}
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
                        <LoadingLink
                            href={"/"}
                            onClick={() => isMobile && toggleSidebar()}
                            className="block mb-8 px-2"
                        >
                            <Logo />
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

                    {/* Navigation */}
                    <div className="custom-scrollbar flex-1 overflow-y-auto pr-3" data-lenis-prevent>
                        {NAV_DATA.map((section) => (
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
                                                    (() => {
                                                        const href =
                                                            "url" in item
                                                                ? item.url + ""
                                                                : "/" +
                                                                item.title.toLowerCase().split(" ").join("-");

                                                        return (
                                                            <MenuItem
                                                                as="link"
                                                                href={href}
                                                                isActive={pathname === href}
                                                            >
                                                                <item.icon
                                                                    className="size-5 shrink-0"
                                                                    aria-hidden="true"
                                                                />

                                                                <span>{item.title}</span>
                                                            </MenuItem>
                                                        );
                                                    })()
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
