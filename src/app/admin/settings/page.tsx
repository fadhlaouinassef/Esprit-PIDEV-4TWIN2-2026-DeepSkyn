
import { AdminLayout } from "@/app/ui/AdminLayout";
import Profile from "./profile";

export const metadata = {
    title: "Settings - DeepSkyn Admin",
};

export default function SettingsPage() {
    return (
        <AdminLayout>
            <Profile />
        </AdminLayout>
    );
}
