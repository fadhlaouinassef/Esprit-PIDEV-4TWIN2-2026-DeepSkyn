"use client";

import React, { useEffect, useState } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { UserBadgeCard, BadgeVariant } from "@/app/components/user/UserBadgeCard";
import { ChevronRight, Share2, Lock, CheckCircle2, TrendingUp, Sparkles, Award, Target, Zap, ShieldCheck, Gem, Trophy, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

type MotivationSummary = {
    currentBadge: {
        id: number;
        titre: string;
        description: string;
        niveau: string;
        date: string;
    } | null;
    nextBadge: {
        level: string;
        progress: number;
    } | null;
    activeRequirements: { text: string; met: boolean }[];
    metrics: any;
    history: any[];
    motivationMessage: string;
    allRules: Record<string, { title: string, conditions: { text: string; met: boolean }[] }>;
};

const NIVEAU_TO_VARIANT: Record<string, BadgeVariant> = {
    'BRONZE': 'bronze',
    'SILVER': 'silver',
    'GOLD': 'gold',
    'PLATINUM': 'platinum',
    'RUBY_MASTER': 'ruby'
};

const ALL_LEVELS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY_MASTER'];

const LEVEL_ICONS: Record<string, any> = {
    'BRONZE': Target,
    'SILVER': CalendarDays,
    'GOLD': Zap,
    'PLATINUM': ShieldCheck,
    'RUBY_MASTER': Trophy
};

export default function BadgePage() {
    const { data: session } = useSession();
    const [data, setData] = useState<MotivationSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/user/motivation")
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to fetch motivation data");
                }
                return res.json();
            })
            .then((resData) => {
                setData(resData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching motivation data:", err);
                setLoading(false);
            });
    }, []);

    const handleShare = async () => {
        if (!data || !data.currentBadge) return;
        const shareText = `I just earned the ${data.currentBadge.titre} badge on DeepSkyn! My skin health is on track. #DeepSkyn #SkinHero`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'DeepSkyn Badge',
                    text: shareText,
                    url: window.location.origin,
                });
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareText);
            alert("Share message copied to clipboard!");
        }
    };

    if (loading) {
        return (
            <UserLayout userName={session?.user?.name || "User"} userPhoto={session?.user?.image || "/avatar.png"}>
                <div id="loading-skeleton" className="mx-auto w-full max-w-[1000px] py-10 space-y-8 animate-pulse">
                   <div className="h-6 w-32 bg-gray-200 rounded"></div>
                   <div className="h-10 w-64 bg-gray-200 rounded mx-auto"></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="h-[400px] bg-gray-200 rounded-[32px]"></div>
                       <div className="space-y-4">
                           <div className="h-32 bg-gray-100 rounded-2xl"></div>
                           <div className="h-48 bg-gray-100 rounded-2xl"></div>
                       </div>
                   </div>
                </div>
            </UserLayout>
        );
    }

    if (!data && !loading) {
        return (
            <UserLayout userName={session?.user?.name || "User"} userPhoto={session?.user?.image || "/avatar.png"}>
                <div className="mx-auto w-full max-w-[1000px] py-20 flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Motivation Data Unavailable</h2>
                    <p className="text-gray-500 max-w-md">
                        We were unable to load your achievement data. Please ensure you are logged in and have completed your initial profile.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg mt-4"
                    >
                        Retry Loading
                    </button>
                </div>
            </UserLayout>
        );
    }

    const currentVariant = data?.currentBadge ? NIVEAU_TO_VARIANT[data.currentBadge.niveau] : 'bronze';

    return (
        <UserLayout userName={session?.user?.name || "User"} userPhoto={session?.user?.image || "/avatar.png"}>
            <div className="mx-auto w-full max-w-[1000px] flex flex-col items-center space-y-8 py-10 px-4">
                
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-gray-400 w-full mb-2">
                    <span className="cursor-pointer hover:text-primary">User</span>
                    <ChevronRight size={14} />
                    <span className="text-gray-900 dark:text-white font-medium">Badges & Achievements</span>
                </nav>

                {/* Motivation Message with Mesh Gradient Background */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full py-16 px-8 rounded-[48px] overflow-hidden shadow-2xl"
                >
                    {/* Mesh Gradient Background Layer */}
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[150%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[150%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
                        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6 shadow-sm"
                        >
                            <Sparkles size={14} className="text-primary animate-spin-[2s]" />
                            Power Level
                        </motion.div>
                        
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight max-w-3xl"
                        >
                            {data?.motivationMessage || "Welcome to your skin journey!"}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-xl"
                        >
                            Complete your routines and track your progress to unlock legendary status.
                        </motion.p>
                    </div>
                </motion.div>

                <div className="w-full space-y-10">
                    
                    {/* Progress & Metrics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Current Badge Card (The one restored) */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-4 flex flex-col items-center"
                        >
                            <UserBadgeCard
                                userPhoto={session?.user?.image || "/avatar.png"}
                                userName={session?.user?.name || "DeepSkyn Hero"}
                                badgeTitle={data?.currentBadge?.titre || "Initié de DeepSkyn"}
                                description={data?.currentBadge?.description || "Commencez à compléter vos routines pour gagner votre premier badge !"}
                                variant={currentVariant as BadgeVariant}
                            />
                            
                            <button 
                                onClick={handleShare}
                                className="mt-6 w-full flex items-center justify-center gap-3 py-5 px-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[24px] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_15px_40px_rgba(0,0,0,0.15)] group"
                            >
                                <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
                                PARTAGER LE SUCCÈS
                            </button>
                        </motion.div>

                        {/* Next Milestone & Requirements Card */}
                        <div className="lg:col-span-8 space-y-6 flex flex-col">
                            <div className="p-8 bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                                                Objectif Actif
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black flex items-center gap-3 leading-none">
                                            Vers le niveau {data?.nextBadge?.level || "Maître"}
                                            <TrendingUp className="text-primary animate-bounce shrink-0" size={24} />
                                        </h3>
                                        <p className="text-gray-500 font-medium mt-1 italic uppercase text-[10px] tracking-widest opacity-70">Suivi détaillé de vos accomplissements</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-5xl font-black text-primary leading-none tracking-tighter">{Math.round(data?.nextBadge?.progress || 0)}%</div>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Complété</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="relative h-6 w-full bg-gray-100 dark:bg-black/40 rounded-full overflow-hidden mb-12 p-1 border border-gray-200/50 dark:border-white/5 shadow-inner">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data?.nextBadge?.progress || 0}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-linear-to-r from-primary via-primary to-primary-dark rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-primary/5 dark:bg-black/20 p-6 rounded-[32px] border border-primary/10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-primary/20 rounded-xl font-black">
                                                <Target size={20} className="text-primary" />
                                            </div>
                                            <h4 className="text-sm font-black text-primary uppercase tracking-[0.1em] italic leading-none">Missions de validation</h4>
                                        </div>

                                        <div className="space-y-3">
                                            {data?.activeRequirements?.length ? data.activeRequirements.map((req: any, i: number) => (
                                                <motion.div 
                                                    key={i} 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                                                        req.met 
                                                            ? 'bg-green-50/80 dark:bg-green-900/10 border-green-200 dark:border-green-800/40' 
                                                            : 'bg-white/50 dark:bg-black/20 border-gray-100 dark:border-white/5 shadow-sm'
                                                    }`}
                                                >
                                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                                                        req.met 
                                                            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                                                            : 'border-gray-200 dark:border-white/10 group-hover:scale-110'
                                                    }`}>
                                                        {req.met && <CheckCircle2 size={14} strokeWidth={4} />}
                                                    </div>
                                                    <span className={`text-sm font-bold ${req.met ? 'text-green-800 dark:text-green-100 line-through opacity-70' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {req.text}
                                                    </span>
                                                </motion.div>
                                            )) : (
                                                <div className="flex flex-col items-center gap-4 p-8 text-center bg-green-500/10 text-green-600 rounded-[32px] border border-green-500/20 backdrop-blur-sm">
                                                    <div className="p-4 bg-green-500/20 rounded-full">
                                                        <Sparkles size={40} className="animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase text-xl leading-none mb-1">Badge Prêt!</p>
                                                        <p className="text-sm font-bold opacity-80 italic">Toutes les missions de ce palier sont validées.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Horizontal Metrics Section (since we restored the card, let's put metrics horizontally below milestone) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { label: 'SÉRIE', value: `${data?.metrics?.streakDays ?? 0}J`, color: 'orange', icon: CalendarDays },
                                    { label: 'ANALYSES', value: data?.metrics?.finalAnalysisCountAll ?? 0, color: 'blue', icon: Award },
                                    { label: 'SCORE', value: Math.round(data?.metrics?.lastAnalysisScore || 0), color: 'green', icon: Zap }
                                ].map((stat, i) => (
                                    <motion.div 
                                        key={i}
                                        whileHover={{ y: -5 }}
                                        className="p-6 bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-[32px] border border-gray-100 dark:border-white/10 text-center shadow-xl group overflow-hidden"
                                    >
                                        <div className={`p-3 bg-${stat.color}-500/10 rounded-xl w-fit mx-auto mb-3`}>
                                            <stat.icon size={24} className={`text-${stat.color}-500`} />
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] block mb-1 truncate">{stat.label}</span>
                                        <span className={`text-3xl font-black text-${stat.color}-500 italic leading-none tracking-tighter`}>{stat.value}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badge Roadmap & Rules */}
                <div className="w-full mt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-3xl font-black">Roadmap to Mastery</h3>
                            <p className="text-gray-500">Track your path from beginner to expert</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {ALL_LEVELS.map((level, idx) => {
                            const earnedBadge = data?.history?.find((b: any) => b.niveau === level);
                            const isEarned = !!earnedBadge;
                            const isNext = data?.nextBadge?.level === level;
                            const ruleInfo = data?.allRules?.[level];
                            const LevelIcon = LEVEL_ICONS[level];
                            
                            const levelColors: Record<string, string> = {
                                'BRONZE': 'from-amber-600 to-amber-800',
                                'SILVER': 'from-slate-300 to-slate-500',
                                'GOLD': 'from-yellow-400 to-yellow-600',
                                'PLATINUM': 'from-cyan-100 to-blue-400',
                                'RUBY_MASTER': 'from-rose-500 to-red-800'
                            };

                            return (
                                <motion.div 
                                    key={level}
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`relative flex flex-col md:flex-row gap-8 p-10 rounded-[48px] border transition-all duration-500 group ${
                                        isEarned 
                                            ? 'bg-white dark:bg-gray-800/80 border-green-200 dark:border-green-900/30 shadow-xl' 
                                            : isNext 
                                                ? 'bg-white dark:bg-gray-800 border-primary shadow-2xl scale-[1.03] z-20 shadow-primary/20' 
                                                : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100 dark:border-white/5 opacity-60 grayscale'
                                    }`}
                                >
                                    {/* Left side: Icon & Status */}
                                    <div className="flex flex-col items-center md:items-start gap-6 md:w-56 shrink-0">
                                        <div className={`relative w-28 h-28 rounded-[36px] flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-0 -rotate-3 ${
                                            isEarned || isNext ? `bg-linear-to-br ${levelColors[level]} text-white` : 'bg-gray-200 text-gray-400'
                                        }`}>
                                            <LevelIcon size={56} strokeWidth={1} />
                                            {isEarned && (
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                                                    <CheckCircle2 size={16} strokeWidth={3} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center md:text-left">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-3 ${
                                                isEarned ? 'bg-green-100 text-green-700' : isNext ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {isEarned ? 'Earned' : isNext ? 'Target' : 'Locked'}
                                            </span>
                                            <h4 className="text-2xl font-black uppercase tracking-tight">{level.replace('_', ' ')}</h4>
                                        </div>
                                    </div>

                                    {/* Right side: Rules & Progress */}
                                    <div className="flex-1 space-y-6">
                                        <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-5 rounded-3xl border border-gray-100/50 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-10 rounded-full bg-primary/20" />
                                                <h5 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                                    Mission Parameters
                                                </h5>
                                            </div>
                                            {isEarned && (
                                                <p className="text-[10px] text-green-600 font-black flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full uppercase tracking-widest">
                                                    Mission Complete
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {ruleInfo?.conditions?.length ? ruleInfo.conditions.map((cond: any, cIdx: number) => (
                                                <div key={cIdx} className={`flex items-start gap-4 p-5 rounded-3xl text-sm transition-all duration-300 ${
                                                    isEarned || cond.met ? 'bg-green-50/50 dark:bg-green-900/5 text-green-800 dark:text-green-200' : 
                                                    isNext ? 'bg-white dark:bg-gray-900 border border-primary/5 shadow-sm hover:shadow-md' :
                                                    'bg-white/50 dark:bg-white/5'
                                                }`}>
                                                    <div className={`mt-1 h-5 w-5 rounded-full shrink-0 border-2 flex items-center justify-center transition-all ${
                                                        isEarned || cond.met ? 'bg-green-500 border-green-500 text-white' : 
                                                        isNext ? 'border-primary/50' : 
                                                        'border-gray-200'
                                                    }`}>
                                                        {(isEarned || cond.met) && <CheckCircle2 size={12} strokeWidth={4} />}
                                                    </div>
                                                    <p className={`font-bold leading-snug ${(isEarned || cond.met) ? 'line-through opacity-50' : ''}`}>{cond.text}</p>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-8 text-center text-gray-400 text-sm font-medium italic opacity-50">
                                                    Missions classified. Reach previous level to reveal.
                                                </div>
                                            )}
                                        </div>
                                        {isNext && (
                                            <div className="pt-4 px-2">
                                                <div className="flex justify-between items-end mb-3">
                                                    <div>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Your Trajectory</span>
                                                        <span className="text-xl font-black text-primary italic">Almost there...</span>
                                                    </div>
                                                    <span className="text-3xl font-black text-primary italic">{Math.round(data?.nextBadge?.progress || 0)}%</span>
                                                </div>
                                                <div className="h-4 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden p-1 shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${data?.nextBadge?.progress || 0}%` }}
                                                        className="h-full bg-linear-to-r from-primary to-primary-dark rounded-full shadow-lg shadow-primary/20"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Connecting Line (except for last one) */}
                                    {idx < ALL_LEVELS.length - 1 && (
                                        <div className="hidden md:flex absolute bottom-[-40px] left-[78px] w-1 h-10 flex-col items-center gap-1 opacity-20">
                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                            <div className="w-1 h-1 rounded-full bg-gray-400" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </UserLayout>
    );
}
