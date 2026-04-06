
"use client";

import { Sidebar } from "@/app/components/admin/Sidebar";
import { Header } from "@/app/components/admin/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/admin/sidebar-context";
import { useNavigation } from "@/app/components/NavigationProvider";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import "@/app/css/satoshi.css";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    useSidebarContext();
    const { isLoading } = useNavigation();
    const sidebarTheme = useAppSelector((state) => state.uiTheme.sidebarTheme);

    return (
        <div
            className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-lg font-medium"
            style={{
                fontFamily: "Satoshi, sans-serif",
                backgroundImage: `radial-gradient(circle at 10% 0%, ${sidebarTheme.color}24 0%, transparent 40%)`,
            }}
        >
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
                <Header />

                <main
                    className="relative flex-1 overflow-auto p-4 md:p-6 lg:p-8"
                    style={{
                        backgroundImage: `linear-gradient(180deg, ${sidebarTheme.color}12 0%, transparent 220px)`,
                    }}
                >
                    {isLoading && (
                        <div className="absolute inset-0 z-20 rounded-2xl bg-gray-50/90 dark:bg-gray-900/85 backdrop-blur-[1px]">
                            <div className="h-full w-full p-4 md:p-6 lg:p-8 animate-pulse space-y-6">
                                <div className="h-10 w-1/3 rounded-xl bg-gray-200 dark:bg-gray-700" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                    <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="h-72 rounded-2xl bg-gray-200 dark:bg-gray-700" />
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

export function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </SidebarProvider>
    );
}
