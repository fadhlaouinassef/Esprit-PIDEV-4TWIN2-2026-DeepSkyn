import { ChevronRight } from "lucide-react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import Profile from "@/app/ui/profile";


export const metadata = {
    title: "Admin Profile - DeepSkyn",
};

export default function AdminProfilePage() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Admin</span>
                    <ChevronRight size={14} />
                    <span className="text-gray-700 dark:text-gray-200 font-medium">Profile</span>
                </nav>
                <Profile />
            </div>
        </AdminLayout>
    );
}

