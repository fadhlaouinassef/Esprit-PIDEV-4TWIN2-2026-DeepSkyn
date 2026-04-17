"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { useAppSelector } from "@/store/hooks";
import InteractivePortrait from "@/app/components/user/interactive-portrait";
import Image from "next/image";
import Link from "next/link";
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

type ChartItem = {
    label: string;
    delta: string;
    positive: boolean;
    bars: number[];
};

type DashboardOverviewPayload = {
    user?: {
        fullName?: string;
        image?: string | null;
        plan?: string;
        skinType?: string | null;
    };
    summary?: {
        skinScore?: number | null;
        periodDays?: number;
    };
    progressOverview?: {
        chartItems?: ChartItem[];
    };
    routineToday?: {
        morning?: {
            configured?: boolean;
            completed?: boolean;
        };
        night?: {
            configured?: boolean;
            completed?: boolean;
        };
        consistency?: {
            percentage?: number;
        };
        hydrationReminder?: {
            level?: "high" | "normal" | "good";
            message?: string;
        };
    };
    recentScans?: {
        totalThisMonth?: number;
        lastScanAt?: string | null;
        canCompare?: boolean;
    };
    aiRecommendations?: {
        immediate?: string[];
        weekly?: string[];
        avoid?: string[];
        source?: "analysis" | "fallback";
        analysisId?: number | null;
        generatedAt?: string | null;
    };
    skinJourney?: {
        hasUploadedSurveyImages?: boolean;
        firstUploadedImage?: {
            id?: number;
            image?: string;
            createdAt?: string;
            analysisId?: number;
        } | null;
        latestUploadedImage?: {
            id?: number;
            image?: string;
            createdAt?: string;
            analysisId?: number;
        } | null;
        milestones?: Array<{
            id: string;
            title: string;
            date: string;
            image: string;
            current?: boolean;
        }>;
    };
};

type RecommendationCategory = "immediate" | "weekly" | "avoid";

type RecommendationItem = {
    category: RecommendationCategory;
    text: string;
};

const FALLBACK_CHART_ITEMS: ChartItem[] = [
    { label: "Acne Level", delta: "-12%", positive: true, bars: [34, 29, 31, 21, 27, 15] },
    { label: "Hydration", delta: "+8%", positive: true, bars: [41, 45, 52, 48, 55, 63] },
    { label: "Texture", delta: "Stable", positive: true, bars: [26, 29, 28, 31, 30, 32] },
];

const FALLBACK_AI_RECOMMENDATIONS: RecommendationItem[] = [
    { category: "immediate", text: "Use SPF today to protect your barrier." },
    { category: "weekly", text: "Increase hydration intake and add a humectant serum." },
    { category: "avoid", text: "Avoid over-exfoliation this week for better texture recovery." },
];

const FALLBACK_TIMELINE = [
    { id: "fallback-1", title: "Base Scan", date: "May 12", image: "/skin1.jpg" },
    { id: "fallback-2", title: "Initial Results", date: "June 05", image: "/skin2.jpg" },
    { id: "fallback-3", title: "Major Glow Lift", date: "July 10", image: "/skin3.jpg" },
    { id: "fallback-4", title: "Optimal Peak", date: "Today", image: "/logo.png", current: true },
];

