import { UserLayout } from "@/app/ui/UserLayout";
import Profile from "./profile";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export const metadata = {
    title: "Settings - DeepSkyn User",
};

export default async function SettingsPage() {
    const t = await getTranslations("userSettingsPage");

    return (
        <UserLayout>
            <div className="mx-auto w-full max-w-[1200px] space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>{t("breadcrumb.user")}</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-medium">{t("breadcrumb.settings")}</span>
                </nav>

                <div className="mb-8">

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {t("title")}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t("subtitle")}
                    </p>
                </div>
                <Profile />
            </div>
        </UserLayout>
    );
}
