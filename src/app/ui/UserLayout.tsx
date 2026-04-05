"use client";

import { Sidebar } from "@/app/components/user/Sidebar";
import { Header } from "@/app/components/user/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/user/sidebar-context";
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
    const { isOpen, isMobile } = useSidebarContext();
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

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
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