export default function UserDashboard() {
    const user = useAppSelector((state) => state.auth.user);
    const reduxDisplayName = user ? `${user.prenom || ""} ${user.nom || ""}`.trim() || "Nassef" : "Nassef";
    const [dashboardData, setDashboardData] = useState<DashboardOverviewPayload | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadDashboardOverview = async () => {
            try {
                const response = await fetch("/api/user/dashboard/overview");
                if (!response.ok) return;

                const data = (await response.json()) as DashboardOverviewPayload;
                if (!cancelled) {
                    setDashboardData(data);
                }
            } catch (error) {
                console.error("Failed to load dashboard overview:", error);
            }
        };

        loadDashboardOverview();

        return () => {
            cancelled = true;
        };
    }, []);

    const chartItems = useMemo(() => {
        const incoming = dashboardData?.progressOverview?.chartItems;
        if (!incoming || incoming.length === 0) {
            return FALLBACK_CHART_ITEMS;
        }

        return incoming;
    }, [dashboardData]);

    const displayName = dashboardData?.user?.fullName?.trim() || reduxDisplayName;
    const profileImage = dashboardData?.user?.image || user?.photo || "/avatar.png";

    const skinTypeLabel = dashboardData?.user?.skinType
        ? String(dashboardData.user.skinType).replace(/_/g, " ")
        : "Combination / Oily";
    const skinScore = Number.isFinite(Number(dashboardData?.summary?.skinScore))
        ? Math.round(Number(dashboardData?.summary?.skinScore))
        : 87;
    const planLabel = (dashboardData?.user?.plan || "PRO").toUpperCase();
    const periodDays = Math.max(1, Number(dashboardData?.summary?.periodDays || 30));
    const routineConsistency = Math.max(0, Math.min(100, Number(dashboardData?.routineToday?.consistency?.percentage || 0)));

    const morningConfigured = Boolean(dashboardData?.routineToday?.morning?.configured);
    const morningCompleted = Boolean(dashboardData?.routineToday?.morning?.completed);
    const morningLabel = !morningConfigured
        ? "Morning routine not configured"
        : morningCompleted
            ? "Morning routine completed"
            : "Morning routine pending";

    const nightConfigured = Boolean(dashboardData?.routineToday?.night?.configured);
    const nightCompleted = Boolean(dashboardData?.routineToday?.night?.completed);
    const nightLabel = !nightConfigured
        ? "Night routine not configured"
        : nightCompleted
            ? "Night routine completed"
            : "Night routine pending";

    const hydrationLevel = dashboardData?.routineToday?.hydrationReminder?.level || "normal";
    const hydrationLabel = dashboardData?.routineToday?.hydrationReminder?.message || "Hydration reminder";

    const totalScansThisMonth = Math.max(0, Number(dashboardData?.recentScans?.totalThisMonth || 0));
    const lastScanAt = dashboardData?.recentScans?.lastScanAt ? new Date(dashboardData.recentScans.lastScanAt) : null;
    const lastScanDateLabel = lastScanAt
        ? lastScanAt.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
        : "No scans yet";
    const canCompareScans = Boolean(dashboardData?.recentScans?.canCompare);

    const aiRecommendationItems = useMemo<RecommendationItem[]>(() => {
        const immediate = Array.isArray(dashboardData?.aiRecommendations?.immediate)
            ? dashboardData?.aiRecommendations?.immediate
            : [];
        const weekly = Array.isArray(dashboardData?.aiRecommendations?.weekly)
            ? dashboardData?.aiRecommendations?.weekly
            : [];
        const avoid = Array.isArray(dashboardData?.aiRecommendations?.avoid)
            ? dashboardData?.aiRecommendations?.avoid
            : [];

        const ranked: RecommendationItem[] = [];
        if (immediate[0]) ranked.push({ category: "immediate", text: immediate[0] });
        if (weekly[0]) ranked.push({ category: "weekly", text: weekly[0] });
        if (avoid[0]) ranked.push({ category: "avoid", text: avoid[0] });

        const pools: RecommendationItem[] = [
            ...immediate.slice(1).map((text) => ({ category: "immediate" as const, text })),
            ...weekly.slice(1).map((text) => ({ category: "weekly" as const, text })),
            ...avoid.slice(1).map((text) => ({ category: "avoid" as const, text })),
        ];

        while (ranked.length < 3 && pools.length > 0) {
            const next = pools.shift();
            if (next) ranked.push(next);
        }

        return ranked.length > 0 ? ranked.slice(0, 3) : FALLBACK_AI_RECOMMENDATIONS;
    }, [dashboardData]);

    const timeline = useMemo(() => {
        const milestones = Array.isArray(dashboardData?.skinJourney?.milestones)
            ? dashboardData?.skinJourney?.milestones
            : [];

        if (milestones.length === 0) return FALLBACK_TIMELINE;

        return milestones.map((item, index) => {
            const dateObj = new Date(item.date);
            const dateLabel = Number.isNaN(dateObj.getTime())
                ? item.date
                : dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                });

            return {
                id: item.id || `timeline-${index}`,
                title: item.title,
                date: dateLabel,
                image: item.image,
                current: Boolean(item.current),
            };
        });
    }, [dashboardData]);

    return (
        <UserLayout>
            <div className="user-dashboard-page mx-auto w-full max-w-330 space-y-8">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                        Welcome back, {displayName} <span className="align-middle">👋</span>
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
                                    src={profileImage}
                                    alt={displayName}
                                    width={68}
                                    height={68}
                                    className="size-17 rounded-full object-cover border-2 border-[#156d95]/25"
                                />
                                <div>
                                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{displayName}</p>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{skinTypeLabel}</p>
                                </div>
                                <span className="ml-auto px-3 py-1 rounded-full text-xs font-extrabold bg-linear-to-r from-[#2f8eff] to-[#7a5cff] text-white shadow-md">{planLabel}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Skin Score</p>
                                    <p className="text-2xl font-black text-[#156d95]">{skinScore}/100</p>
                                </div>
                                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-3">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Plan</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{planLabel}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                    <span>Routine Consistency</span>
                                    <span className="text-[#156d95]">{routineConsistency}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    <div
                                        className="h-full bg-linear-to-r from-[#2f8eff] to-[#7a5cff]"
                                        style={{ width: `${routineConsistency}%` }}
                                    />
                                </div>
                            </div>

                            <Link
                                href="/user/profile"
                                className="w-full inline-flex items-center justify-center rounded-2xl py-3 text-sm font-bold text-gray-700 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                View Profile
                            </Link>
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
                                    <p className="text-sm text-gray-500">Clinical metrics comparison over the last {periodDays} days</p>
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
                                    <div className={`flex items-center justify-between rounded-2xl border p-3 ${morningConfigured && morningCompleted ? "bg-emerald-50/80 border-emerald-100" : "bg-amber-50/80 border-amber-100"}`}>
                                        <div className="flex items-center gap-2">
                                            {morningConfigured && morningCompleted ? (
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                            ) : (
                                                <Clock3 className="size-4 text-amber-600" />
                                            )}
                                            <span className="text-sm font-semibold text-gray-800">{morningLabel}</span>
                                        </div>
                                        <span>{morningConfigured && morningCompleted ? "✅" : "⏳"}</span>
                                    </div>
                                    <div className={`flex items-center justify-between rounded-2xl border p-3 ${nightConfigured && nightCompleted ? "bg-emerald-50/80 border-emerald-100" : "bg-amber-50/80 border-amber-100"}`}>
                                        <div className="flex items-center gap-2">
                                            {nightConfigured && nightCompleted ? (
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                            ) : (
                                                <Clock3 className="size-4 text-amber-600" />
                                            )}
                                            <span className="text-sm font-semibold text-gray-800">{nightLabel}</span>
                                        </div>
                                        <span>{nightConfigured && nightCompleted ? "✅" : "⏳"}</span>
                                    </div>
                                    <div className={`flex items-center justify-between rounded-2xl border p-3 ${hydrationLevel === "high" ? "bg-blue-50/80 border-blue-100" : hydrationLevel === "good" ? "bg-emerald-50/80 border-emerald-100" : "bg-blue-50/80 border-blue-100"}`}>
                                        <div className="flex items-center gap-2">
                                            <Droplets className={`size-4 ${hydrationLevel === "good" ? "text-emerald-600" : "text-blue-600"}`} />
                                            <span className="text-sm font-semibold text-gray-800">{hydrationLabel}</span>
                                        </div>
                                        <span>{hydrationLevel === "good" ? "✅" : "💧"}</span>
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
                                        <p className="text-3xl font-black text-gray-900 dark:text-white">{totalScansThisMonth}</p>
                                    </div>
                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4 border border-gray-100 dark:border-gray-700">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Last scan date</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{lastScanDateLabel}</p>
                                    </div>
                                    <button
                                        disabled={!canCompareScans}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-linear-to-r from-[#2f8eff] to-[#6f4dff] text-white font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {canCompareScans ? "Compare with previous scan" : "Need at least 2 scans"}
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
                                {aiRecommendationItems.map((item, index) => {
                                    const cardClass = item.category === "immediate"
                                        ? "rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3 flex items-start gap-2"
                                        : item.category === "weekly"
                                            ? "rounded-2xl border border-blue-100 bg-blue-50/80 p-3 flex items-start gap-2"
                                            : "rounded-2xl border border-violet-100 bg-violet-50/80 p-3 flex items-start gap-2";

                                    const icon = item.category === "immediate"
                                        ? <Shield className="size-4 mt-0.5 text-indigo-600" />
                                        : item.category === "weekly"
                                            ? <Droplets className="size-4 mt-0.5 text-blue-600" />
                                            : <TrendingUp className="size-4 mt-0.5 text-violet-600" />;

                                    return (
                                        <div key={`${item.category}-${index}-${item.text.slice(0, 18)}`} className={cardClass}>
                                            {icon}
                                            <p className="text-sm font-semibold text-gray-800">{item.text}</p>
                                        </div>
                                    );
                                })}
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
                                <React.Fragment key={item.id}>
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
