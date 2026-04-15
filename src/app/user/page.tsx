"use client";

import React from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";

export default function UserDashboard() {
    const t = useTranslations("userDashboard");
    const user = useAppSelector((state) => state.auth.user);
    const displayName = user ? `${user.nom || ''} ${user.prenom || ''}`.trim() || t("fallbackName") : t("fallbackName");

    return (
        <UserLayout>
            <div className="user-dashboard-page mx-auto w-full max-w-[1200px]">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t("welcome", { name: displayName })}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("stats.totalScans")}</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">24</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("stats.activePlans")}</h3>
                        <p className="mt-2 text-3xl font-bold text-primary">Pro</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("stats.notifications")}</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">3</p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="size-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl text-gray-300">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("empty.title")}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            {t("empty.description")}
                        </p>
                        <button className="mt-6 rounded-lg bg-primary px-6 py-3 text-white font-bold hover:bg-primary/90 transition-all">
                            {t("empty.cta")}
                        </button>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
