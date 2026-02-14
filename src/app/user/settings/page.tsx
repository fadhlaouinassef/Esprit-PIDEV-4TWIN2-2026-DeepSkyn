
import { UserLayout } from "@/app/ui/UserLayout";
import Profile from "./profile";

export const metadata = {
    title: "Settings - DeepSkyn User",
};

export default function SettingsPage() {
    return (
        <UserLayout userName="Nassef" userPhoto="/avatar.png">
            <div className="mx-auto w-full max-w-[1200px]">
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
