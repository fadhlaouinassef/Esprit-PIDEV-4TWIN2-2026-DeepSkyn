"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { 
    Search,
    Award,
    Trophy,
    Star,
    Shield,
    Gem,
    X,
    ChevronRight,
    History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type BadgeLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "RUBY_MASTER";

type BadgeHistoryItem = {
    id: number;
    title: string;
    description: string | null;
    level: BadgeLevel;
    date: string;
};

type BadgeUser = {
    id: number;
    name: string;
    email: string;
    photo: string | null;
    highestBadge: {
        level: BadgeLevel;
        title: string;
        date: string;
    };
    badgeCount: number;
    history: BadgeHistoryItem[];
};

type BadgeApiResponse = {
    users: BadgeUser[];
    stats: {
        totalUsers: number;
        holdersByLevel: Record<BadgeLevel, number>;
    };
    fetchedAt: string;
};

const BADGE_LEVEL_CONFIG: Record<BadgeLevel, { labelId: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string; dot: string }> = {
    BRONZE: {
        labelId: "badgeLevels.bronze",
        icon: Award,
        color: "text-orange-600",
        bg: "bg-orange-50/60",
        border: "border-orange-200",
        dot: "bg-orange-500",
    },
    SILVER: {
        labelId: "badgeLevels.silver",
        icon: Star,
        color: "text-slate-500",
        bg: "bg-slate-50/70",
        border: "border-slate-200",
        dot: "bg-slate-400",
    },
    GOLD: {
        labelId: "badgeLevels.gold",
        icon: Trophy,
        color: "text-amber-600",
        bg: "bg-amber-50/60",
        border: "border-amber-200",
        dot: "bg-amber-500",
    },
    PLATINUM: {
        labelId: "badgeLevels.platinum",
        icon: Shield,
        color: "text-indigo-500",
        bg: "bg-indigo-50/60",
        border: "border-indigo-200",
        dot: "bg-rose-500",
    },
    RUBY_MASTER: {
        labelId: "badgeLevels.rubyMaster",
        icon: Gem,
        color: "text-rose-500",
        bg: "bg-rose-50/60",
        border: "border-rose-200",
        dot: "bg-rose-500",
    },
};

// --- SUB-COMPONENTS ---

