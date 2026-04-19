
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
    Award,
    LucideIcon
} from "lucide-react";

export interface NavSubItem {
    id: string;
    title: string;
    url: string;
}

export interface NavItem {
    id: string;
    title: string;
    url?: string;
    icon: LucideIcon;
    items: NavSubItem[];
}

export interface NavSection {
    id: string;
    label: string;
    items: NavItem[];
}

export const NAV_DATA: NavSection[] = [
    {
        id: "main",
        label: "Main",
        items: [
            {
                id: "dashboard",
                title: "Dashboard",
                url: "/admin",
                icon: LayoutDashboard,
                items: [],
            },
            {
                id: "analytics",
                title: "Analytics",
                url: "/admin/analytics",
                icon: BarChart3,
                items: [],
            },
            {
                id: "analyzes",
                title: "Analyzes",
                url: "/admin/Analyzes",
                icon: Activity,
                items: [],
            },
        ],
    },
    {
        id: "management",
        label: "Management",
        items: [
            {
                id: "users",
                title: "Users",
                url: "/admin/users",
                icon: Users,
                items: [
                    { id: "allUsers", title: "All Users", url: "/admin/users" },
                    { id: "verification", title: "Verification", url: "/admin/users/verify" },
                ],
            },
            {
                id: "badges",
                title: "Badges",
                url: "/admin/badges",
                icon: Award,
                items: [],
            },
            {
                id: "quizzes",
                title: "Quizzes",
                url: "/admin/quizes",
                icon: ClipboardList,
                items: [],
            },
            {
                id: "routines",
                title: "Routines",
                url: "/admin/routines",
                icon: Sparkles,
                items: [],
            },
            {
                id: "subscriptions",
                title: "Subscriptions",
                url: "/admin/subscriptions",
                icon: CreditCard,
                items: [],
            },
            {
                id: "models",
                title: "Manage Models",
                url: "/admin/models",
                icon: Package,
                items: [],
            },

        ],
    },
    {
        id: "administrative",
        label: "Administrative",
        items: [
            {
                id: "content",
                title: "Blog & Content",
                url: "/admin/content",
                icon: FileText,
                items: [
                    { id: "articles", title: "Articles", url: "/admin/content/articles" },
                    { id: "categories", title: "Categories", url: "/admin/content/categories" },
                ],
            },
            {
                id: "faqs",
                title: "FAQs",
                url: "/admin/faqs",
                icon: ClipboardList,
                items: [],
            },
            {
                id: "complaints",
                title: "Complaints & Feedback",
                url: "/admin/complaints",
                icon: MessageSquare,
                items: [],
            },
        ],
    },
    {
        id: "settings",
        label: "Settings",
        items: [
            {
                id: "profile",
                title: "Profile",
                url: "/admin/profile",
                icon: User,
                items: [],
            },
            {
                id: "systemSettings",
                title: "System Settings",
                url: "/admin/settings",
                icon: Settings,
                items: [],
            },
        ],
    },
];
