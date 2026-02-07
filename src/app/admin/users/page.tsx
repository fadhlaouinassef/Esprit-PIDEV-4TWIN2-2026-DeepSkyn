
"use client";

import React from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { ListeUtilisateurs } from "@/app/components/admin/ListeUtilisateurs";
import { UserCharts } from "@/app/components/admin/UserCharts";

const MOCK_USERS = [
    {
        name: "Alex Thompson",
        visitors: 1240,
        revenues: 2450,
        sales: 12,
        conversion: 0.9,
        logo: "/avatar.png",
    },
    {
        name: "Sarah Jenkins",
        visitors: 850,
        revenues: 1890,
        sales: 8,
        conversion: 0.9,
        logo: "/avatar.png",
    },
    {
        name: "Michael Chen",
        visitors: 2100,
        revenues: 5600,
        sales: 45,
        conversion: 2.1,
        logo: "/avatar.png",
    },
    {
        name: "Elena Rodriguez",
        visitors: 560,
        revenues: 980,
        sales: 4,
        conversion: 0.7,
        logo: "/avatar.png",
    },
    {
        name: "David Smith",
        visitors: 1890,
        revenues: 3420,
        sales: 28,
        conversion: 1.4,
        logo: "/avatar.png",
    },
];

function Breadcrumb({ pageName }: { pageName: string }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pageName}
            </h2>
            <nav>
                <ol className="flex items-center gap-2">
                    <li>
                        <a className="font-medium text-gray-500 hover:text-primary" href="/admin">
                            Dashboard /
                        </a>
                    </li>
                    <li className="font-medium text-primary">{pageName}</li>
                </ol>
            </nav>
        </div>
    );
}

export default function UsersPage() {
    return (
        <AdminLayout>
            <div className="mx-auto w-full max-w-[1200px] p-4 md:p-6">
                <Breadcrumb pageName="Users" />

                {/* Visual Analytics Section */}
                <UserCharts users={MOCK_USERS} />

                {/* Users List Table Component */}
                <ListeUtilisateurs users={MOCK_USERS} />
            </div>
        </AdminLayout>
    );
}

