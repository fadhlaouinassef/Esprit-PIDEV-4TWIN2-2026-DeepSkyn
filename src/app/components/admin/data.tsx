
import { LayoutDashboard, Users, Settings, User, LucideIcon } from "lucide-react";

export interface NavSubItem {
    title: string;
    url: string;
}

export interface NavItem {
    title: string;
    url?: string;
    icon: LucideIcon;
    items: NavSubItem[];
}

export interface NavSection {
    label: string;
    items: NavItem[];
}

export const NAV_DATA: NavSection[] = [
    {
        label: "Main",
        items: [
            {
                title: "Dashboard",
                url: "/admin",
                icon: LayoutDashboard,
                items: [],
            },
            {
                title: "Users",
                url: "/admin/users",
                icon: Users,
                items: [],
            },
            {
                title: "Profile",
                url: "/admin/profile",
                icon: User,
                items: [],
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                title: "Settings",
                url: "/admin/settings",
                icon: Settings,
                items: [],
            },
        ],
    },
];
