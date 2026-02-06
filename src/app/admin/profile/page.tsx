
import { AdminLayout } from "@/app/ui/AdminLayout";
import Profile from "@/app/ui/profile";

export const metadata = {
    title: "Admin Profile - DeepSkyn",
};

export default function AdminProfilePage() {
    return (
        <AdminLayout>
            <Profile />
        </AdminLayout>
    );
}
