
"use client";

import { Search, Menu, Moon, Sun, SlidersHorizontal, Check } from "lucide-react";
import { useSidebarContext } from "../admin/sidebar-context";
import { useState } from "react";
import { Notification } from "./Notification";
import { UserInfo } from "./UserInfo";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "../LanguageSwitcher";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setColorBlindAssistMode, SIDEBAR_THEMES, toggleDyslexiaMode, toggleHighContrastMode } from "@/store/slices/uiThemeSlice";
import { useHydrated } from "@/hooks/use-hydrated";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

const ACCESSIBILITY_MODES = [
    "High Contrast",
    "Dyslexia Friendly",
    "Large Text",
    "Reduced Motion",
];

const COLOR_ASSIST_OPTIONS = [
    { label: "Off", value: "none" },
    { label: "Protan (rouge)", value: "protanopia" },
    { label: "Deutan (vert)", value: "deuteranopia" },
    { label: "Tritan (bleu)", value: "tritanopia" },
] as const;

export function Header() {
    const { toggleSidebar } = useSidebarContext();
    const [darkMode, setDarkMode] = useState(false);
    const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
    const [selectedAccessibilityModes, setSelectedAccessibilityModes] = useState<string[]>([]);
    const dispatch = useAppDispatch();
    const sidebarTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);
    const highContrastMode = useAppSelector((state) => state.uiTheme.highContrastMode);
    const dyslexiaMode = useAppSelector((state) => state.uiTheme.dyslexiaMode);
    const colorBlindAssistMode = useAppSelector((state) => state.uiTheme.colorBlindAssistMode);
    const hydrated = useHydrated();
    const appliedTheme = hydrated ? sidebarTheme : SIDEBAR_THEMES[0];

    const t = useTranslations();

    return (
        <header
            className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-dark md:px-10"
            style={{
                borderBottomColor: `${appliedTheme.color}33`,
                boxShadow: `inset 0 -1px 0 ${appliedTheme.color}1F`,
            }}
        >
            {/* Left side: Dashboard Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-lg border border-gray-100 p-1.5 dark:border-gray-700 dark:bg-gray-900 transition-colors hover:bg-gray-50 lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                    <span className="sr-only">{t('common.toggleSidebar')}</span>
                </button>

                <div className="relative max-sm:hidden">
                    <button
                        onClick={() => setIsAccessibilityOpen((prev) => !prev)}
                        className={cn(
                            "group flex items-center gap-2 rounded-full border border-gray-100 bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 backdrop-blur-sm transition-all hover:border-gray-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-200",
                            isAccessibilityOpen && "border-[#156d95] ring-1 ring-[#156d95]"
                        )}
                    >
                        <SlidersHorizontal className="h-4 w-4 text-[#156d95] transition-transform group-hover:rotate-12" />
                        <span className="hidden lg:inline-block">
                            {selectedAccessibilityModes.length > 0
                                                                ? t('accessibility.modesCount', {
                                                                        count: selectedAccessibilityModes.length + (highContrastMode ? 1 : 0) + (dyslexiaMode ? 1 : 0),
                                                                    })
                                : t('accessibility.title')}
                        </span>
                        <span className="lg:hidden">{t('accessibility.shortTitle')}</span>
                    </button>

                    <AnimatePresence>
                        {isAccessibilityOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={() => setIsAccessibilityOpen(false)}
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute left-0 mt-3 z-50 w-56 origin-top-left rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950"
                                >
                                    <div className="space-y-1">
                                        {ACCESSIBILITY_MODES.map((mode) => {
                                            const isActive =
                                                mode === "High Contrast"
                                                    ? highContrastMode
                                                    : mode === "Dyslexia Friendly"
                                                        ? dyslexiaMode
                                                        : selectedAccessibilityModes.includes(mode);

                                            const label = (() => {
                                                switch (mode) {
                                                    case 'High Contrast':
                                                        return t('accessibility.highContrast');
                                                    case 'Dyslexia Friendly':
                                                        return t('accessibility.dyslexiaFont');
                                                    case 'Large Text':
                                                        return t('accessibility.largeText');
                                                    case 'Reduced Motion':
                                                        return t('accessibility.reducedMotion');
                                                    default:
                                                        return mode;
                                                }
                                            })();

                                            return (
                                                <button
                                                    key={mode}
                                                    onClick={() => {
                                                        if (mode === "High Contrast") {
                                                            dispatch(toggleHighContrastMode());
                                                        } else if (mode === "Dyslexia Friendly") {
                                                            dispatch(toggleDyslexiaMode());
                                                        } else {
                                                            setSelectedAccessibilityModes((prev) =>
                                                                prev.includes(mode)
                                                                    ? prev.filter((item) => item !== mode)
                                                                    : [...prev, mode]
                                                            );
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                                                        isActive
                                                            ? "bg-[#156d95]/10 text-[#156d95] font-semibold"
                                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                                                    )}
                                                >
                                                    <span>{label}</span>
                                                    {isActive && <Check className="h-4 w-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />

                                    <div className="space-y-1">
                                        <div className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {t('accessibility.colorAssist')}
                                        </div>
                                        {COLOR_ASSIST_OPTIONS.map((opt) => {
                                            const isActive = colorBlindAssistMode === opt.value;
                                            const label = (() => {
                                                switch (opt.value) {
                                                    case 'none':
                                                        return t('accessibility.off');
                                                    case 'protanopia':
                                                        return t('accessibility.protan');
                                                    case 'deuteranopia':
                                                        return t('accessibility.deutan');
                                                    case 'tritanopia':
                                                        return t('accessibility.tritan');
                                                }
                                            })();
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => dispatch(setColorBlindAssistMode(opt.value))}
                                                    className={cn(
                                                        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all",
                                                        isActive
                                                            ? "bg-[#156d95]/10 text-[#156d95] font-semibold"
                                                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                                                    )}
                                                >
                                                    <span>{label}</span>
                                                    {isActive && <Check className="h-4 w-4" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right side: Search, Toggle, Notifications, User */}
            <div className="flex items-center gap-3 sm:gap-6">
                <LanguageSwitcher />
                {/* Search Bar */}
                <div className="relative hidden md:block w-70">
                    <input
                        type="search"
                        placeholder={t('common.search')}
                        className="w-full rounded-full border-none bg-gray-50 py-3 pl-12 pr-5 text-sm outline-none transition-all focus:ring-1 focus:ring-gray-200 dark:bg-gray-900/50 dark:text-white dark:focus:ring-gray-700"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                {/* Pill Theme Toggle */}
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
                        darkMode ? "bg-[#156d95] shadow-sm text-white" : "text-gray-400"
                    )}
                        style={darkMode ? { backgroundColor: appliedTheme.color } : undefined}
                    >
                        <Moon className="w-5 h-5" />
                    </div>
                </div>

                {/* Notification */}
                <Notification />

                {/* User Info */}
                <UserInfo />
            </div>
        </header>
    );
}
