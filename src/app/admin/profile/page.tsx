import { AdminLayout } from "@/app/ui/AdminLayout";
import Profile from "@/app/ui/profile";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
    const t = await getTranslations("adminProfilePage");
    return {
        title: t("title"),
    };
}

export default function AdminProfilePage() {
    return (
        <AdminLayout>
            <Profile />
        </AdminLayout>
    );
}

