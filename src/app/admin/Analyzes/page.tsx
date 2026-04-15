"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { 
    Search,
    Filter,
    Activity,
    Users as UsersIcon,
    ChevronRight,
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle2,
    AlertCircle,
    Sun,
    Moon,
    ClipboardList,
    Sparkles,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// --- MOCK DATA FOR ADMIN ---
const ALL_ANALYSES = [
    {
        id: "1",
        userName: "Inassef Fadhlaoui",
        userPhoto: "https://i.pravatar.cc/150?u=inassef",
        date: "October 16, 2023",
        score: 82,
        skinType: "Combination",
        status: "Improved",
        hydration: 75,
        oilProduction: 40,
        sensitivity: "Low",
        concerns: ["Acne", "Redness"],
        skinAge: 26,
        actualAge: 28,
        riskFactor: "Low sun damage",
        recommendations: [
            "Increase SPF usage to protect areas of minimal redness from further inflammation.",
            "Introduce a mild retinol (0.1-0.2%) twice weekly to address acne and fine texture."
        ],
        routine: {
            morning: [
                { step: 1, name: "Gentle Cleanser" },
                { step: 2, name: "Vitamin C Serum" },
                { step: 3, name: "Moisturizer" }
            ],
            night: [
                { step: 1, name: "Oil Cleanser" },
                { step: 2, name: "Foaming Cleanser" },
                { step: 3, name: "Niacinamide" }
            ]
        }
    },
    {
        id: "2",
        userName: "Sarah Jenkins",
        userPhoto: "https://i.pravatar.cc/150?u=sarah",
        date: "October 15, 2023",
        score: 64,
        skinType: "Oily",
        hydration: 45,
        oilProduction: 85,
        sensitivity: "Medium",
        concerns: ["Pores", "Blackheads"],
        skinAge: 32,
        actualAge: 29,
        riskFactor: "Medium sun damage",
        recommendations: ["Consistent double cleansing", "BHA implementation"],
        routine: {
            morning: [{ step: 1, name: "Gel Cleanser" }],
            night: [{ step: 1, name: "Double Cleanse" }]
        }
    },
    {
        id: "3",
        userName: "Marc Antoine",
        userPhoto: "https://i.pravatar.cc/150?u=marc",
        date: "October 14, 2023",
        score: 75,
        skinType: "Normal",
        hydration: 65,
        oilProduction: 35,
        sensitivity: "Low",
        concerns: ["Dryness"],
        skinAge: 28,
        actualAge: 28,
        riskFactor: "Minimal",
        recommendations: ["Hydrating serum nightly"],
        routine: {
            morning: [{ step: 1, name: "Gentle Wash" }],
            night: [{ step: 1, name: "Rich Cream" }]
        }
    },
    {
        id: "4",
        userName: "Emma Watson",
        userPhoto: "https://i.pravatar.cc/150?u=emma",
        date: "October 12, 2023",
        score: 88,
        skinType: "Combination",
        hydration: 80,
        oilProduction: 30,
        sensitivity: "Low",
        concerns: ["Minimal Redness"],
        skinAge: 24,
        actualAge: 31,
        riskFactor: "Good protection",
        recommendations: ["Continue current routine"],
        routine: {
            morning: [{ step: 1, name: "Gentle Cleanse" }],
            night: [{ step: 1, name: "Retinol" }]
        }
    }
];

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
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle stroke="#F1F5F9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <circle stroke="#156d95" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + " " + circumference} style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-bold text-gray-900 dark:text-white ${sizes[size].text}`}>{score}</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">/ 100</span>
            </div>
        </div>
    );
};

