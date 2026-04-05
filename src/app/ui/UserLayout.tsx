"use client";

import { Sidebar } from "@/app/components/user/Sidebar";
import { Header } from "@/app/components/user/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/user/sidebar-context";
import { useNavigation } from "@/app/components/NavigationProvider";
import { Loader2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { setUser } from "@/store/slices/authSlice";
import "@/app/css/satoshi.css";

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
    const user = useAppSelector((state) => state.auth.user);
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
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-lg font-medium" style={{ fontFamily: "Satoshi, sans-serif" }}>
            <Sidebar userName={userName} userPhoto={userPhoto} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
                <Header userName={userName} userPhoto={userPhoto} />

                <main className="relative flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
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
                                    Chargement de la page...
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
