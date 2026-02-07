"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsOpen(false);
            else setIsOpen(true);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar, isMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebarContext() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebarContext must be used within a SidebarProvider");
    }
    return context;
}