const AnalysisDetailModal = ({ analysis, onClose }: { analysis: any; onClose: () => void }) => {
    const tm = useTranslations("userAnalyzes.modal");
    if (!analysis) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-8 pb-4 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-full overflow-hidden border-2 border-[#156d95]/20">
                                <Image src={analysis.userPhoto} width={56} height={56} alt={analysis.userName} className="object-cover" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-[#156d95] uppercase tracking-[3px] mb-1 block font-mono">
                                    {tm("report")}
                                </span>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {analysis.userName} - {analysis.date}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-100 dark:border-gray-700">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 pt-4" data-lenis-prevent>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-[32px] p-8 flex flex-col items-center text-center border border-gray-100 dark:border-gray-700">
                                    <CircularScore score={analysis.score} size="lg" />
                                    <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{tm("overallHealthScore")}</h3>
                                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[200px]">
                                        {tm("analysisDescription", { userName: analysis.userName })}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{tm("skinType")}</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.skinType}</p>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">{tm("sensitivity")}</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.sensitivity}</p>
                                    </div>
                                </div>
                                <div className="space-y-6 pt-4">
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2"><span className="text-gray-400 uppercase tracking-wider">{tm("hydration")}</span><span className="text-[#156d95]">{analysis.hydration}%</span></div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-[#156d95]" style={{ width: `${analysis.hydration}%` }} /></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2"><span className="text-gray-400 uppercase tracking-wider">{tm("oilBalance")}</span><span className="text-blue-300">{analysis.oilProduction}%</span></div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-[#3d98c2]" style={{ width: `${analysis.oilProduction}%` }} /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-8">
                                <div className="bg-[#dcf0f9] dark:bg-[#156d95]/20 rounded-[32px] p-6 flex items-center gap-6 border border-blue-100 dark:border-blue-900/30">
                                    <div className="size-16 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                        <div className="relative size-10">
                                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-200" />
                                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-blue-200" />
                                            <div className="absolute inset-0 border-2 border-[#156d95] rounded-full scale-75" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#156d95] dark:text-blue-300">{tm("aiVision")}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">{tm("skinAge")}: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.skinAge}</span> ({tm("actual")}: {analysis.actualAge})</div>
                                            <div className="w-px h-3 bg-[#156d95]/20" />
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">{tm("riskFactor")}: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.riskFactor}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="size-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-[#156d95]"><ClipboardList size={18} /></div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{tm("targetedRecommendations")}</h4>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800 rounded-[32px] p-8 border border-gray-100 dark:border-gray-700">
                                        <ul className="space-y-4">
                                            {(() => {
                                                const recs = Array.isArray(analysis.recommendations) 
                                                    ? analysis.recommendations 
                                                    : analysis.recommendations?.immediate 
                                                        ? [...(analysis.recommendations.immediate || []), ...(analysis.recommendations.weekly || [])]
                                                        : [];
                                                
                                                return recs.map((rec: string, i: number) => (
                                                    <li key={i} className="flex gap-4">
                                                        <div className="shrink-0 mt-1 size-5 rounded-full bg-[#156d95] flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rec}</p>
                                                    </li>
                                                ));
                                            })()}
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="size-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-500"><Sparkles size={18} /></div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{tm("prescribedRoutine")}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-500"><Sun size={18} /><span className="text-xs font-bold uppercase tracking-widest">{tm("morningRoutine")}</span></div>
                                            <div className="space-y-3">
                                                {(Array.isArray(analysis.routine?.morning) ? analysis.routine.morning : []).map((item: any, idx: number) => (
                                                    <div key={idx} className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{tm("step", { number: item.step || idx + 1 })}</span>
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{typeof item === 'string' ? item : item.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400"><Moon size={18} /><span className="text-xs font-bold uppercase tracking-widest">{tm("nightRoutine")}</span></div>
                                            <div className="space-y-3">
                                                {(Array.isArray(analysis.routine?.night || analysis.routine?.evening) ? (analysis.routine?.night || analysis.routine?.evening) : []).map((item: any, idx: number) => (
                                                    <div key={idx} className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{tm("step", { number: item.step || idx + 1 })}</span>
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{typeof item === 'string' ? item : item.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
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

// --- MAIN ADMIN PAGE ---

export default function AdminAnalyzesPage() {
    const t = useTranslations("adminAnalyzes");
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const searchParams = useSearchParams();
    const urlSearch = searchParams?.get("search") || "";

    useEffect(() => {
        async function fetchAnalyses() {
            try {
                const res = await fetch("/api/admin/analyses");
                if (res.ok) {
                    const data = await res.json();
                    setAnalyses(data);
                }
            } catch (err) {
                console.error("Failed to fetch admin analyses:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalyses();
    }, []);

    useEffect(() => {
        if (urlSearch) {
            setSearchTerm(urlSearch);
        }
    }, [urlSearch]);

    const filteredAnalyses = analyses.filter(analysis => {
        return analysis.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
               analysis.id.includes(searchTerm) || 
               analysis.date.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const totalAnalyses = analyses.length;
    const avgScore = (analyses.reduce((acc, curr) => acc + curr.score, 0) / (totalAnalyses || 1)).toFixed(1);

    return (
        <AdminLayout>
            <div className="mx-auto w-full max-w-[1400px]">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: t("stats.totalAnalyzes"), value: totalAnalyses.toString(), icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: t("stats.activeUsers"), value: Array.from(new Set(analyses.map(a => a.userId))).length.toString(), icon: UsersIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: t("stats.avgScore"), value: avgScore, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: t("stats.newToday"), value: t("stats.newValue"), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-gray-800 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm"
                        >
                            <div className={`size-12 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color} mb-4`}>
                                <stat.icon size={24} />
                            </div>
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</h3>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("header.title")}</h2>
                            <p className="text-gray-400 text-sm mt-1">{t("header.subtitle")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                                <input 
                                    type="text"
                                    placeholder={t("header.searchPlaceholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border-none text-sm w-64 focus:ring-2 focus:ring-[#156d95]/50 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#156d95]"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] border-b border-gray-50 dark:border-gray-700/50">
                                        <th className="px-8 py-5">{t("table.user")}</th>
                                        <th className="px-8 py-5">{t("table.date")}</th>
                                        <th className="px-8 py-5">{t("table.summary")}</th>
                                        <th className="px-8 py-5">{t("table.score")}</th>
                                        <th className="px-8 py-5 text-right whitespace-nowrap">{t("table.details")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {filteredAnalyses.map((item, i) => (
                                        <tr 
                                            key={item.id}
                                            className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors cursor-pointer"
                                            onClick={() => setSelectedAnalysis(item)}
                                        >
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full overflow-hidden border border-gray-100">
                                                        {item.userPhoto && (
                                                            <Image src={item.userPhoto} width={40} height={40} alt={item.userName} className="object-cover" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{item.userName}</p>
                                                        <p className="text-[10px] text-gray-400">ID: {item.userId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{item.date}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t("table.skinTypeType", { skinType: item.skinType })}</p>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {item.concerns.map((c: string) => (
                                                            <span key={c} className="text-[8px] bg-rose-50 text-rose-500 px-1.5 rounded uppercase font-bold">{c}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#156d95] rounded-full" style={{ width: `${item.score}%` }} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.score}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 group-hover:bg-[#156d95] group-hover:text-white transition-all ml-auto">
                                                    <ArrowUpRight size={16} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    <div className="p-8 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">{t("pagination.showing", { filtered: filteredAnalyses.length, total: analyses.length })}</p>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-400 opacity-50 cursor-not-allowed">{t("pagination.previous")}</button>
                            <button className="px-4 py-2 border border-blue-500 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold cursor-not-allowed">{t("pagination.next")}</button>
                        </div>
                    </div>
                </div>
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
        </AdminLayout>
    );
}

