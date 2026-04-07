"use client";

import React from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { useAppSelector } from "@/store/hooks";

export default function UserDashboard() {
    const user = useAppSelector((state) => state.auth.user);
    const displayName = user ? `${user.nom || ''} ${user.prenom || ''}`.trim() || "there" : "there";

    return (
        <UserLayout>
            <div className="user-dashboard-page mx-auto w-full max-w-[1200px]">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {displayName}!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Here is what&apos;s happening with your account today.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Scans</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">24</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Plans</h3>
                        <p className="mt-2 text-3xl font-bold text-primary">Pro</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notifications</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">3</p>
                    </div>
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        <div className="size-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl text-gray-300">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No activity yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            You haven&apos;t performed any skin scans yet. Start your first scan to see your results here.
                        </p>
                        <button className="mt-6 rounded-lg bg-primary px-6 py-3 text-white font-bold hover:bg-primary/90 transition-all">
                            Start New Scan
                        </button>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
