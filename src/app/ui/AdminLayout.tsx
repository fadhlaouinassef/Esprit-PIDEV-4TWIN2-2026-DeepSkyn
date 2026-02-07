
"use client";

import { Sidebar } from "@/app/components/admin/Sidebar";
import { Header } from "@/app/components/admin/Header";
import { SidebarProvider, useSidebarContext } from "@/app/components/admin/sidebar-context";
import "@/app/css/satoshi.css";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { isOpen, isMobile } = useSidebarContext();

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-lg font-medium" style={{ fontFamily: "Satoshi, sans-serif" }}>
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-200">
                <Header />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
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
