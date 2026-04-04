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
        label: "Menu",
        items: [
            {
                title: "Dashboard",
                icon: LayoutDashboard,
                url: "/user",
                items: []
            },
            {
                title: "Routines",
                icon: Sparkles,
                url: "/user/routines",
                items: []
            },
            {
                title: "Questionnaire",
                icon: ClipboardList,
                url: "/user/questionnaire",
                items: []
            },
            {
                title: "Analyzes",
                icon: BarChart2,
                url: "/user/Analyzes",
                items: []
            },
            {
                title: "Products",
                icon: Package,
                url: "/user/products",
                items: []
            },
            {
                title: "Badge",
                icon: ShieldCheck,
                url: "/user/badge",
                items: []
            },
            {
                title: "Profile",
                icon: User,
                url: "/user/profile",
                items: []
            },
        ]
    },
    {
        label: "Account",
        items: [
            {
                title: "Billing",
                icon: CreditCard,
                url: "/user/billing",
                items: []
            },
            {
                title: "Security",
                icon: ShieldCheck,
                url: "/user/security",
                items: []
            },
            {
                title: "Settings",
                icon: Settings,
                url: "/user/settings",
                items: []
            }
        ]
    },
    {
        label: "Support",
        items: [
            {
                title: "Help Center",
                icon: CircleHelp,
                url: "/user/help center",
                items: []
            },
            {
                title: "Complaints & Feedback",
                icon: MessageSquare,
                url: "/user/complaints",
                items: []
            }
        ]
    }
];
