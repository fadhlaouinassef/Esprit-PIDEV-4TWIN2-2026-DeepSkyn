"use client";

import React, { useState, useEffect } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import {
    Calendar,
    ChevronRight,
    MoreHorizontal,
    Plus,
    Filter,
    TrendingUp,
    TrendingDown,
    Minus,
    X,
    CheckCircle2,
    AlertCircle,
    Info,
    Sun,
    Moon,
    ArrowRight,
    Search,
    ClipboardList,
    Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { RoutineItemScraper } from "@/app/components/user/RoutineItemScraper";
import { AudioToggleButton } from "@/app/components/user/AudioToggleButton";
import { useLocale, useTranslations } from "next-intl";
import type { TrendInsight } from "@/modele/analysisTrendModel";

// --- COMPONENTS ---

const CircularScore = ({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) => {
    const radius = size === "sm" ? 35 : size === "md" ? 45 : 70;
    const stroke = size === "sm" ? 6 : size === "md" ? 8 : 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const sizes = {
        sm: { box: "w-20 h-20", text: "text-lg" },
        md: { box: "w-32 h-32", text: "text-2xl" },
        lg: { box: "w-52 h-52", text: "text-5xl" },
    };

    return (
        <div className={`relative flex items-center justify-center ${sizes[size].box}`}>
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    stroke="#F1F5F9"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                {/* Progress circle */}
                <circle
                    stroke="#156d95"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-bold text-gray-900 dark:text-white ${sizes[size].text}`}>{score}</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">/ 100</span>
            </div>
        </div>
    );
};

const AnalysisCard = ({ analysis, label, onClick }: { analysis: any; label?: string; onClick: () => void }) => {
    const t = useTranslations("userAnalyzes.card");

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Improved": return <TrendingUp className="size-3 text-emerald-500" />;
            case "Worse": return <TrendingDown className="size-3 text-rose-500" />;
            default: return <Minus className="size-3 text-gray-500" />;
        }
    };

    const statusLabel = (status: string) => {
        if (status === "Improved") return t("statuses.improved");
        if (status === "Worse") return t("statuses.worse");
        if (status === "Stable") return t("statuses.stable");
        return status;
    };

    const sensitivityLabel = (sensitivity: string) => {
        if (sensitivity === "Low") return t("sensitivity.low");
        if (sensitivity === "Medium") return t("sensitivity.medium");
        if (sensitivity === "High") return t("sensitivity.high");
        return sensitivity;
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "Improved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "Worse": return "bg-rose-50 text-rose-700 border-rose-100";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            onClick={onClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:border-[#156d95]/30 flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-1 block">
                        {label || t("labels.baseline")}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {analysis.date}
                    </h3>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${getStatusStyles(analysis.status)}`}>
                    {getStatusIcon(analysis.status)}
                    {statusLabel(analysis.status)}
                    {analysis.status === "Improved" && <span className="text-[8px]">↑</span>}
                    {analysis.status === "Worse" && <span className="text-[8px]">↓</span>}
                    {analysis.status === "Stable" && <span className="text-[8px]">→</span>}
                </div>
            </div>

            <div className="flex items-center gap-6 mb-8 mt-2">
                <CircularScore score={analysis.score} size="md" />

                <div className="flex-1 space-y-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t("skinType")}</span>
                        <div className="bg-[#e0f1f9] text-[#156d95] px-4 py-2 rounded-xl text-sm font-bold inline-block">
                            {analysis.skinType}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {analysis.concerns.map((concern: string) => (
                            <span key={concern} className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg text-[10px] font-bold">
                                {concern}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2">
                        <span className="text-gray-400 uppercase tracking-wider">{t("hydration")}</span>
                        <span className="text-[#156d95]">{analysis.hydration}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${analysis.hydration}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-[#156d95]"
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-[11px] font-bold mb-2">
                        <span className="text-gray-400 uppercase tracking-wider">{t("oilProduction")}</span>
                        <span className="text-[#156d95]">{analysis.oilProduction}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${analysis.oilProduction}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                            className="h-full bg-[#156d95]"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("sensitivity.label")}</span>
                    <span className={`text-sm font-bold ${analysis.sensitivity === "Low" ? "text-emerald-500" :
                        analysis.sensitivity === "Medium" ? "text-amber-500" : "text-rose-500"
                        }`}>
                        {sensitivityLabel(analysis.sensitivity)}
                    </span>
                </div>
                <div className="size-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#156d95] group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                </div>
            </div>
        </motion.div>
    );
};

const AnalysisDetailModal = ({ analysis, onClose }: { analysis: any; onClose: () => void }) => {
    const t = useTranslations("userAnalyzes.modal");
    if (!analysis) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-8 pb-4 flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-bold text-[#156d95] uppercase tracking-[3px] mb-2 block font-mono">
                                {t("report")}
                            </span>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {t("detailed", { date: analysis.date })}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-100 dark:border-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-4" data-lenis-prevent>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left Column: Health Score & Basics */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-[32px] p-8 flex flex-col items-center text-center border border-gray-100 dark:border-gray-700">
                                    <CircularScore score={analysis.score} size="lg" />
                                    <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{t("overallHealthScore")}</h3>
                                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[200px]">
                                        {t("overallHealthDescription")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t("skinType")}</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.skinType}</p>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{t("sensitivity")}</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.sensitivity}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-gray-400 uppercase tracking-wider">{t("hydration")}</span>
                                            <span className="text-[#156d95]">{analysis.hydration}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#156d95]" style={{ width: `${analysis.hydration}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-gray-400 uppercase tracking-wider">{t("oilBalance")}</span>
                                            <span className="text-blue-300">{analysis.oilProduction}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3d98c2]" style={{ width: `${analysis.oilProduction}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">{t("identifiedConcerns")}</span>
                                    <div className="space-y-3">
                                        {analysis.concerns.map((concern: string) => (
                                            <div key={concern} className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-4 flex items-center justify-between border border-rose-100 dark:border-rose-900/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                                        {concern === "Acne" ? <AlertCircle size={16} /> : <Sun size={16} />}
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{concern}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mr-2">{t("mild")}</span>
                                            </div>
                                        ))}
                                        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <span className="font-bold">{t("redness")}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mr-2">{t("minimal")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: AI Analysis & Recommendations */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* AI Vision Card */}
                                <div className="bg-[#dcf0f9] dark:bg-[#156d95]/20 rounded-[32px] p-6 flex items-center gap-6 border border-blue-100 dark:border-blue-900/30">
                                    <div className="size-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                        <div className="relative size-10">
                                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-200" />
                                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-blue-200" />
                                            <div className="absolute inset-0 border-2 border-[#156d95] rounded-full scale-75" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#156d95] dark:text-blue-300">{t("aiVision")}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">
                                                {t("skinAge")}: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.skinAge}</span> <span className="opacity-50">({t("actual")}: {analysis.actualAge})</span>
                                            </div>
                                            <div className="w-px h-3 bg-[#156d95]/20" />
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">
                                                {t("riskFactor")}: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.riskFactor}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="size-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-[#156d95]">
                                            <ClipboardList size={18} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{t("targetedRecommendations")}</h4>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800 rounded-[32px] p-8 border border-gray-100 dark:border-gray-700">
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                            {analysis.summary || t("recommendationsFallback")}
                                        </p>
                                        <ul className="space-y-4">
                                            {(() => {
                                                const recs = Array.isArray(analysis.recommendations)
                                                    ? analysis.recommendations
                                                    : analysis.recommendations?.immediate
                                                        ? [...(analysis.recommendations.immediate || []), ...(analysis.recommendations.weekly || [])]
                                                        : [];

                                                return recs.map((rec: string, i: number) => (
                                                    <li key={i} className="flex gap-4">
                                                        <div className="shrink-0 mt-1 size-5 rounded-full bg-[#156d95] flex items-center justify-center text-white">
                                                            <CheckCircle2 size={12} />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rec}</p>
                                                    </li>
                                                ));
                                            })()}
                                        </ul>
                                    </div>
                                </div>

                                {/* Prescribed Routine */}
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="size-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500">
                                            <Sparkles size={18} />
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{t("prescribedRoutine")}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Morning */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <Sun size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{t("morningRoutine")}</span>
                                            </div>
                                            <div className="space-y-6">
                                                {(Array.isArray(analysis.routine?.morning) ? analysis.routine.morning : []).map((item: any, idx: number) => {
                                                    const stepName = typeof item === 'string' ? item : item.name;
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <div className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-amber-200 transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t("step", { number: idx + 1 })}</span>
                                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{stepName}</span>
                                                                </div>
                                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                                                            </div>
                                                            {/* Dynamic product scraper for this step */}
                                                            <div className="px-2">
                                                                <RoutineItemScraper action={stepName} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Night */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
                                                <Moon size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{t("nightRoutine")}</span>
                                            </div>
                                            <div className="space-y-6">
                                                {(Array.isArray(analysis.routine?.night || analysis.routine?.evening) ? (analysis.routine?.night || analysis.routine?.evening) : []).map((item: any, idx: number) => {
                                                    const stepName = typeof item === 'string' ? item : item.name;
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <div className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t("step", { number: idx + 1 })}</span>
                                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{stepName}</span>
                                                                </div>
                                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                                            </div>
                                                            {/* Dynamic product scraper for this step */}
                                                            <div className="px-2">
                                                                <RoutineItemScraper action={stepName} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

export default function AnalyzesPage() {
    const t = useTranslations("userAnalyzes");
    const locale = useLocale();
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
    const [trendInsight, setTrendInsight] = useState<TrendInsight | null>(null);
    const [trendLoading, setTrendLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);
    const [historyInsights, setHistoryInsights] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        async function fetchAnalyses() {
            try {
                const res = await fetch("/api/user/analyses");
                if (res.ok) {
                    const data = await res.json();
                    setAnalyses(data);
                }
            } catch (err) {
                console.error("Failed to fetch analyses:", err);
            } finally {
                setLoading(false);
            }
        }

        const fetchHistory = async () => {
            setHistoryLoading(true);
            try {
                const res = await fetch(`/api/user/analyses/trend?history=true&locale=${encodeURIComponent(locale)}`);
                if (res.ok) {
                    const data = await res.json();
                    setHistoryInsights(data.insights || []);
                }
            } catch (err) {
                console.error("Failed to fetch history trends:", err);
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchAnalyses();
        fetchHistory();
    }, [locale]);

    useEffect(() => {
        let cancelled = false;

        const computeTrend = async () => {
            setTrendLoading(true);
            try {
                const res = await fetch(`/api/user/analyses/trend?locale=${encodeURIComponent(locale)}`);
                if (!res.ok) {
                    throw new Error(`Failed to fetch trend report: ${res.status}`);
                }

                const payload = await res.json();
                const insight = payload?.insight ?? null;
                if (!cancelled) {
                    setTrendInsight(insight);
                }
            } catch (error) {
                console.error("Failed to compute TensorFlow trend insight:", error);
                if (!cancelled) {
                    setTrendInsight(null);
                }
            } finally {
                if (!cancelled) {
                    setTrendLoading(false);
                }
            }
        };

        computeTrend();

        return () => {
            cancelled = true;
        };
    }, [locale]);

    const trendPanelText = locale.startsWith("fr")
        ? {
            title: "Intelligence de tendance TensorFlow",
            confidence: "Confiance du modele",
            keyFactors: "Facteurs cles",
            nextSteps: "Actions recommandees",
            loading: "Analyse de la tendance en cours...",
        }
        : locale.startsWith("ar")
            ? {
                title: "تحليل الاتجاه عبر TensorFlow",
                confidence: "موثوقية النموذج",
                keyFactors: "العوامل الرئيسية",
                nextSteps: "الخطوات المقترحة",
                loading: "جار تحليل الاتجاه...",
            }
            : {
                title: "TensorFlow Trend Intelligence",
                confidence: "Model confidence",
                keyFactors: "Key factors",
                nextSteps: "What to do next",
                loading: "Analyzing your trend...",
            };

    const pdfTrendText = locale.startsWith("fr")
        ? {
            sectionTitle: "Explication de tendance",
            summary: "Resume",
            why: "Cause probable",
            next: "Actions conseillees",
            noData: "Pas assez de donnees pour expliquer la tendance.",
        }
        : locale.startsWith("ar")
            ? {
                sectionTitle: "شرح الاتجاه",
                summary: "الملخص",
                why: "السبب المحتمل",
                next: "الإجراءات المقترحة",
                noData: "لا توجد بيانات كافية لشرح الاتجاه.",
            }
            : {
                sectionTitle: "Trend explanation",
                summary: "Summary",
                why: "Likely reason",
                next: "Recommended actions",
                noData: "Not enough data to explain the trend.",
            };

    const simplifyForEveryone = (text: string) => {
        return String(text || "")
            .replace(/\s+/g, " ")
            .replace(/\bimpact\s+\d+(\.\d+)?x\b/gi, "")
            .replace(/\brelative impact\s+\d+(\.\d+)?x\b/gi, "")
            .replace(/\bvariation\s+[+\-]?\d+(\.\d+)?\b/gi, "")
            .replace(/\bchange\s+[+\-]?\d+(\.\d+)?\b/gi, "")
            .replace(/\s+([,.;:!?])/g, "$1")
            .trim();
    };

    const readableTrend = (insight: TrendInsight | null) => {
        const fallback = {
            summary: pdfTrendText.noData,
            why: "",
            actions: [] as string[],
            factors: [] as string[],
        };

        if (!insight) return fallback;

        const summary = simplifyForEveryone(insight.clarity?.headline || insight.summary || pdfTrendText.noData);
        const why = simplifyForEveryone(insight.clarity?.plainWhy || insight.why || "");
        const actionsSource = (insight.clarity?.thisWeekPlan && insight.clarity.thisWeekPlan.length > 0)
            ? insight.clarity.thisWeekPlan
            : insight.recommendations;

        const actions = actionsSource
            .map((item) => simplifyForEveryone(item))
            .filter(Boolean)
            .slice(0, 3);

        const factors = (insight.factors || [])
            .slice(0, 3)
            .map((factor) => simplifyForEveryone(factor.explanation))
            .filter(Boolean);

        return { summary, why, actions, factors };
    };

    const stopSpeaking = () => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
        }
    };

    const speakContent = (text: string, id: string) => {
        if (typeof window === 'undefined') return;

        if (speakingIndex === id) {
            stopSpeaking();
            return;
        }

        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);

        // Dynamic language detection
        if (/[\u0600-\u06FF]/.test(text)) {
            utterance.lang = 'ar-SA';
        } else if (/[éèàùâêîôûëïü]/.test(text.toLowerCase())) {
            utterance.lang = 'fr-FR';
        } else {
            utterance.lang = 'en-US';
        }

        utterance.rate = 1.1;
        utterance.pitch = 1.0;

        utterance.onend = () => {
            setSpeakingIndex(null);
        };

        utterance.onerror = () => {
            setSpeakingIndex(null);
        };

        setSpeakingIndex(id);
        window.speechSynthesis.speak(utterance);
    };

    // Auto-read when an analysis is selected
    useEffect(() => {
        if (autoSpeech && selectedAnalysis) {
            let fullText = t("audio.detailIntro", { date: selectedAnalysis.date });
            fullText += ` ${t("audio.score", { score: selectedAnalysis.score })} `;
            fullText += ` ${t("audio.skinTypeSensitivity", { skinType: selectedAnalysis.skinType, sensitivity: selectedAnalysis.sensitivity })} `;

            if (selectedAnalysis.summary) {
                fullText += ` ${t("audio.summary", { summary: selectedAnalysis.summary })} `;
            }

            const recs = Array.isArray(selectedAnalysis.recommendations)
                ? selectedAnalysis.recommendations
                : selectedAnalysis.recommendations?.immediate
                    ? [...(selectedAnalysis.recommendations.immediate || []), ...(selectedAnalysis.recommendations.weekly || [])]
                    : [];

            if (recs.length > 0) {
                fullText += t("audio.topRecommendations", { recommendations: recs.slice(0, 3).join(". ") });
            }

            speakContent(fullText, `analysis-${selectedAnalysis.id}`);
        } else if (autoSpeech && !selectedAnalysis && analyses.length > 0) {
            const latest = analyses[0];
            const text = t("audio.history", { count: analyses.length, score: latest.score, skinType: latest.skinType });
            speakContent(text, "history-summary");
        }
    }, [selectedAnalysis, autoSpeech, analyses, t]);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const filteredAnalyses = analyses.filter(analysis => {
        const matchesSearch =
            analysis.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
            analysis.skinType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            analysis.concerns.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === "All" || analysis.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { value: "All", label: t("filters.status.all") },
        { value: "Improved", label: t("filters.status.improved") },
        { value: "Stable", label: t("filters.status.stable") },
        { value: "Worse", label: t("filters.status.worse") },
    ];

    const csvEscape = (value: string | number) => {
        const text = String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
    };

    const exportCsv = () => {
        const rows = filteredAnalyses.map((analysis) => ({
            date: analysis.date,
            score: analysis.score,
            skinType: analysis.skinType,
            status: analysis.status,
            hydration: analysis.hydration,
            oilProduction: analysis.oilProduction,
            sensitivity: analysis.sensitivity,
            concerns: Array.isArray(analysis.concerns) ? analysis.concerns.join(" | ") : "",
        }));

        const headers = [
            t("export.columns.date"),
            t("export.columns.score"),
            t("export.columns.skinType"),
            t("export.columns.status"),
            t("export.columns.hydration"),
            t("export.columns.oilProduction"),
            t("export.columns.sensitivity"),
            t("export.columns.concerns"),
        ];

        const body = rows.map((row) => [
            csvEscape(row.date),
            csvEscape(row.score),
            csvEscape(row.skinType),
            csvEscape(row.status),
            csvEscape(`${row.hydration}%`),
            csvEscape(`${row.oilProduction}%`),
            csvEscape(row.sensitivity),
            csvEscape(row.concerns),
        ].join(","));

        const csvContent = [headers.map(csvEscape).join(","), ...body].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.setAttribute("download", `deepskyn-analyses-${stamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const exportPdf = async () => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        const stamp = new Date().toLocaleDateString(locale);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 24;

        const toDataUrl = async (url: string): Promise<string> => {
            try {
                const res = await fetch(url);
                const blob = await res.blob();
                return await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                return "";
            }
        };

        // --- Styling Constants ---
        const colors = {
            primary: [21, 109, 149], // DeepSkyn Blue
            secondary: [8, 47, 73],   // Deep Navy
            accent: [16, 185, 129],  // Emerald
            danger: [244, 63, 94],   // Rose
            text: [51, 65, 85],      // Slate 700
            lightText: [148, 163, 184], // Slate 400
            bg: [248, 250, 252],     // Slate 50
            border: [226, 232, 240]  // Slate 200
        };

        // --- Header Section ---
        doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.rect(0, 0, pageWidth, 75, "F");

        const logoDataUrl = await toDataUrl("/logo.png");
        if (logoDataUrl) {
            doc.addImage(logoDataUrl, "PNG", margin, 15, 45, 45);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("DEEPSKYN", margin + 55, 38);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(t("export.pdfTitle"), margin + 55, 52);

        doc.setFontSize(8);
        doc.text(`${t("export.generatedOn", { date: stamp })}`, pageWidth - margin - 80, 52);

        let y = 95;

        const allAnalyses = [...analyses];
        let exportInsight = trendInsight;
        if (!exportInsight && allAnalyses.length >= 3) {
            try {
                const res = await fetch(`/api/user/analyses/trend?locale=${encodeURIComponent(locale)}`);
                if (res.ok) {
                    const payload = await res.json();
                    exportInsight = payload?.insight ?? null;
                }
            } catch (error) {
                console.error("Failed to compute trend insight during PDF export:", error);
            }
        }

        const readableExport = readableTrend(exportInsight);

        const latest = allAnalyses[0];
        const oldest = allAnalyses[allAnalyses.length - 1];
        const avgScore = allAnalyses.length
            ? allAnalyses.reduce((sum, item) => sum + Number(item.score || 0), 0) / allAnalyses.length
            : 0;

        // --- Summary Box ---
        const boxX = margin;
        const boxW = pageWidth - margin * 2;
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(boxX, y, boxW, 85, 12, 12, "FD");

        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(locale.startsWith('fr') ? "RESUME ANALYTIQUE" : "EXECUTIVE SUMMARY", boxX + 15, y + 25);

        // Grid in summary box
        doc.setFontSize(9);
        doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
        doc.text(locale.startsWith('fr') ? "Analyses" : "Records", boxX + 20, y + 45);
        doc.text(locale.startsWith('fr') ? "Score Moyen" : "Avg Score", boxX + 120, y + 45);
        doc.text(locale.startsWith('fr') ? "Dernier" : "Latest", boxX + 220, y + 45);
        doc.text(locale.startsWith('fr') ? "Depart" : "Starting", boxX + 320, y + 45);

        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setFontSize(14);
        doc.text(String(allAnalyses.length), boxX + 20, y + 65);
        doc.text(avgScore.toFixed(1), boxX + 120, y + 65);
        doc.text(String(latest?.score ?? "-"), boxX + 220, y + 65);
        doc.text(String(oldest?.score ?? "-"), boxX + 320, y + 65);

        y += 105;

        const ensureSpace = (requiredHeight: number) => {
            if (y + requiredHeight <= pageHeight - 50) return;
            doc.addPage();
            // Draw small header on next pages
            doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.rect(0, 0, pageWidth, 40, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text("DeepSkyn - Report Continued", margin, 25);
            y = 60;
        };

        const drawSectionTitle = (title: string, color = colors.primary) => {
            ensureSpace(35);
            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            // Sanitize title for PDF
            const cleanTitle = title.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            doc.text(cleanTitle, margin, y + 15);
            y += 20;
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.setLineWidth(1.5);
            doc.line(margin, y, margin + 40, y);
            doc.setLineWidth(0.5);
            doc.line(margin + 45, y, pageWidth - margin, y);
            y += 15;
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        };

        const drawParagraph = (text: string) => {
            const cleanText = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const lines = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
            ensureSpace(lines.length * 13 + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            lines.forEach((line: string) => {
                doc.text(line, margin, y + 10);
                y += 13;
            });
            y += 5;
        };

        const drawBullet = (text: string) => {
            const cleanText = String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const lines = doc.splitTextToSize(cleanText, pageWidth - margin * 2 - 20);
            ensureSpace(lines.length * 13 + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.circle(margin + 5, y + 7, 2, "F");
            lines.forEach((line: string, idx: number) => {
                doc.text(line, margin + 15, y + 10 + idx * 13);
            });
            y += lines.length * 13 + 5;
        };

        // --- Content ---
        if (exportInsight) {
            drawSectionTitle(locale.startsWith('fr') ? "Analyse Predictive TensorFlow" : "TensorFlow AI Insights");
            drawParagraph(readableExport.summary);
            drawParagraph(readableExport.why);

            if (readableExport.actions.length > 0) {
                drawParagraph(locale.startsWith('fr') ? "Actions Recommandees :" : "Recommended Actions:");
                readableExport.actions.forEach(act => drawBullet(act));
            }
        }

        if (historyInsights.length > 0) {
            drawSectionTitle(locale.startsWith('fr') ? "Journal de Progression Historique" : "Historical Evolution Journey");

            historyInsights.forEach((h, i) => {
                const rawDate = new Date(h.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
                const dateStr = rawDate.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const directionSymbol = h.direction === 'improving' ? '(+)' : h.direction === 'declining' ? '(-)' : '(o)';
                const directionColor = h.direction === 'improving' ? colors.accent : h.direction === 'declining' ? colors.danger : colors.lightText;

                ensureSpace(60);

                // Timeline marker
                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.line(margin + 10, y, margin + 10, y + 50);
                doc.setFillColor(directionColor[0], directionColor[1], directionColor[2]);
                doc.circle(margin + 10, y + 10, 4, "F");

                doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(`${dateStr} - Score: ${h.score} ${directionSymbol}`, margin + 25, y + 13);

                y += 18;
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                const desc = (h.clarity?.headline || h.summary || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const descLines = doc.splitTextToSize(desc, pageWidth - margin * 2 - 35);
                descLines.forEach((line: string) => {
                    doc.text(line, margin + 25, y + 8);
                    y += 11;
                });

                const why = (h.clarity?.plainWhy || h.why || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const whyLines = doc.splitTextToSize(why, pageWidth - margin * 2 - 35);
                doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
                whyLines.forEach((line: string) => {
                    doc.text(line, margin + 25, y + 8);
                    y += 11;
                });

                y += 10;
            });
        }

        // --- Footer ---
        const addFooter = () => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
                doc.text(`DeepSkyn Intelligence Report — Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: "center" });
                doc.text("deepskyn", margin, pageHeight - 20);
            }
        };
        addFooter();

        const filename = `DeepSkyn_Intelligence_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    };

    const readableTrendInsight = readableTrend(trendInsight);

    return (
        <UserLayout>
            <div className="user-analyzes-page mx-auto w-full max-w-[1400px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#156d95] uppercase tracking-[3px] mb-2 block font-mono">
                            {t("header.kicker")}
                        </span>
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                                {t("header.title")}
                            </h1>
                            <AudioToggleButton
                                enabled={autoSpeech}
                                onToggle={() => {
                                    if (autoSpeech) stopSpeaking();
                                    setAutoSpeech(!autoSpeech);
                                }}
                            />
                        </div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-lg max-w-xl font-medium">
                            {t("header.subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportCsv}
                            className="px-5 py-3 rounded-2xl border border-[#156d95]/30 text-[#156d95] bg-white dark:bg-gray-900 dark:text-blue-300 dark:border-blue-400/30 font-bold hover:bg-[#156d95]/5 transition-all"
                        >
                            {t("actions.exportCsv")}
                        </button>
                        <button
                            onClick={exportPdf}
                            className="px-5 py-3 rounded-2xl border border-emerald-500/30 text-emerald-700 bg-white dark:bg-gray-900 dark:text-emerald-300 dark:border-emerald-400/30 font-bold hover:bg-emerald-500/5 transition-all"
                        >
                            {t("actions.exportPdf")}
                        </button>
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input
                                type="text"
                                placeholder={t("filters.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border-none text-sm w-64 focus:ring-2 focus:ring-[#156d95]/50 transition-all font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full font-bold text-gray-600 dark:text-gray-300 transition-all border border-transparent">
                            <Filter size={18} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-bold cursor-pointer"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <Link
                            href="/user/questionnaire"
                            className="flex items-center gap-2 px-8 py-4 bg-[#156d95] hover:bg-[#115a7b] rounded-full font-bold text-white shadow-xl shadow-[#156d95]/20 hover:scale-[1.02] transition-all"
                        >
                            <Plus size={20} />
                            {t("actions.newAnalysis")}
                        </Link>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#156d95]"></div>
                    </div>
                ) : (
                    <>
                        {(trendLoading || trendInsight) && (
                            <div className="mb-8 rounded-[28px] border border-[#156d95]/20 bg-gradient-to-br from-[#e8f5fb] to-white dark:from-[#123543]/40 dark:to-gray-900 p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#156d95]">{trendPanelText.title}</span>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{readableTrendInsight.summary || trendPanelText.loading}</h3>
                                        {trendInsight && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-3xl">
                                                {readableTrendInsight.why}
                                            </p>
                                        )}
                                    </div>
                                    {trendInsight && (
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold block">{trendPanelText.confidence}</span>
                                            <span className="text-2xl font-black text-[#156d95]">{Math.round(trendInsight.confidence * 100)}%</span>
                                        </div>
                                    )}
                                </div>

                                {trendInsight && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                                        <div className="rounded-2xl bg-white/90 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 p-4">
                                            <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-2">{trendPanelText.keyFactors}</p>
                                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                                                {readableTrendInsight.factors.map((item, idx) => (
                                                    <li key={`${idx}-${item.slice(0, 12)}`} className="flex items-start gap-2">
                                                        <Info size={14} className="mt-0.5 text-[#156d95] shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl bg-white/90 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 p-4">
                                            <p className="text-[10px] uppercase tracking-[2px] text-gray-400 font-bold mb-2">{trendPanelText.nextSteps}</p>
                                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                                                {readableTrendInsight.actions.map((item, idx) => (
                                                    <li key={`${idx}-${item.slice(0, 12)}`} className="flex items-start gap-2">
                                                        <Info size={14} className="mt-0.5 text-[#156d95] shrink-0" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {historyInsights.length > 0 && (
                            <div className="mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <TrendingUp size={22} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Journal de Progression Déroulé</h2>
                                </div>
                                <div className="space-y-4">
                                    {historyInsights.map((h, i) => (
                                        <motion.div
                                            key={`history-${i}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-[#156d95]/30 transition-all"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(h.date).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</span>
                                                    <div className={`mt-2 size-10 rounded-full flex items-center justify-center font-black text-white ${h.direction === 'improving' ? 'bg-emerald-500' : h.direction === 'declining' ? 'bg-rose-500' : 'bg-gray-400'}`}>
                                                        {h.score}
                                                    </div>
                                                </div>
                                                <div className="max-w-2xl">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{h.clarity?.headline || h.summary}</h4>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">{h.clarity?.plainWhy || h.why}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${h.direction === 'improving' ? 'bg-emerald-50 text-emerald-600' : h.direction === 'declining' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                                                {h.direction}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredAnalyses.map((analysis, index) => {
                                let label = t("card.labels.baseline");
                                if (index === 0) label = t("card.labels.latest");
                                else if (index === 1) label = t("card.labels.previous");
                                else if (index === filteredAnalyses.length - 1 && filteredAnalyses.length > 2) label = t("card.labels.baseline");
                                else label = t("card.labels.past");

                                return (
                                    <AnalysisCard
                                        key={analysis.id}
                                        analysis={analysis}
                                        label={label}
                                        onClick={() => setSelectedAnalysis(analysis)}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Empty State if needed */}
                {!loading && filteredAnalyses.length === 0 && (
                    <div className="mt-12 bg-white dark:bg-gray-800 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
                        <div className="size-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-gray-300 size-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("empty.title")}</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            {analyses.length === 0
                                ? t("empty.noAnalyses")
                                : t("empty.noMatches")}
                        </p>
                        {analyses.length === 0 ? (
                            <Link
                                href="/user/questionnaire"
                                className="mt-8 px-10 py-4 bg-[#156d95] text-white rounded-full font-bold hover:bg-[#115a7b] transition-all inline-block"
                            >
                                {t("empty.firstAnalysis")}
                            </Link>
                        ) : (
                            <button
                                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                                className="mt-8 px-10 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white rounded-full font-bold hover:bg-gray-200 transition-all"
                            >
                                {t("empty.clearFilters")}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedAnalysis && (
                    <AnalysisDetailModal
                        analysis={selectedAnalysis}
                        onClose={() => setSelectedAnalysis(null)}
                    />
                )}
            </AnimatePresence>
        </UserLayout>
    );
}

