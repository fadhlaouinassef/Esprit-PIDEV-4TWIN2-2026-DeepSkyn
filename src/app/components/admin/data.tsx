
import {
    LayoutDashboard,
    Users,
    Settings,
    User,
    Package,
    BarChart3,
    CreditCard,
    Sparkles,
    FileText,
    MessageSquare,
    ClipboardList,
    Activity,
    Globe,
    LucideIcon
} from "lucide-react";

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
                title: "Analytics",
                url: "/admin/analytics",
                icon: BarChart3,
                items: [],
            },
            {
                title: "Analyzes",
                url: "/admin/Analyzes",
                icon: Activity,
                items: [],
            },
        ],
    },
    {
        label: "Management",
        items: [
            {
                title: "Users",
                url: "/admin/users",
                icon: Users,
                items: [
                    { title: "All Users", url: "/admin/users" },
                    { title: "Verification", url: "/admin/users/verify" },
                    { title: "Badges", url: "/admin/users/badges" },
                ],
            },
            {
                title: "Quizzes",
                url: "/admin/quizes",
                icon: ClipboardList,
                items: [],
            },
            {
                title: "Routines",
                url: "/admin/routines",
                icon: Sparkles,
                items: [],
            },
            {
                title: "Subscriptions",
                url: "/admin/subscriptions",
                icon: CreditCard,
                items: [],
            },

        ],
    },
    {
        label: "Administrative",
        items: [
            {
                title: "Blog & Content",
                url: "/admin/content",
                icon: FileText,
                items: [
                    { title: "Articles", url: "/admin/content/articles" },
                    { title: "Categories", url: "/admin/content/categories" },
                ],
            },
            {
                title: "FAQs",
                url: "/admin/faqs",
                icon: ClipboardList,
                items: [],
            },
            {
                title: "Feedback",
                url: "/admin/feedback",
                icon: MessageSquare,
                items: [],
            },
        ],
    },
    {
        label: "Settings",
        items: [
            {
                title: "Profile",
                url: "/admin/profile",
                icon: User,
                items: [],
            },
            {
                title: "System Settings",
                url: "/admin/settings",
                icon: Settings,
                items: [],
            },
        ],
    },
];
