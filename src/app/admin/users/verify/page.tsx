"use client";

import React, { useState, useEffect } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    User as UserIcon,
    Mail,
    Calendar,
    FileText,
    Image as ImageIcon,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    MessageSquare,
    History,
    MoreHorizontal,
    ZoomIn,
    AlertCircle,
    Ban,
    Search,
    ChevronRight,
    Loader2
} from "lucide-react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import axios from "axios";

// --- Types ---
type VerificationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

interface User {
    id: number;
    email: string;
    nom: string | null;
    prenom: string | null;
    sexe: string | null;
    age: number | null;
    skin_type: string | null;
    image: string | null;
    status: VerificationStatus;
    verified: boolean;
    created_at: string;
}

// --- Sub-components ---

const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { color: string; icon: any }> = {
        PENDING: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
        ACCEPTED: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
        REJECTED: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
        low: { color: "bg-emerald-500 text-white", icon: ShieldCheck },
        medium: { color: "bg-amber-500 text-white", icon: ShieldQuestion },
        high: { color: "bg-red-500 text-white", icon: ShieldAlert },
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
        <div className={`px-2 py-1 rounded-full border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </div>
    );
};

export default function UserVerificationPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<"PENDING" | "REJECTED">("PENDING");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/users/verify");
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAction = async (status: "ACCEPTED" | "REJECTED") => {
        if (!selectedUser) return;

        try {
            setActionLoading(true);
            await axios.patch(`/api/admin/users/verify/${selectedUser.id}`, { status });

            toast.success(`User ${status === "ACCEPTED" ? "approved" : "rejected"} successfully!`);

            if (status === "ACCEPTED") {
                // If accepted, they move to All Users table, so remove from this page
                setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                setSelectedUser(null);
            } else {
                // If rejected, they stay in this page as "Stocked Rejected"
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: "REJECTED" } : u));
                setSelectedUser(prev => prev ? { ...prev, status: "REJECTED" } : null);
                // Switch to rejected tab to see the change if needed
                setFilterTab("REJECTED");
            }
        } catch (error) {
            console.error("Action error:", error);
            toast.error(`Failed to ${status.toLowerCase()} user`);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()));

        // Logic: if status is missing or null, treat as PENDING for the verification flow
        const effectiveStatus = user.status || "PENDING";
        const matchesTab = effectiveStatus === filterTab;

        return matchesSearch && matchesTab;
    });

    return (
        <AdminLayout>
            <div className="flex h-[calc(100vh-140px)] gap-6 antialiased">

                {/* Left Sidebar: User List */}
                <div className="w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Verification Center</h2>

                        {/* Tabs */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-900/50 rounded-2xl mb-4 border border-gray-100 dark:border-gray-700">
                            {(["PENDING", "REJECTED"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilterTab(tab)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterTab === tab ? 'bg-white dark:bg-gray-800 text-indigo-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab === "PENDING" ? "Requests" : "Rejected"}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${filterTab.toLowerCase()} users...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">Loading Users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {filterTab.toLowerCase()} users</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border-2 ${selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-500/10 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-white dark:border-gray-800 shadow-sm">
                                            {user.image ? (
                                                <Image src={user.image} width={48} height={48} alt="" className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                                                    <UserIcon className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                        <h4 className={`text-sm font-black truncate ${selectedUser?.id === user.id ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                                            {user.nom} {user.prenom}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-bold truncate uppercase">{user.email}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${selectedUser?.id === user.id ? 'text-indigo-500' : 'text-gray-300'}`} />
                                </button>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <span>Total {filterTab === "PENDING" ? "Pending" : "Rejected"}</span>
                            <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700 text-indigo-500">
                                {filteredUsers.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content: User Details */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key={selectedUser.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col"
                            >
                                {/* Detail Header */}
                                <div className="p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10 flex justify-between items-center">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-[32px] overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl relative group">
                                            {selectedUser.image ? (
                                                <Image src={selectedUser.image} width={80} height={80} alt="" className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                                                    <UserIcon className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                                    {selectedUser.nom} {selectedUser.prenom}
                                                </h1>
                                                <StatusBadge status={selectedUser.status} />
                                            </div>
                                            <p className="text-gray-400 font-bold flex items-center gap-2">
                                                <Mail className="w-4 h-4" /> {selectedUser.email}
                                                <span className="opacity-30">•</span>
                                                <span className="text-[10px] tracking-widest uppercase">ID: {selectedUser.id}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleAction("ACCEPTED")}
                                            disabled={actionLoading}
                                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Approve
                                        </button>
                                        {selectedUser.status === "PENDING" && (
                                            <button
                                                onClick={() => handleAction("REJECTED")}
                                                disabled={actionLoading}
                                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                Reject
                                            </button>
                                        )}
                                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 mx-2" />
                                        <button className="p-2.5 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all">
                                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                                        {/* Basic Info Card */}
                                        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-indigo-500" /> Personal Identity
                                            </h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: "Nom Complet", val: `${selectedUser.nom || ""} ${selectedUser.prenom || ""}`.trim() || selectedUser.email },
                                                    { label: "Genre", val: selectedUser.sexe || "N/A" },
                                                    { label: "Âge", val: selectedUser.age ? `${selectedUser.age} ans` : "N/A" },
                                                    { label: "Joined", val: new Date(selectedUser.created_at).toLocaleDateString() },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                                        <span className="text-xs font-bold text-gray-400 uppercase">{item.label}</span>
                                                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Image Verification Card */}
                                        <div className="bg-gray-50/50 dark:bg-gray-900/30 rounded-[32px] p-6 border border-gray-100 dark:border-gray-700 flex flex-col">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-indigo-500" /> Verification Image
                                            </h3>
                                            <div className="flex-1 relative min-h-[200px] rounded-2xl overflow-hidden bg-gray-200 dark:bg-black group shadow-inner">
                                                {selectedUser.image ? (
                                                    <>
                                                        <Image src={selectedUser.image} layout="fill" objectFit="contain" alt="Identity Preview" className="p-2" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                            <button className="p-3 bg-white rounded-2xl shadow-xl hover:scale-110 transition-transform">
                                                                <ZoomIn className="w-6 h-6 text-gray-900" />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic text-xs">
                                                        No image provided for verification
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/30 dark:bg-transparent">
                                <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-[48px] shadow-2xl flex items-center justify-center mb-8 border border-gray-100 dark:border-gray-700">
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-3xl flex items-center justify-center animate-pulse">
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Select a verification request</h2>
                                <p className="max-w-md text-gray-400 font-bold text-sm uppercase leading-relaxed tracking-wider">
                                    Browse the list of pending users on the left to consult their information and manage their identity verification.
                                </p>
                                <div className="mt-12 flex gap-4">
                                    <div className="px-4 py-2 bg-emerald-500/5 text-emerald-500 rounded-full border border-emerald-500/10 text-[10px] font-black uppercase tracking-widest">Efficiency Focus</div>
                                    <div className="px-4 py-2 bg-indigo-500/5 text-indigo-500 rounded-full border border-indigo-500/10 text-[10px] font-black uppercase tracking-widest">Real-time sync</div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
            `}</style>
        </AdminLayout>
    );
}
