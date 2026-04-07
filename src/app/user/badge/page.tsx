"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { UserBadgeCard, BadgeVariant } from "@/app/components/user/UserBadgeCard";
import { ChevronRight, Share2, Lock, CheckCircle2, TrendingUp, Sparkles, Award, Target, Zap, ShieldCheck, Gem, Trophy, CalendarDays, Facebook, Instagram, Music2, Link2, Download, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [shareBusy, setShareBusy] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);

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

    const shareUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        return `${window.location.origin}/user/badge`;
    }, []);

    const shareText = useMemo(() => {
        const badgeTitle = data?.currentBadge?.titre || "my latest DeepSkyn badge";
        return `I just earned ${badgeTitle} on DeepSkyn. Consistency pays off. #DeepSkyn #SkinHero`;
    }, [data?.currentBadge?.titre]);

    const renderShareImageBlob = async (): Promise<Blob> => {
        const width = 1080;
        const height = 1350;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Unable to initialize image canvas");

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#f8fafc");
        gradient.addColorStop(0.48, "#ffffff");
        gradient.addColorStop(1, "#e0f2fe");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        const cardX = 56;
        const cardY = 56;
        const cardW = width - 112;
        const cardH = height - 112;

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;

        const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        };

        drawRoundedRect(cardX, cardY, cardW, cardH, 56);
        ctx.fill();
        ctx.stroke();

        const drawWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 4) => {
            const words = text.split(" ");
            const lines: string[] = [];
            let current = "";

            for (const word of words) {
                const candidate = current ? `${current} ${word}` : word;
                if (ctx.measureText(candidate).width <= maxWidth) {
                    current = candidate;
                } else {
                    if (current) lines.push(current);
                    current = word;
                }
            }
            if (current) lines.push(current);

            lines.slice(0, maxLines).forEach((line, idx) => {
                ctx.fillText(line, x, y + idx * lineHeight);
            });
        };

        ctx.fillStyle = "#0f172a";
        ctx.font = "900 40px Satoshi, Arial, sans-serif";
        ctx.fillText("DEEPSKYN BADGE", cardX + 56, cardY + 96);

        ctx.fillStyle = "#0f172a";
        ctx.font = "900 84px Satoshi, Arial, sans-serif";
        drawWrappedText(data?.currentBadge?.titre || "DeepSkyn Hero", cardX + 56, cardY + 220, cardW - 112, 92, 2);

        ctx.fillStyle = "#475569";
        ctx.font = "600 38px Satoshi, Arial, sans-serif";
        drawWrappedText(
            data?.currentBadge?.description || "Consistency and skin progress unlocked a new achievement.",
            cardX + 56,
            cardY + 430,
            cardW - 112,
            48,
            4
        );

        const footerX = cardX + 56;
        const footerY = cardY + cardH - 250;
        const footerW = cardW - 112;
        const footerH = 160;
        drawRoundedRect(footerX, footerY, footerW, footerH, 30);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.strokeStyle = "#e2e8f0";
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "700 22px Satoshi, Arial, sans-serif";
        ctx.fillText("LEVEL", footerX + 32, footerY + 44);
        ctx.fillText("USER", footerX + footerW - 260, footerY + 44);

        ctx.fillStyle = "#0f172a";
        ctx.font = "900 46px Satoshi, Arial, sans-serif";
        ctx.fillText((data?.currentBadge?.niveau || "BRONZE").replace("_", " "), footerX + 32, footerY + 104);
        ctx.fillText(session?.user?.name || "DeepSkyn User", footerX + footerW - 260, footerY + 104);

        const avatarSrc = session?.user?.image;
        if (avatarSrc) {
            try {
                const avatar = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const image = new Image();
                    image.crossOrigin = "anonymous";
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = avatarSrc;
                });

                const avatarSize = 120;
                const avatarX = cardX + cardW - avatarSize - 56;
                const avatarY = cardY + 40;
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.stroke();
            } catch {
                // Avatar is optional; continue without it if cross-origin loading fails.
            }
        }

        ctx.fillStyle = "#64748b";
        ctx.font = "700 26px Satoshi, Arial, sans-serif";
        ctx.fillText(new Date().toLocaleDateString(), cardX + 56, cardY + cardH - 40);
        ctx.fillText("deepskyn.app", cardX + cardW - 220, cardY + cardH - 40);

        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
        if (!blob) throw new Error("Unable to generate share image");
        return blob;
    };

    const downloadBlob = (blob: Blob, fileName: string) => {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
    };

    const prepareSocialAsset = async () => {
        const blob = await renderShareImageBlob();
        downloadBlob(blob, `deepskyn-badge-${(data?.currentBadge?.niveau || "hero").toLowerCase()}.png`);
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    };

    const downloadShareImage = async () => {
        setShareBusy(true);
        try {
            const blob = await renderShareImageBlob();
            downloadBlob(blob, `deepskyn-badge-${(data?.currentBadge?.niveau || "hero").toLowerCase()}.png`);
            toast.success("Badge image downloaded");
        } catch (error) {
            console.error(error);
            toast.error("Unable to generate badge image");
        } finally {
            setShareBusy(false);
        }
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl || window.location.href);
            toast.success("Badge link copied");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const copyCaption = async () => {
        try {
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            toast.success("Caption copied");
        } catch {
            toast.error("Failed to copy caption");
        }
    };

    const shareToFacebook = async () => {
        setShareBusy(true);
        try {
            await prepareSocialAsset();
            const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            window.open(url, "_blank", "noopener,noreferrer");
            toast("Facebook opened. Your badge image and caption are ready to paste.");
        } catch (error) {
            console.error(error);
            toast.error("Facebook share preparation failed");
        } finally {
            setShareBusy(false);
        }
    };

    const shareToX = async () => {
        setShareBusy(true);
        try {
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        } catch {
            // Clipboard can fail on strict browser policies; continue with URL share.
        } finally {
            setShareBusy(false);
        }
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const shareToInstagram = async () => {
        setShareBusy(true);
        try {
            await prepareSocialAsset();
            window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
            toast("Instagram opened. Upload the downloaded badge and paste the copied caption.");
        } catch (error) {
            console.error(error);
            toast.error("Instagram share preparation failed");
        } finally {
            setShareBusy(false);
        }
    };

    const shareToTikTok = async () => {
        setShareBusy(true);
        try {
            await prepareSocialAsset();
            window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
            toast("TikTok opened. Upload the downloaded badge and paste the copied caption.");
        } catch (error) {
            console.error(error);
            toast.error("TikTok share preparation failed");
        } finally {
            setShareBusy(false);
        }
    };

    const shareNatively = async () => {
        if (!navigator.share) {
            toast.error("Native share is not available on this device");
            return;
        }

        setShareBusy(true);
        try {
            const image = await renderShareImageBlob();
            const file = new File([image], "deepskyn-badge.png", { type: "image/png" });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "My DeepSkyn badge",
                    text: shareText,
                    files: [file],
                });
            } else {
                await navigator.share({
                    title: "My DeepSkyn badge",
                    text: shareText,
                    url: shareUrl,
                });
            }
        } catch (error) {
            if ((error as Error)?.name !== "AbortError") {
                console.error(error);
                toast.error("Share failed");
            }
        } finally {
            setShareBusy(false);
        }
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

    // Auto-read achievements summary
    useEffect(() => {
        if (autoSpeech && data) {
            let fullText = `Achievements summary. `;
            if (data.currentBadge) {
                fullText += `Your current badge is ${data.currentBadge.titre}. ${data.currentBadge.description}. `;
            } else {
                fullText += `You haven't earned a badge yet. `;
            }

            if (data.nextBadge) {
                fullText += `You are ${Math.round(data.nextBadge.progress)}% of the way to the ${data.nextBadge.level} level. `;
                
                if (data.activeRequirements && data.activeRequirements.length > 0) {
                    fullText += "To reach the next level, you need to: ";
                    data.activeRequirements.forEach((req: any) => {
                        fullText += `${req.text}. `;
                    });
                }
            }

            if (data.metrics) {
                fullText += `Metrics summary: ${data.metrics.streakDays} days streak. Full score: ${Math.round(data.metrics.lastAnalysisScore || 0)}. Total analyses: ${data.metrics.finalAnalysisCountAll || 0}. `;
            }

            if (data.motivationMessage) {
                fullText += `Daily motivation: ${data.motivationMessage}. `;
            }

            const id = `badges-full-${data.currentBadge?.id || 'none'}-${data.nextBadge?.progress || 0}-${data.metrics?.streakDays || 0}`;
            if (speakingIndex !== id) {
                speakContent(fullText, id);
            }
        }
    }, [data, autoSpeech]);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

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
            <div className="user-badge-page mx-auto w-full max-w-[1000px] flex flex-col items-center space-y-8 py-10 px-4">
                
                {/* Breadcrumb & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="cursor-pointer hover:text-primary">User</span>
                        <ChevronRight size={14} />
                        <span className="text-gray-900 dark:text-white font-medium">Badges & Achievements</span>
                    </nav>
                    <button
                        onClick={() => {
                            if (autoSpeech) stopSpeaking();
                            setAutoSpeech(!autoSpeech);
                        }}
                        className={`p-2 rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                            autoSpeech 
                            ? "bg-primary text-white shadow-primary/20" 
                            : "bg-white border border-gray-100 dark:bg-gray-800 dark:border-gray-700 text-gray-400 hover:text-primary"
                        }`}
                        title={autoSpeech ? "Désactiver la lecture automatique" : "Activer la lecture automatique"}
                    >
                        {autoSpeech ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">Audio Mode</span>
                    </button>
                </div>

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
                                badgeTitle={data?.currentBadge?.titre || "DeepSkyn Beginner"}
                                description={data?.currentBadge?.description || "Start completing your routines to earn your first badge."}
                                variant={currentVariant as BadgeVariant}
                            />
                            
                            <button 
                                onClick={() => setShareMenuOpen(true)}
                                className="mt-6 w-full flex items-center justify-center gap-3 py-5 px-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[24px] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_15px_40px_rgba(0,0,0,0.15)] group"
                            >
                                <Share2 size={18} className="group-hover:rotate-12 transition-transform" />
                                SHARE YOUR ACHIEVEMENT
                            </button>
                        </motion.div>

                        {/* Next Milestone & Requirements Card */}
                        <div className="lg:col-span-8 space-y-6 flex flex-col">
                            <div className="p-8 bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                                                Active Goal
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black flex items-center gap-3 leading-none">
                                            Toward {data?.nextBadge?.level || "Master"} level
                                            <TrendingUp className="text-primary animate-bounce shrink-0" size={24} />
                                        </h3>
                                        <p className="text-gray-500 font-medium mt-1 italic uppercase text-[10px] tracking-widest opacity-70">Detailed progress tracking</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-5xl font-black text-primary leading-none tracking-tighter">{Math.round(data?.nextBadge?.progress || 0)}%</div>
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Completed</span>
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
                                            <h4 className="text-sm font-black text-primary uppercase tracking-[0.1em] italic leading-none">Validation tasks</h4>
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
                                                        <p className="font-black uppercase text-xl leading-none mb-1">Badge Ready!</p>
                                                        <p className="text-sm font-bold opacity-80 italic">All requirements for this tier are completed.</p>
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
                                    { label: 'STREAK', value: `${data?.metrics?.streakDays ?? 0}d`, color: 'orange', icon: CalendarDays },
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

                <AnimatePresence>
                    {shareMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center"
                            onClick={() => setShareMenuOpen(false)}
                        >
                            <motion.div
                                initial={{ y: 20, opacity: 0, scale: 0.98 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: 20, opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-[560px] rounded-[32px] border border-white/20 bg-white dark:bg-gray-900 p-6 shadow-2xl"
                            >
                                <div className="mb-5">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">Share Your Badge</h3>
                                    <p className="text-sm text-gray-500 mt-1">Post your achievement on social media with a generated DeepSkyn card.</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <button onClick={shareToFacebook} className="share-action-btn">
                                        <Facebook size={18} /> Facebook
                                    </button>
                                    <button onClick={shareToX} className="share-action-btn">
                                        <X size={18} /> X
                                    </button>
                                    <button onClick={shareToInstagram} className="share-action-btn" disabled={shareBusy}>
                                        <Instagram size={18} /> Instagram
                                    </button>
                                    <button onClick={shareToTikTok} className="share-action-btn" disabled={shareBusy}>
                                        <Music2 size={18} /> TikTok
                                    </button>
                                    <button onClick={copyShareLink} className="share-action-btn">
                                        <Link2 size={18} /> Copy link
                                    </button>
                                    <button onClick={downloadShareImage} className="share-action-btn" disabled={shareBusy}>
                                        {shareBusy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Download
                                    </button>
                                </div>

                                <button
                                    onClick={shareNatively}
                                    disabled={shareBusy}
                                    className="mt-4 w-full py-3 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 disabled:opacity-60"
                                >
                                    Share via device apps
                                </button>

                                <button
                                    onClick={() => setShareMenuOpen(false)}
                                    className="mt-3 w-full py-3 rounded-2xl border border-gray-200 dark:border-white/10 font-bold text-gray-700 dark:text-gray-200"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <style jsx>{`
                .share-action-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border-radius: 16px;
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    padding: 12px 14px;
                    font-weight: 800;
                    font-size: 13px;
                    background: rgba(248, 250, 252, 0.8);
                    color: rgb(15, 23, 42);
                    transition: transform 0.2s ease, background-color 0.2s ease;
                }

                .share-action-btn:hover {
                    transform: translateY(-1px);
                    background: rgba(241, 245, 249, 1);
                }

                .share-action-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    transform: none;
                }

                .dark .share-action-btn {
                    background: rgba(15, 23, 42, 0.55);
                    border-color: rgba(148, 163, 184, 0.18);
                    color: rgb(241, 245, 249);
                }
            `}</style>
        </UserLayout>
    );
}
