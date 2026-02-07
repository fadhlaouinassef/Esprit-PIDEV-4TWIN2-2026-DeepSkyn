"use client";

import { Sidebar } from "@/app/components/user/Sidebar";
import { Header } from "@/app/components/user/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/user/sidebar-context";
import "@/styles/satoshi.css";

interface UserLayoutProps {
    children: React.ReactNode;
    userName?: string;
    userPhoto?: string;
}

function UserLayoutContent({ children, userName, userPhoto }: UserLayoutProps) {
    const { isOpen, isMobile } = useSidebarContext();

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

export function UserLayout({ children, userName, userPhoto }: UserLayoutProps) {
    return (
        <SidebarProvider>
            <UserLayoutContent userName={userName} userPhoto={userPhoto}>
                {children}
            </UserLayoutContent>
        </SidebarProvider>
    );
}
