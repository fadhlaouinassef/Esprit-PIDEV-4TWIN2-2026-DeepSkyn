"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { 
    Search,
    Filter,
    Award,
    Trophy,
    Star,
    CheckCircle2,
    Lock,
    X,
    ChevronRight,
    Download,
    RefreshCw,
    TrendingUp,
    Users as UsersIcon,
    Shield,
    Clock,
    ArrowRight,
    Plus,
    History,
    MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

// --- STATIC DATA ---
const BADGE_TYPES = [
    { id: "platinum", name: "Platinum Master", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-50/50", border: "border-indigo-200", rarity: "0.2%", users: 12 },
    { id: "gold", name: "Golden Skin", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-200", rarity: "5.4%", users: 245 },
    { id: "silver", name: "Silver Routine", icon: Star, color: "text-slate-400", bg: "bg-slate-50/50", border: "border-slate-200", rarity: "18.1%", users: 890 },
    { id: "bronze", name: "Bronze Beginner", icon: Award, color: "text-orange-500", bg: "bg-orange-50/50", border: "border-orange-200", rarity: "76.3%", users: 3420 },
];

const STATIC_USERS = [
    {
        id: "USR-001",
        name: "Inassef Fadhlaoui",
        email: "fadhlaouinassef@gmail.com",
        photo: "https://i.pravatar.cc/150?u=inassef",
        level: "Platinum",
        levelId: "platinum",
        progress: 98,
        history: [
            { id: "h1", badge: "Platinum Master", date: "Oct 12, 2023", icon: "💎" },
            { id: "h2", badge: "Golden Skin", date: "Sep 20, 2023", icon: "👑" },
            { id: "h3", badge: "Silver Routine", date: "Aug 15, 2023", icon: "🥈" },
        ]
    },
    {
        id: "USR-002",
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        photo: "https://i.pravatar.cc/150?u=sarah",
        level: "Gold",
        levelId: "gold",
        progress: 75,
        history: [
            { id: "h4", badge: "Golden Skin", date: "Oct 16, 2023", icon: "👑" },
            { id: "h5", badge: "Silver Routine", date: "Sep 01, 2023", icon: "🥈" },
        ]
    },
    {
        id: "USR-003",
        name: "Marcus Miller",
        email: "marcus.m@tech.io",
        photo: "https://i.pravatar.cc/150?u=marcus",
        level: "Silver",
        levelId: "silver",
        progress: 45,
        history: [
            { id: "h6", badge: "Silver Routine", date: "Oct 05, 2023", icon: "🥈" },
        ]
    },
    {
        id: "USR-004",
        name: "Elena Petrova",
        email: "elena.p@design.ru",
        photo: "https://i.pravatar.cc/150?u=elena",
        level: "Bronze",
        levelId: "bronze",
        progress: 20,
        history: [
            { id: "h7", badge: "Bronze Beginner", date: "Sep 28, 2023", icon: "🥉" },
        ]
    }
];

// --- SUB-COMPONENTS ---

const BadgeCard = ({ badge }: { badge: any }) => {
    const Icon = badge.icon;
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className={`p-6 rounded-[32px] bg-white dark:bg-gray-800 border ${badge.border} shadow-sm group transition-all hover:shadow-xl hover:shadow-gray-200/20`}
        >
            <div className={`size-14 rounded-2xl ${badge.bg} flex items-center justify-center ${badge.color} mb-6 shadow-inner`}>
                <Icon size={28} />
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none mb-2">{badge.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{badge.users} active holders</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-[#156d95] bg-blue-50 px-2.5 py-1 rounded-full uppercase">{badge.rarity}</span>
                </div>
            </div>
        </motion.div>
    );
};

const UserBadgeHistoryModal = ({ user, onClose }: { user: any, onClose: () => void }) => {
    if (!user) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                                <Image src={user.photo} fill alt={user.name} className="object-cover" />
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
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Badge Achievement History</h3>
                        </div>
                        
                        <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                            {user.history.map((h: any) => (
                                <div key={h.id} className="relative group">
                                    <div className="absolute -left-[27.5px] top-1.5 size-2.5 rounded-full bg-white dark:bg-gray-900 border-2 border-[#156d95] group-hover:scale-125 transition-transform" />
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl shadow-inner">
                                            {h.icon}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{h.badge}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Unlocked on {h.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- MAIN PAGE ---

export default function AdminBadgesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const filteredUsers = STATIC_USERS.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="mx-auto w-full max-w-[1400px]">
                {/* Header Container */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div>
                        <span className="text-[10px] font-black text-[#156d95] uppercase tracking-[5px] mb-3 block">Gamification System</span>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">Badges & Achievements</h1>
                        <p className="text-gray-400 font-medium mt-3 max-w-xl">
                            Monitor user progression milestones, manage digital rewards, and analyze achievement distribution across the platform.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <button className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[20px] text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-xl transition-all">
                            <Download size={16} className="text-gray-400" />
                            Export Data
                        </button>
                    </div>
                </div>

                {/* Badge Levels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {BADGE_TYPES.map(badge => (
                        <BadgeCard key={badge.id} badge={badge} />
                    ))}
                </div>

                {/* User Table Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[48px] border border-gray-50 dark:border-gray-700/50 shadow-sm overflow-hidden scroll-smooth">
                    <div className="p-10 border-b border-gray-50 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">Member Progression</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Real-time achievement monitoring</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
                                <input 
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-[24px] border-none text-xs focus:ring-2 focus:ring-[#156d95]/50 transition-all font-bold placeholder:text-gray-400"
                                />
                            </div>
                            <button className="size-14 rounded-[24px] bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 border border-transparent hover:border-gray-200 transition-all">
                                <Filter size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[4px] border-b border-gray-50 dark:border-gray-700/50">
                                    <th className="px-12 py-8">User Profile</th>
                                    <th className="px-12 py-8">Current Tier</th>
                                    <th className="px-12 py-8">Progress Score</th>
                                    <th className="px-12 py-8 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {filteredUsers.map((user, i) => (
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
                                                    <Image src={user.photo} fill alt={user.name} className="object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-tight">{user.name}</p>
                                                    <p className="text-xs text-gray-400 font-bold tracking-widest mt-1 opacity-60 uppercase">{user.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8">
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${BADGE_TYPES.find(b => b.id === user.levelId)?.border} ${BADGE_TYPES.find(b => b.id === user.levelId)?.color} bg-white dark:bg-gray-900 text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                                <div className="size-2 rounded-full bg-current opacity-40 animate-pulse" />
                                                {user.level}
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 min-w-[280px]">
                                            <div className="flex items-center gap-6">
                                                <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${user.progress}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-[#156d95] to-blue-400 rounded-full shadow-[0_0_10px_rgba(21,109,149,0.3)]"
                                                    />
                                                </div>
                                                <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{user.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <div className="size-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 ml-auto group-hover:bg-[#156d95] group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-blue-600/10">
                                                <ChevronRight size={18} />
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {filteredUsers.length === 0 && (
                            <div className="p-32 text-center">
                                <div className="size-24 rounded-[40px] bg-gray-50 dark:bg-gray-900 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Award size={40} className="text-gray-200" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Zero Search Hits</h3>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Verify your search criteria or reset filters</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-10 bg-gray-50/30 dark:bg-gray-900/10 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[3px]">Index Metrics · {filteredUsers.length} Registry Units</p>
                        <div className="flex items-center gap-4">
                            <button className="size-12 flex items-center justify-center rounded-2xl border border-gray-100 text-gray-400 opacity-50 cursor-not-allowed transition-all">
                                <ChevronRight className="rotate-180" size={20} />
                            </button>
                            <span className="text-sm font-black px-6 text-gray-900 dark:text-white">Page 1 of 1</span>
                            <button className="size-12 flex items-center justify-center rounded-2xl border border-[#156d95] bg-blue-50 text-[#156d95] shadow-sm hover:bg-blue-100 transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backdrop & History Overlay */}
            <UserBadgeHistoryModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
            />
        </AdminLayout>
    );
}
