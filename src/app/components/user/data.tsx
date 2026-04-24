"use client";

import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    Bell,
    ShieldCheck,
    CreditCard,
    CircleHelp,
    Sparkles,
    ClipboardList,
    BarChart2,
    Package,
    MessageSquare
} from "lucide-react";

export const USER_NAV_DATA = [
    {
        id: "menu",
        label: "Menu",
        items: [
            {
                id: "dashboard",
                title: "Dashboard",
                icon: LayoutDashboard,
                url: "/user",
                items: []
            },
            {
                id: "routines",
                title: "Routines",
                icon: Sparkles,
                url: "/user/routines",
                items: []
            },
            {
                id: "questionnaire",
                title: "Questionnaire",
                icon: ClipboardList,
                url: "/user/questionnaire",
                items: []
            },
            {
                id: "analyzes",
                title: "Analyzes",
                icon: BarChart2,
                url: "/user/analyzes",
                items: []
            },
            {
                id: "products",
                title: "Products",
                icon: Package,
                url: "/user/products",
                items: []
            },
            {
                id: "badge",
                title: "Badge",
                icon: ShieldCheck,
                url: "/user/badge",
                items: []
            },
            {
                id: "profile",
                title: "Profile",
                icon: User,
                url: "/user/profile",
                items: []
            },
        ]
    },
    {
        id: "account",
        label: "Account",
        items: [
            {
                id: "billing",
                title: "Billing",
                icon: CreditCard,
                url: "/user/billing",
                items: []
            },
            {
                id: "security",
                title: "Security",
                icon: ShieldCheck,
                url: "/user/security",
                items: []
            },
            {
                id: "settings",
                title: "Settings",
                icon: Settings,
                url: "/user/settings",
                items: []
            }
        ]
    },
    {
        id: "support",
        label: "Support",
        items: [
            {
                id: "helpCenter",
                title: "Help Center",
                icon: CircleHelp,
                url: "/user/helpcenter",
                items: []
            },
            {
                id: "complaints",
                title: "Complaints & Feedback",
                icon: MessageSquare,
                url: "/user/complaints",
                items: []
            }
        ]
    }
];
