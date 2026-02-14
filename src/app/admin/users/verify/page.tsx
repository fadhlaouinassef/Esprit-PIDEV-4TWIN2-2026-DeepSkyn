"use client";

import React, { useState } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    User,
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
    ExternalLink,
    MoreHorizontal,
    ZoomIn,
    Download,
    AlertCircle,
    Ban
} from "lucide-react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";

// --- Types ---
type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";
type RiskLevel = "low" | "medium" | "high";

interface AuditLog {
    id: string;
    admin: string;
    action: string;
    date: string;
    notes?: string;
}

// --- Mock User Data ---
const MOCK_USER = {
    id: "USR-94281",
    name: "Alexander Vance",
    email: "alex.vance@example.com",
    avatar: "/avatar.png",
    joined: "Feb 12, 2026",
    status: "pending" as VerificationStatus,
    riskLevel: "medium" as RiskLevel,
    documents: [
        { id: "d1", title: "Government ID", type: "Passport", status: "approved", date: "Feb 14, 2026", preview: "https://images.unsplash.com/photo-1554126807-6b10f6f6692a?q=80&w=400&auto=format&fit=crop" },
        { id: "d2", title: "Residential Proof", type: "Utility Bill", status: "pending", date: "Feb 14, 2026", preview: "https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=400&auto=format&fit=crop" },
        { id: "d3", title: "Selfie Image", type: "Biometric", status: "pending", date: "Feb 14, 2026", preview: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop" },
    ],
    automatedChecks: {
        email: "Verified",
        phone: "Verified",
        fraudScore: 24, // out of 100
        duplicateDetected: false,
    },
    history: [
        { id: "h1", admin: "System", action: "Account Created", date: "Feb 12, 2026 10:30 AM" },
        { id: "h2", admin: "Alexander Vance", action: "Documents Uploaded", date: "Feb 14, 2026 09:15 AM" },
        { id: "h3", admin: "Nassef (Admin)", action: "Started Review", date: "Feb 14, 2026 02:20 PM" },
    ] as AuditLog[]
};

// --- Sub-components ---

const Badge = ({ status }: { status: VerificationStatus | RiskLevel }) => {
    const configs: Record<string, { color: string; icon: any }> = {
        pending: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
        verified: { color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
        rejected: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
        suspended: { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: Ban },
        low: { color: "bg-emerald-500 text-white", icon: ShieldCheck },
        medium: { color: "bg-amber-500 text-white", icon: ShieldQuestion },
        high: { color: "bg-red-500 text-white", icon: ShieldAlert },
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
        <div className={`px-3 py-1 rounded-full border flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </div>
    );
};

export default function UserVerificationPage() {
    const [user, setUser] = useState(MOCK_USER);
    const [activeDoc, setActiveDoc] = useState(user.documents[0]);
    const [adminNote, setAdminNote] = useState("");

    const handleApprove = () => {
        toast.success("Account verified successfully!", {
            description: "User will receive a notification immediately.",
        });
        setUser(prev => ({ ...prev, status: "verified" }));
    };

    const handleReject = () => {
        toast.error("Account verification rejected", {
            description: "Please specify the reason in the notes.",
        });
        setUser(prev => ({ ...prev, status: "rejected" }));
    };

    return (
        <AdminLayout>
            <div className="space-y-6 pb-12">

                {/* Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-gray-50 dark:border-gray-700 shadow-lg">
                                <Image src={user.avatar} width={80} height={80} alt={user.name} className="object-cover w-full h-full" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 p-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                                <ShieldCheck className={`w-5 h-5 ${user.status === 'verified' ? 'text-emerald-500' : 'text-gray-300'}`} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{user.name}</h1>
                                <Badge status={user.status} />
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 font-bold flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {user.email} <span className="opacity-30">•</span> ID: {user.id}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4 hidden lg:block">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Risk Profile</span>
                            <Badge status={user.riskLevel} />
                        </div>
                        <button className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all">
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column: Documentation & Status */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Document Gallery */}
                        <div className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/10">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-indigo-500" />
                                    Verification Documents
                                </h2>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:shadow-md transition-all">
                                        <Download className="w-4 h-4" /> Export All
                                    </button>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    {user.documents.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setActiveDoc(doc)}
                                            className={`relative group rounded-3xl overflow-hidden border-2 transition-all p-1 ${activeDoc.id === doc.id ? "border-indigo-500 shadow-xl" : "border-transparent opacity-70 hover:opacity-100"}`}
                                        >
                                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                                                <Image src={doc.preview} layout="fill" objectFit="cover" alt={doc.title} />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <ZoomIn className="text-white w-8 h-8" />
                                                </div>
                                                <div className={`absolute top-3 right-3 p-1.5 rounded-lg shadow-lg ${doc.status === 'approved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                                    {doc.status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                </div>
                                            </div>
                                            <div className="mt-3 text-left px-2 mb-2">
                                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">{doc.title}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{doc.type}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Active Document Enlarged View */}
                                <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                                        <div>
                                            <h3 className="font-black text-gray-900 dark:text-white">{activeDoc.title}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Uploaded {activeDoc.date}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:text-indigo-500 transition-colors"><ZoomIn className="w-5 h-5" /></button>
                                            <button className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:text-indigo-500 transition-colors"><ExternalLink className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                    <div className="relative h-[500px] w-full bg-gray-200 dark:bg-gray-900">
                                        <Image src={activeDoc.preview} layout="fill" objectFit="contain" alt="Selected Preview" className="p-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Automated Checks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                                    Automated Checks
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Email Address", val: user.automatedChecks.email, status: "ok" },
                                        { label: "Phone Verification", val: user.automatedChecks.phone, status: "ok" },
                                        { label: "Address Match", val: "Partial Match", status: "warn" },
                                        { label: "Sanction List", val: "Clear", status: "ok" },
                                    ].map((check, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{check.label}</span>
                                            <div className="flex items-center gap-2">
                                                {check.status === 'ok' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                                                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">{check.val}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                                    Quality Score
                                </h3>
                                <div className="flex items-end gap-6 mb-6">
                                    <div className="text-5xl font-black text-gray-900 dark:text-white">{user.automatedChecks.fraudScore}<span className="text-sm text-gray-300">/100</span></div>
                                    <div className="pb-1">
                                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block">Low Fraud Risk</span>
                                        <p className="text-xs text-gray-400 font-medium">Higher score = Higher risk</p>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${user.automatedChecks.fraudScore}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                                    />
                                </div>
                                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                    <p className="text-[10px] font-bold text-emerald-600 leading-relaxed italic">No duplicate accounts or suspicious pattern behavior detected for this identity.</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Actions & History */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Action Panel */}
                        <div className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/10">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <ShieldCheck className="w-6 h-6 text-indigo-500" />
                                    Review Actions
                                </h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={user.status === 'verified'}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Approve Identity
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={user.status === 'rejected'}
                                        className="w-full py-4 bg-red-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                                    >
                                        <XCircle className="w-5 h-5" /> Reject Application
                                    </button>
                                </div>

                                <div className="pt-4 space-y-3 border-t border-gray-100 dark:border-gray-700">
                                    <button className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-600 transition-all">
                                        Request Additional Info
                                    </button>
                                    <button className="w-full py-3 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/5 rounded-2xl transition-all">
                                        Flag for Forensic Review
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <MessageSquare className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Admin Notes</h3>
                            </div>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Add private internal notes about this verification case..."
                                className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                            />
                            <button className="mt-4 w-full py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all">
                                Save Note
                            </button>
                        </div>

                        {/* Audit History */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <History className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Audit Trail</h3>
                            </div>
                            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3 before:border-l-2 before:border-dashed before:border-gray-100 dark:before:border-gray-700">
                                {user.history.map((log) => (
                                    <div key={log.id} className="relative pl-10">
                                        <div className="absolute left-0 top-0 w-6 h-6 bg-white dark:bg-gray-800 border-2 border-indigo-500 rounded-full z-10" />
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{log.action}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{log.admin} • {log.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Compliance Note */}
                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] flex gap-4">
                            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl h-fit"><ShieldCheck className="w-5 h-5" /></div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-gray-900 dark:text-white tracking-widest mb-1">KYC Compliance</h4>
                                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">This data is retained for audit purposes under our Data Retention Policy (GDPR Section 14).</p>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </AdminLayout>
    );
}
