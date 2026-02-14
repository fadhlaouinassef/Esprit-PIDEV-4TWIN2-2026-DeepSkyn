"use client";

import React from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { UserBadgeCard } from "@/app/components/user/UserBadgeCard";

export default function BadgePage() {
    const user = {
        name: "Nassef",
        photo: "/avatar.png",
        badgeName: "Ruby Master",
        variant: "ruby" as const, //niveau du badge
        description: "Awarded for completing the initial skin analysis and contributing to the DeepSkyn community with helpful insights."
    };

    return (
        <UserLayout userName={user.name} userPhoto={user.photo}>
            <div className="mx-auto w-full max-w-[1000px] flex flex-col items-center py-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Your Achievement Badge
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                        This badge represents your journey and commitment to healthy skin.
                        As you progress through your routines, your badge will evolve.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-12 bg-white dark:bg-gray-800/50 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-xl dark:shadow-2xl">
                    <UserBadgeCard
                        userPhoto={user.photo}
                        userName={user.name}
                        badgeTitle={user.badgeName}
                        description={user.description}
                        variant={user.variant}
                    />

                    <div className="flex-1 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Metallic Elegance</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Your current badge is crafted with a metallic gold finish, symbolizing
                                your advanced professional skin tracking journey.
                                It features a turbulent displacement effect that gives it a living,
                                fluctuating energy.
                            </p>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                            <h4 className="text-primary font-bold mb-2">How to upgrade?</h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
                                <li>Complete 7 consecutive days of your routine</li>
                                <li>Perform 3 skin scans in a month</li>
                                <li>Achievement: "The Skin Whisperer"</li>
                            </ul>
                        </div>

                        <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                            Share My Badge
                        </button>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
