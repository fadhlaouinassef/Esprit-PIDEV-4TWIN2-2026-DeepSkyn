"use client";

import React, { useEffect, useState } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Calendar,
    Shield,
    Settings,
    Award,
    Clock,
    ChevronRight,
    Camera,
    Activity,
    Droplets,
    Sparkles,
    UserCircle
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { AudioToggleButton } from "@/app/components/user/AudioToggleButton";
import { useTranslations } from "next-intl";

interface UserProfile {
    id: number;
    nom: string;
    email: string;
    image?: string;
    age?: number;
    sexe?: string;
    skin_type?: string;
    created_at: string;
    badges?: UserBadge[];
    skinAnalyses?: SkinAnalysis[];
}

interface UserBadge {
    titre: string;
    description?: string;
}

interface SkinAnalysisImage {
    image_url?: string;
}

interface SkinAnalysis {
    score?: number;
    date_creation: string;
    description?: string;
    score_eau?: number;
    age_peau?: number;
    images?: SkinAnalysisImage[];
}

export default function ProfilePage() {
    const t = useTranslations();
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error(t("userProfile.toasts.imageTooLarge"));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64String })
                });

                if (!response.ok) throw new Error('Failed to update photo');

                setProfile(prev => prev ? { ...prev, image: base64String } : null);
                toast.success(t("userProfile.toasts.photoUpdated"));
            } catch {
                toast.error(t("userProfile.toasts.updatePhotoError"));
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/user/profile');
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error(t('userProfile.toasts.loadProfileError'));
            } finally {
                setIsLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchProfile();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status]);

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

    // Auto-read profile summary
    useEffect(() => {
        if (autoSpeech && profile) {
            let fullText = t("userProfile.speech.profileFor", { name: profile.nom });
            fullText += t("userProfile.speech.memberSince", { date: new Date(profile.created_at).toLocaleDateString() });
            fullText += t("userProfile.speech.skinType", { skinType: profile.skin_type || t("userProfile.fallbacks.notAnalyzed") });
            
            if (profile.age) fullText += t("userProfile.speech.age", { age: profile.age });
            if (profile.email) fullText += t("userProfile.speech.email", { email: profile.email });

            if (profile.skinAnalyses && profile.skinAnalyses.length > 0) {
                const latest = profile.skinAnalyses[0];
                fullText += t("userProfile.speech.latestScore", { score: latest.score, date: new Date(latest.date_creation).toLocaleDateString() });
            }

            if (profile.badges && profile.badges.length > 0) {
                fullText += t("userProfile.speech.latestAchievement", { badge: profile.badges[0].titre });
            }

            const id = `profile-full-${profile.id}-${profile.nom}-${profile.skinAnalyses?.length || 0}-${profile.badges?.length || 0}`;
            if (speakingIndex !== id) {
                speakContent(fullText, id);
            }
        }
    }, [profile, autoSpeech]);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    if (isLoading) {
        return (
            <UserLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="size-12 animate-spin rounded-full border-4 border-[#156d95] border-t-transparent"></div>
                </div>
            </UserLayout>
        );
    }

    if (!session) {
        return (
            <UserLayout>
                <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                    <Shield className="mb-4 size-16 text-gray-300" />
                    <h2 className="text-2xl font-bold">{t("userProfile.authRequired.title")}</h2>
                    <p className="text-gray-500">{t("userProfile.authRequired.description")}</p>
                    <Link href="/signin" className="mt-6 rounded-xl bg-[#156d95] px-8 py-3 text-white font-bold">
                        {t("userProfile.authRequired.cta")}
                    </Link>
                </div>
            </UserLayout>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <UserLayout userName={profile?.nom} userPhoto={profile?.image}>
            <div className="mx-auto w-full max-w-[1200px] pb-20 space-y-6">
                {/* Breadcrumb & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                        <span>{t("userProfile.breadcrumb.user")}</span>
                        <ChevronRight size={14} />
                        <span className="text-foreground font-medium">{t("userProfile.breadcrumb.profile")}</span>
                    </nav>
                    <AudioToggleButton
                        enabled={autoSpeech}
                        onToggle={() => {
                            if (autoSpeech) stopSpeaking();
                            setAutoSpeech(!autoSpeech);
                        }}
                        label={t("userProfile.audioLabel")}
                    />
                </div>

                <motion.div

                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="hc-keep-gradient relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#156d95] to-[#0d4a6b] p-8 md:p-12 text-white shadow-2xl">
                        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl opacity-50"></div>
                        <div className="absolute right-20 bottom-0 size-60 rounded-full bg-blue-400/10 blur-3xl opacity-30"></div>

                        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                            <div className="relative group">
                                <input
                                    type="file"
                                    id="photo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                                <div className="relative size-32 md:size-40 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
                                    {profile?.image ? (
                                        <Image
                                            src={profile.image}
                                            alt={profile.nom}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User size={80} className="text-white/50" />
                                    )}
                                    <button
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Camera className="text-white" size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {profile?.skin_type || t('userProfile.fallbacks.newUser')}
                                </span>
                                <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {profile?.nom || t('userProfile.fallbacks.userName')}
                                </h1>
                                <p className="mt-2 text-white/70 text-lg font-medium">
                                    {t("userProfile.memberSince")} {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : t('userProfile.fallbacks.unknown')}
                                </p>

                                <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                                    <Link href="/user/settings" className="profile-edit-link flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[#156d95] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                                        <Settings size={18} />
                                        {t("userProfile.actions.editProfile")}
                                    </Link>
                                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-white font-bold backdrop-blur-md border border-white/20">
                                        <Award size={18} className="text-yellow-400" />
                                        {t("userProfile.latestBadgeLabel")} {profile?.badges?.[0]?.titre || t("userProfile.fallbacks.newbie")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle Column: Personal Info & Stats */}
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="mb-8 text-xl font-bold flex items-center gap-3">
                                    <Activity className="text-[#156d95]" size={22} />
                                    {t("userProfile.sections.personalDetails")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={12} /> {t("userProfile.fields.email")}
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{profile?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> {t("userProfile.fields.age")}
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{profile?.age ? t("userProfile.fields.ageYears", { age: profile.age }) : t("userProfile.fallbacks.notSet")}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <UserCircle size={12} /> {t("userProfile.fields.gender")}
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{profile?.sexe || t("userProfile.fallbacks.notSet")}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Droplets size={12} /> {t("userProfile.fields.skinType")}
                                        </label>
                                        <p className="text-lg font-bold text-[#156d95]">{profile?.skin_type || t("userProfile.fallbacks.notAnalyzed")}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <Sparkles className="text-[#156d95]" size={22} />
                                        {t("userProfile.sections.latestAnalysis")}
                                    </h3>
                                    <Link href="/user/analyzes" className="text-sm font-bold text-[#156d95] hover:underline flex items-center gap-1 uppercase tracking-wider">
                                        {t("userProfile.actions.viewHistory")} <ChevronRight size={14} />
                                    </Link>
                                </div>

                                {profile?.skinAnalyses && profile.skinAnalyses.length > 0 ? (
                                    <div className="relative group overflow-hidden rounded-[28px] bg-white dark:bg-gray-900/40 p-5 border border-gray-100 dark:border-gray-800 transition-all hover:border-[#156d95]/40 shadow-sm hover:shadow-md">
                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                            {/* Compact Score Circle */}
                                            <div className="relative size-20 shrink-0">
                                                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                                    <circle className="text-gray-100 dark:text-gray-800" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                                    <circle
                                                        className="text-[#156d95]"
                                                        strokeWidth="10"
                                                        strokeDasharray={2 * Math.PI * 40}
                                                        strokeDashoffset={2 * Math.PI * 40 * (1 - (profile.skinAnalyses[0].score || 70) / 100)}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r="40"
                                                        cx="50"
                                                        cy="50"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xl font-black text-gray-900 dark:text-white">{profile.skinAnalyses[0].score || "70"}</span>
                                                </div>
                                            </div>

                                            {/* Sleek Info Section */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4 mb-3">
                                                    <div className="truncate">
                                                        <h4 className="text-lg font-black text-gray-900 dark:text-white truncate">
                                                            {profile.skinAnalyses[0].description || t("userProfile.fallbacks.generalAnalysis")}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                                            <Clock size={10} /> {new Date(profile.skinAnalyses[0].date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                    {profile.skinAnalyses[0].images?.[0]?.image_url && (
                                                        <div className="relative size-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
                                                            <Image src={profile.skinAnalyses[0].images[0].image_url} alt="Scan" fill className="object-cover" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Compact Metrics Row */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700/30">
                                                        <Droplets size={12} className="text-blue-500" />
                                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300">{profile.skinAnalyses[0].score_eau || "64"}%</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700/30">
                                                        <Sparkles size={12} className="text-indigo-500" />
                                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300">{t("userProfile.fields.ageYearsShort", { age: profile.skinAnalyses[0].age_peau || "24" })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
                                        <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
                                            <Camera size={30} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">{t("userProfile.states.noAnalysis")}</p>
                                        <Link href="/user/questionnaire" className="mt-4 text-[#156d95] font-bold hover:underline">
                                            {t("userProfile.actions.startFirstAnalysis")}
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right Column: Achievements & Badges */}
                        <div className="space-y-8">
                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="mb-6 text-xl font-bold flex items-center gap-3">
                                    <Award className="text-yellow-500" size={22} />
                                    {t("userProfile.sections.recentBadge")}
                                </h3>

                                <div className="flex flex-col items-center">
                                    {profile?.badges && profile.badges.length > 0 ? (
                                        <div className="flex flex-col items-center text-center group">
                                            <div className="hc-keep-gradient size-24 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 mb-3 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                                <div className="size-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
                                                    <Sparkles className="text-yellow-600" size={32} />
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{profile.badges[0].titre}</p>
                                            <p className="text-xs text-gray-500 mt-1">{profile.badges[0].description || t("userProfile.fallbacks.achievementEarned")}</p>
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center">
                                            <p className="text-sm text-gray-400 font-medium">{t("userProfile.noBadgesHint")}</p>
                                        </div>
                                    )}
                                </div>

                                <Link href="/user/badge" className="mt-8 block text-center rounded-2xl border-2 border-[#156d95]/20 py-3 text-[#156d95] font-bold hover:bg-[#156d95]/5 transition-all uppercase text-[10px] tracking-[0.2em]">
                                    {t("userProfile.actions.viewGallery")}
                                </Link>
                            </motion.div>

                            {/* Verification status / Security notice */}
                            <motion.div variants={itemVariants} className="rounded-[32px] bg-emerald-50 dark:bg-emerald-900/20 p-8 border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                        <Shield className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400">{t("userProfile.security.title")}</h4>
                                        <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-500/80">
                                            {t("userProfile.security.description")}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>

        </UserLayout>
    );
}

