import { UserLayout } from "@/app/ui/UserLayout";
import Profile from "./profile";
import { ChevronRight } from "lucide-react";

export const metadata = {
    title: "Settings - DeepSkyn User",
};

export default function SettingsPage() {
    return (
        <UserLayout userName="Nassef" userPhoto="/avatar.png">
            <div className="mx-auto w-full max-w-[1200px] space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>User</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-medium">Settings</span>
                </nav>

                <div className="mb-8">

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Account Settings
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Manage your profile information, password, and preferences.
                    </p>
                </div>
                <Profile />
            </div>
        </UserLayout>
    );
}
