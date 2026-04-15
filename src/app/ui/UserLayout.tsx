"use client";

import { Sidebar } from "@/app/components/user/Sidebar";
import { Header } from "@/app/components/user/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/user/sidebar-context";
import { useNavigation } from "@/app/components/NavigationProvider";
import { Loader2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { setUser } from "@/store/slices/authSlice";
import { SIDEBAR_THEMES } from "@/store/slices/uiThemeSlice";
import { useHydrated } from "@/hooks/use-hydrated";
import "@/app/css/satoshi.css";
import { useTranslations } from "next-intl";

interface UserLayoutProps {
    children: React.ReactNode;
    /** @deprecated Les données viennent maintenant de Redux - ces props sont ignorées */
    userName?: string;
    /** @deprecated Les données viennent maintenant de Redux - ces props sont ignorées */
    userPhoto?: string;
}

function UserLayoutContent({ children }: UserLayoutProps) {
    useSidebarContext();
    const { isLoading } = useNavigation();
    const t = useTranslations();
    const user = useAppSelector((state) => state.auth.user);
    const sidebarTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);
    const highContrastMode = useAppSelector((state) => state.uiTheme.highContrastMode);
    const dyslexiaMode = useAppSelector((state) => state.uiTheme.dyslexiaMode);
    const hydrated = useHydrated();
    const appliedTheme = hydrated ? sidebarTheme : SIDEBAR_THEMES[0];
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!user) {
            const storedUser = localStorage.getItem('deepskyn_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    dispatch(setUser(parsedUser));
                } catch (e) {
                    console.error("Failed to parse stored user", e);
                }
            }
        }
    }, [user, dispatch]);

    const userName = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() || "User" : "User";
    const userPhoto = user?.photo || "/avatar.png";

    return (
        <div
            className={`flex min-h-screen bg-gray-50 dark:bg-gray-900 text-lg font-medium ${highContrastMode ? "user-high-contrast" : ""} ${dyslexiaMode ? "dyslexia-mode" : ""}`}
            style={{
                fontFamily: dyslexiaMode
                    ? '"OpenDyslexic", "Atkinson Hyperlegible", "Arial", sans-serif'
                    : "Satoshi, sans-serif",
                backgroundImage: `radial-gradient(circle at 10% 0%, ${appliedTheme.color}24 0%, transparent 40%)`,
            }}
        >
            <Sidebar userName={userName} userPhoto={userPhoto} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
                <Header userName={userName} userPhoto={userPhoto} />

                <main
                    className="relative flex-1 overflow-auto p-4 md:p-6 lg:p-8"
                    style={{
                        backgroundImage: `linear-gradient(180deg, ${appliedTheme.color}12 0%, transparent 220px)`,
                    }}
                >
                    {isLoading && (
                        <div className="absolute inset-0 z-20 rounded-2xl bg-gray-50/90 dark:bg-gray-900/85 backdrop-blur-[1px]">
                            <div className="h-full w-full p-4 md:p-6 lg:p-8 animate-pulse space-y-6">
                                <div className="h-10 w-1/3 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-28 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                    <Loader2 className="size-4 animate-spin" />
                                    {t('common.loadingPage')}
                                </div>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}

export function UserLayout({ children }: UserLayoutProps) {
    return (
        <SidebarProvider>
            <UserLayoutContent>{children}</UserLayoutContent>
        </SidebarProvider>
    );
}