const BadgeCard = ({ level, users, totalUsers }: { level: BadgeLevel; users: number; totalUsers: number }) => {
    const t = useTranslations("adminBadges");
    const config = BADGE_LEVEL_CONFIG[level];
    const Icon = config.icon;
    const rarity = totalUsers > 0 ? `${((users / totalUsers) * 100).toFixed(1)}%` : "0%";

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-6 rounded-4xl bg-white dark:bg-gray-800 border ${config.border} shadow-sm group transition-all hover:shadow-xl hover:shadow-gray-200/20`}
        >
            <div className={`size-14 rounded-2xl ${config.bg} flex items-center justify-center ${config.color} mb-6 shadow-inner`}>
                <Icon size={28} />
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-2">{t(config.labelId)}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t("holders", { count: users })}</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-[#156d95] bg-blue-50 px-2.5 py-1 rounded-full uppercase">{rarity}</span>
                </div>
            </div>
        </motion.div>
    );
};

const UserBadgeHistoryModal = ({ user, onClose }: { user: BadgeUser | null; onClose: () => void }) => {
    const t = useTranslations("adminBadges");
    if (!user) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden p-8"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-16 rounded-full overflow-hidden border-4 border-gray-100 relative shadow-sm">
                                <Image src={user.photo || `https://i.pravatar.cc/150?u=${user.id}`} fill alt={user.name} className="object-cover" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h2>
                                <p className="text-sm text-gray-400 font-medium">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <History size={18} className="text-[#156d95]" />
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{t("historyTitle")}</h3>
                        </div>
                        
                        <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                                                    {user.history.map((h) => {
                                                        const levelConfig = BADGE_LEVEL_CONFIG[h.level];
                                                        const LevelIcon = levelConfig.icon;
                                                        return (
                                <div key={h.id} className="relative group">
                                    <div className="absolute -left-[27.5px] top-1.5 size-2.5 rounded-full bg-white dark:bg-gray-900 border-2 border-[#156d95] group-hover:scale-125 transition-transform" />
                                    <div className="flex items-center gap-4">
                                                                <div className={`size-10 rounded-xl ${levelConfig.bg} flex items-center justify-center shadow-inner`}>
                                                                    <LevelIcon size={18} className={levelConfig.color} />
                                        </div>
                                        <div>
                                                                    <p className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{h.title}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                                        {new Date(h.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                                                    </p>
                                        </div>
                                    </div>
                                </div>
                                                    )})}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

export default function AdminBadgesPage() {
    const t = useTranslations("adminBadges");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<BadgeUser | null>(null);
    const [users, setUsers] = useState<BadgeUser[]>([]);
    const [holdersByLevel, setHoldersByLevel] = useState<Record<BadgeLevel, number>>({
        BRONZE: 0,
        SILVER: 0,
        GOLD: 0,
        PLATINUM: 0,
        RUBY_MASTER: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const response = await fetch("/api/admin/badges", { cache: "no-store" });
                if (!response.ok) {
                    throw new Error("Failed to load badges data");
                }

                const payload = (await response.json()) as BadgeApiResponse;
                setUsers(payload.users || []);
                setHoldersByLevel(payload.stats?.holdersByLevel || {
                    BRONZE: 0,
                    SILVER: 0,
                    GOLD: 0,
                    PLATINUM: 0,
                    RUBY_MASTER: 0,
                });
            } catch (error) {
                console.error("[AdminBadgesPage] Failed to fetch data", error);
                toast.error(t("toasts.loadError"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchBadges();
    }, []);

    const filteredUsers = useMemo(() => users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

    const orderedLevels: BadgeLevel[] = ["RUBY_MASTER", "PLATINUM", "GOLD", "SILVER", "BRONZE"];
    const totalUsersWithBadges = users.length;

    const getTierPill = (level: BadgeLevel) => {
        const config = BADGE_LEVEL_CONFIG[level];
        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${config.border} ${config.color} bg-white dark:bg-gray-900 text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                <div className={`size-2 rounded-full ${config.dot} opacity-70 animate-pulse`} />
                {t(config.labelId)}
            </div>
        );
    };

    const renderTableBody = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={4} className="px-12 py-16 text-center text-sm text-gray-500 font-semibold">
                        {t("states.loading")}
                    </td>
                </tr>
            );
        }

        if (filteredUsers.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="px-12 py-20">
                        <div className="text-center">
                            <div className="size-24 rounded-[40px] bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Award size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t("states.noUsers")}</h3>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t("states.noUsersHint")}</p>
                        </div>
                    </td>
                </tr>
            );
        }

        return filteredUsers.map((user, i) => (
            <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all cursor-pointer"
                onClick={() => setSelectedUser(user)}
            >
                <td className="px-12 py-8">
                    <div className="flex items-center gap-5">
                        <div className="size-14 rounded-2xl overflow-hidden relative border-2 border-white ring-1 ring-gray-100 shadow-sm shrink-0">
                            <Image src={user.photo || `https://i.pravatar.cc/150?u=${user.id}`} fill alt={user.name} className="object-cover" />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400 font-bold tracking-widest mt-1 opacity-60 uppercase">#{user.id}</p>
                        </div>
                    </div>
                </td>
                <td className="px-12 py-8">
                    {getTierPill(user.highestBadge.level)}
                </td>
                <td className="px-12 py-8 min-w-70">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{user.badgeCount}</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t("table.totalBadges")}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-medium truncate">{t("table.bestBadge")}: {user.highestBadge.title}</p>
                </td>
                <td className="px-12 py-8 text-right">
                    <div className="size-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 ml-auto group-hover:bg-[#156d95] group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-blue-600/10">
                        <ChevronRight size={18} />
                    </div>
                </td>
            </motion.tr>
        ));
    };

    return (
        <AdminLayout>
            <div className="mx-auto w-full max-w-350">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <span className="text-[10px] font-black text-[#156d95] uppercase tracking-[5px] mb-3 block">{t("hero.kicker")}</span>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">{t("hero.title")}</h1>
                        <p className="text-gray-400 font-medium mt-3 max-w-xl">
                            {t("hero.subtitle")}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
                    {orderedLevels.map((level) => (
                        <BadgeCard
                            key={level}
                            level={level}
                            users={holdersByLevel[level] || 0}
                            totalUsers={totalUsersWithBadges}
                        />
                    ))}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[48px] border border-gray-50 dark:border-gray-700/50 shadow-sm overflow-hidden scroll-smooth">
                    <div className="p-10 border-b border-gray-50 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">{t("table.title")}</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t("table.subtitle")}</p>
                        </div>
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                            <input
                                type="text"
                                placeholder={t("table.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-3xl border-none text-xs focus:ring-2 focus:ring-[#156d95]/50 transition-all font-bold placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-50 dark:border-gray-700/50">
                                    <th className="px-12 py-8">{t("table.user")}</th>
                                    <th className="px-12 py-8">{t("table.bestBadge")}</th>
                                    <th className="px-12 py-8">{t("table.totalBadges")}</th>
                                    <th className="px-12 py-8 text-right">{t("table.details")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {renderTableBody()}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-10 bg-gray-50/30 dark:bg-gray-900/10 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px]">{t("table.displayedUsers", { count: filteredUsers.length })}</p>
                        <span className="text-sm font-black px-6 text-gray-900 dark:text-white">{t("table.pageOne")}</span>
                    </div>
                </div>
            </div>

            <UserBadgeHistoryModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />
        </AdminLayout>
    );
}
