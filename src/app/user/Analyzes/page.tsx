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
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Improved": return <TrendingUp className="size-3 text-emerald-500" />;
            case "Worse": return <TrendingDown className="size-3 text-rose-500" />;
            default: return <Minus className="size-3 text-gray-500" />;
        }
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
                        {label || "Baseline Analysis"}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {analysis.date}
                    </h3>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold ${getStatusStyles(analysis.status)}`}>
                    {getStatusIcon(analysis.status)}
                    {analysis.status}
                    {analysis.status === "Improved" && <span className="text-[8px]">↑</span>}
                    {analysis.status === "Worse" && <span className="text-[8px]">↓</span>}
                    {analysis.status === "Stable" && <span className="text-[8px]">→</span>}
                </div>
            </div>

            <div className="flex items-center gap-6 mb-8 mt-2">
                <CircularScore score={analysis.score} size="md" />

                <div className="flex-1 space-y-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Skin Type</span>
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
                        <span className="text-gray-400 uppercase tracking-wider">Hydration</span>
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
                        <span className="text-gray-400 uppercase tracking-wider">Oil Production</span>
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sensitivity</span>
                    <span className={`text-sm font-bold ${analysis.sensitivity === "Low" ? "text-emerald-500" :
                            analysis.sensitivity === "Medium" ? "text-amber-500" : "text-rose-500"
                        }`}>
                        {analysis.sensitivity}
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
                                Clinical Analysis Report
                            </span>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Detailed Analysis - {analysis.date}
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
                                    <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Overall Health Score</h3>
                                    <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-[200px]">
                                        Your skin health is significantly above average for your demographic.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Skin Type</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.skinType}</p>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Sensitivity</span>
                                        <p className="font-bold text-gray-900 dark:text-white">{analysis.sensitivity}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-gray-400 uppercase tracking-wider">Hydration</span>
                                            <span className="text-[#156d95]">{analysis.hydration}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#156d95]" style={{ width: `${analysis.hydration}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-bold mb-2">
                                            <span className="text-gray-400 uppercase tracking-wider">Oil Balance</span>
                                            <span className="text-blue-300">{analysis.oilProduction}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#3d98c2]" style={{ width: `${analysis.oilProduction}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Identified Concerns</span>
                                    <div className="space-y-3">
                                        {analysis.concerns.map((concern: string) => (
                                            <div key={concern} className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-4 flex items-center justify-between border border-rose-100 dark:border-rose-900/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                                        {concern === "Acne" ? <AlertCircle size={16} /> : <Sun size={16} />}
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{concern}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mr-2">Mild</span>
                                            </div>
                                        ))}
                                        <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3 text-gray-500">
                                                <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <span className="font-bold">Redness</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mr-2">Minimal</span>
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
                                        <h4 className="font-bold text-[#156d95] dark:text-blue-300">AI Vision Analysis</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">
                                                Skin Age: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.skinAge}</span> <span className="opacity-50">(Actual: {analysis.actualAge})</span>
                                            </div>
                                            <div className="w-px h-3 bg-[#156d95]/20" />
                                            <div className="text-xs text-[#156d95]/70 dark:text-blue-400 font-medium">
                                                Risk Factor: <span className="font-bold text-[#156d95] dark:text-blue-300">{analysis.riskFactor}</span>
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
                                        <h4 className="font-bold text-gray-900 dark:text-white">Targeted Recommendations</h4>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800 rounded-[32px] p-8 border border-gray-100 dark:border-gray-700">
                                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                                            {analysis.summary || "Based on your clinical parameters, we've outlined the following strategic recommendations for your skin health."}
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
                                        <h4 className="font-bold text-gray-900 dark:text-white">Prescribed Routine</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Morning */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <Sun size={18} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Morning Routine</span>
                                            </div>
                                            <div className="space-y-6">
                                                {(Array.isArray(analysis.routine?.morning) ? analysis.routine.morning : []).map((item: any, idx: number) => {
                                                    const stepName = typeof item === 'string' ? item : item.name;
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <div className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-amber-200 transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Step {idx + 1}</span>
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
                                                <span className="text-xs font-bold uppercase tracking-widest">Night Routine</span>
                                            </div>
                                            <div className="space-y-6">
                                                {(Array.isArray(analysis.routine?.night || analysis.routine?.evening) ? (analysis.routine?.night || analysis.routine?.evening) : []).map((item: any, idx: number) => {
                                                    const stepName = typeof item === 'string' ? item : item.name;
                                                    return (
                                                        <div key={idx} className="flex flex-col gap-2">
                                                            <div className="group flex justify-between items-center bg-gray-50/50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Step {idx + 1}</span>
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
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);

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
        fetchAnalyses();
    }, []);

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
            let fullText = `Detailed Analysis for ${selectedAnalysis.date}. `;
            fullText += `Skin Health Score is ${selectedAnalysis.score} out of 100. `;
            fullText += `Skin type is ${selectedAnalysis.skinType} with ${selectedAnalysis.sensitivity} sensitivity. `;
            
            if (selectedAnalysis.summary) {
                fullText += `Summary: ${selectedAnalysis.summary}. `;
            }

            const recs = Array.isArray(selectedAnalysis.recommendations)
                ? selectedAnalysis.recommendations
                : selectedAnalysis.recommendations?.immediate
                    ? [...(selectedAnalysis.recommendations.immediate || []), ...(selectedAnalysis.recommendations.weekly || [])]
                    : [];
            
            if (recs.length > 0) {
                fullText += "Top Recommendations: " + recs.slice(0, 3).join(". ") + ".";
            }

            speakContent(fullText, `analysis-${selectedAnalysis.id}`);
        } else if (autoSpeech && !selectedAnalysis && analyses.length > 0) {
            const latest = analyses[0];
            const text = `Skin Analysis History. You have ${analyses.length} reports. Your latest score was ${latest.score} for ${latest.skinType} skin.`;
            speakContent(text, "history-summary");
        }
    }, [selectedAnalysis, autoSpeech, analyses.length]);

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

    const statusOptions = ["All", "Improved", "Stable", "Worse"];

    return (
        <UserLayout>
            <div className="user-analyzes-page mx-auto w-full max-w-[1400px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-[#156d95] uppercase tracking-[3px] mb-2 block font-mono">
                            Clinical History
                        </span>
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                                Skin Analysis History
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
                            View and track your skin progress over time through our diagnostic lens.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input
                                type="text"
                                placeholder="Search analyses..."
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
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <Link
                            href="/user/questionnaire"
                            className="flex items-center gap-2 px-8 py-4 bg-[#156d95] hover:bg-[#115a7b] rounded-full font-bold text-white shadow-xl shadow-[#156d95]/20 hover:scale-[1.02] transition-all"
                        >
                            <Plus size={20} />
                            New Analysis
                        </Link>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#156d95]"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredAnalyses.map((analysis, index) => {
                            let label = "Baseline Analysis";
                            if (index === 0) label = "Latest Analysis";
                            else if (index === 1) label = "Previous Result";
                            else if (index === filteredAnalyses.length - 1 && filteredAnalyses.length > 2) label = "Baseline Analysis";
                            else label = "Past History";

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
                )}

                {/* Empty State if needed */}
                {!loading && filteredAnalyses.length === 0 && (
                    <div className="mt-12 bg-white dark:bg-gray-800 rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
                        <div className="size-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-gray-300 size-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No analyses found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            {analyses.length === 0
                                ? "You haven't performed any skin analyses yet. Start your first scan to see your detailed report."
                                : "We couldn't find any analyses matching your search or filters. Try adjusting them or start a new scan."}
                        </p>
                        {analyses.length === 0 ? (
                            <Link
                                href="/user/questionnaire"
                                className="mt-8 px-10 py-4 bg-[#156d95] text-white rounded-full font-bold hover:bg-[#115a7b] transition-all inline-block"
                            >
                                Perform First Analysis
                            </Link>
                        ) : (
                            <button
                                onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}
                                className="mt-8 px-10 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white rounded-full font-bold hover:bg-gray-200 transition-all"
                            >
                                Clear All Filters
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

