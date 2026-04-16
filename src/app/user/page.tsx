"use client";

import React from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { useAppSelector } from "@/store/hooks";
import InteractivePortrait from "@/app/components/user/interactive-portrait";
import Image from "next/image";
import {
    ArrowRight,
    CheckCircle2,
    Droplets,
    Sparkles,
    Shield,
    Clock3,
    ScanLine,
    TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

export default function UserDashboard() {
    const user = useAppSelector((state) => state.auth.user);
    const displayName = user ? `${user.prenom || ""} ${user.nom || ""}`.trim() || "Nassef" : "Nassef";

    const chartItems = [
        { label: "Acne Level", delta: "-12%", positive: true, bars: [34, 29, 31, 21, 27, 15] },
        { label: "Hydration", delta: "+8%", positive: true, bars: [41, 45, 52, 48, 55, 63] },
        { label: "Texture", delta: "Stable", positive: true, bars: [26, 29, 28, 31, 30, 32] },
    ];

    const timeline = [
        { title: "Base Scan", date: "May 12", image: "/skin1.jpg" },
        { title: "Initial Results", date: "June 05", image: "/skin2.jpg" },
        { title: "Major Glow Lift", date: "July 10", image: "/skin3.jpg" },
        { title: "Optimal Peak", date: "Today", image: "/logo.png", current: true },
    ];

    return (
        <UserLayout>
            <div className="user-dashboard-page mx-auto w-full max-w-330 space-y-8">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                        Welcome back, {displayName}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
                        Here is your skin journey overview today.
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-4 space-y-6">
                        <motion.div
                            whileHover={{ y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-[28px] border border-white/60 bg-white/75 backdrop-blur-lg p-4 shadow-[0_20px_40px_rgba(21,109,149,0.12)] dark:bg-gray-900/60 dark:border-gray-700/60"
                        >
                            <div className="h-70 md:h-85 rounded-3xl overflow-hidden bg-[#1a1f1a]">
                                <InteractivePortrait />
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                        >
                            <div className="flex items-center gap-4 mb-5">
                                <Image
                                    src={user?.photo || "/avatar.png"}
                                    alt={displayName}
                                    width={68}
                                    height={68}
                                    className="size-17 rounded-full object-cover border-2 border-[#156d95]/25"
                                />
                                <div>
                                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{displayName}</p>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Combination / Oily</p>
                                </div>
                                <span className="ml-auto px-3 py-1 rounded-full text-xs font-extrabold bg-linear-to-r from-[#2f8eff] to-[#7a5cff] text-white shadow-md">Pro</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Skin Score</p>
                                    <p className="text-2xl font-black text-[#156d95]">87/100</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Plan</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">PRO</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    <span>Routine Consistency</span>
                                    <span className="text-[#156d95]">92%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    <div className="h-full w-[92%] bg-linear-to-r from-[#2f8eff] to-[#7a5cff]" />
                                </div>
                            </div>

                            <button className="w-full rounded-2xl py-3 text-sm font-bold text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                View Profile
                            </button>
                        </motion.div>
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Skin Progress Overview</h2>
                                    <p className="text-sm text-gray-500">Clinical metrics comparison over the last 30 days</p>
                                </div>
                                <button className="text-xs font-bold px-3 py-2 rounded-full bg-indigo-50 text-indigo-600">Full Report</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {chartItems.map((item) => (
                                    <div key={item.label} className="rounded-2xl bg-gray-50/90 dark:bg-gray-800/70 p-4 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">{item.label}</p>
                                            <span className={`text-xs font-extrabold ${item.positive ? "text-emerald-500" : "text-rose-500"}`}>{item.delta}</span>
                                        </div>
                                        <div className="h-16 flex items-end gap-1.5">
                                            {item.bars.map((height, idx) => (
                                                <div
                                                    key={`${item.label}-${idx}`}
                                                    className={`flex-1 rounded-t ${idx === item.bars.length - 1 ? "bg-linear-to-t from-[#5f46ff] to-[#2f8eff]" : "bg-gray-200 dark:bg-gray-700"}`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Today Routine Status</h3>
                                    <Clock3 className="size-5 text-[#156d95]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-2xl bg-emerald-50/80 border border-emerald-100 p-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="size-4 text-emerald-600" />
                                            <span className="text-sm font-semibold text-gray-800">Morning routine completed</span>
                                        </div>
                                        <span>✅</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 border border-amber-100 p-3">
                                        <div className="flex items-center gap-2">
                                            <Clock3 className="size-4 text-amber-600" />
                                            <span className="text-sm font-semibold text-gray-800">Night routine pending</span>
                                        </div>
                                        <span>⏳</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl bg-blue-50/80 border border-blue-100 p-3">
                                        <div className="flex items-center gap-2">
                                            <Droplets className="size-4 text-blue-600" />
                                            <span className="text-sm font-semibold text-gray-800">Hydration reminder</span>
                                        </div>
                                        <span>💧</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -3 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent Scans</h3>
                                    <ScanLine className="size-5 text-[#156d95]" />
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total scans this month</p>
                                        <p className="text-3xl font-black text-gray-900 dark:text-white">24</p>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Last scan date</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">July 24, 2024</p>
                                    </div>
                                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-linear-to-r from-[#2f8eff] to-[#6f4dff] text-white font-bold shadow-md hover:shadow-xl transition-all">
                                        Compare with previous scan
                                        <ArrowRight className="size-4" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">AI Recommendations</h3>
                                <Sparkles className="size-5 text-indigo-500" />
                            </div>
                            <div className="space-y-3">
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3 flex items-start gap-2">
                                    <Shield className="size-4 mt-0.5 text-indigo-600" />
                                    <p className="text-sm font-semibold text-gray-800">Use SPF today to protect your barrier.</p>
                                </div>
                                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3 flex items-start gap-2">
                                    <Droplets className="size-4 mt-0.5 text-blue-600" />
                                    <p className="text-sm font-semibold text-gray-800">Increase hydration intake and add a humectant serum.</p>
                                </div>
                                <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-3 flex items-start gap-2">
                                    <TrendingUp className="size-4 mt-0.5 text-violet-600" />
                                    <p className="text-sm font-semibold text-gray-800">Avoid over-exfoliation this week for better texture recovery.</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg dark:bg-gray-900/70 dark:border-gray-700/60"
                >
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-5">Skin Journey Milestones</h3>
                    <div className="overflow-x-auto">
                        <div className="min-w-190 flex items-center justify-between gap-4">
                            {timeline.map((item, index) => (
                                <React.Fragment key={item.title}>
                                    <div className="flex flex-col items-center text-center min-w-37.5">
                                        <div className={`relative size-20 rounded-full overflow-hidden border-2 ${item.current ? "border-blue-500 shadow-[0_0_0_5px_rgba(59,130,246,0.2)]" : "border-gray-200"}`}>
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <p className="mt-2 text-sm font-bold text-gray-800 dark:text-gray-100">{item.title}</p>
                                        <p className="text-xs text-gray-400">{item.date}</p>
                                    </div>
                                    {index < timeline.length - 1 && (
                                        <div className="h-0.5 flex-1 bg-linear-to-r from-gray-200 via-blue-300 to-violet-300 rounded-full" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </UserLayout>
    );
}
