"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Search,
    Send,
    Clock,
    Paperclip,
    ChevronDown,
    User,
    Calendar,
    ArrowLeft,
    MoreHorizontal,
    Trash2,
    Bell,
    X,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { useTranslations } from "next-intl";

type ComplaintCategory = 'Analysis' | 'Routine' | 'Product' | 'Badge' | 'Bug' | 'Payment' | 'Service' | 'Other';

interface DBMessage {
    id: number | string;
    sender_role: 'USER' | 'ADMIN';
    text: string;
    is_read: boolean;
    created_at: string;
}

interface DBComplaint {
    id: number;
    user_id: number;
    user: {
        id: number;
        nom?: string | null;
        prenom?: string | null;
        email?: string | null;
    };
    category: string;
    content: string;
    status: 'PENDING' | 'ACCEPT' | 'REJECT';
    created_at: string;
    messages: DBMessage[];
    evidence: { url: string }[];
}

interface AdminFeedback {
    id: number;
    nom: string;
    message: string;
    note: number;
    etat: 'visible' | 'invisible';
}

export default function AdminComplaintsPage() {
    const t = useTranslations();
    const [complaints, setComplaints] = useState<DBComplaint[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ACCEPT' | 'REJECT'>('ALL');
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"complaints" | "feedback">("complaints");
    const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
    const [feedbackSearch, setFeedbackSearch] = useState("");
    const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

    const selectedComplaint = complaints.find(c => c.id === selectedId);
    const selectedFeedback = feedbacks.find(f => f.id === selectedFeedbackId) || null;
    const chatEndRef = useRef<HTMLDivElement>(null);

    async function fetchComplaints(silent = false) {
        try {
            const res = await axios.get('/api/admin/complaints');
            setComplaints(res.data);
            if (!silent) setIsLoading(false);
        } catch (error) {
            if (!silent) toast.error(t("adminComplaints.toasts.fetchFailed"));
            setIsLoading(false);
        }
    }

    async function fetchFeedbacks(silent = false) {
        try {
            if (!silent) setIsFeedbackLoading(true);
            const res = await axios.get('/api/admin/feedback');
            const data = Array.isArray(res.data?.feedbacks) ? res.data.feedbacks : [];
            setFeedbacks(data);
        } catch (error) {
            if (!silent) toast.error("Failed to fetch feedbacks");
        } finally {
            if (!silent) setIsFeedbackLoading(false);
        }
    }

    useEffect(() => {
        fetchComplaints();
        const interval = setInterval(() => {
            fetchComplaints(true);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTab !== "feedback") return;
        fetchFeedbacks();
        const interval = setInterval(() => {
            fetchFeedbacks(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeTab]);

    // Scroll instantly to bottom on selection
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [selectedId]);

    // Scroll smoothly on new messages or updates
    useEffect(() => {
        if (chatEndRef.current && selectedId) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedComplaint?.messages?.length]);

    // Mark as read when selected
    useEffect(() => {
        if (selectedComplaint && selectedId) {
            const hasUnread = selectedComplaint.messages.some(m => m.sender_role === 'USER' && !m.is_read);
            if (hasUnread) {
                // Optimistic update
                setComplaints(prev => prev.map(c => {
                    if (c.id === selectedId) {
                        return {
                            ...c,
                            messages: c.messages.map(m =>
                                m.sender_role === 'USER' ? { ...m, is_read: true } : m
                            )
                        };
                    }
                    return c;
                }));

                axios.put(`/api/admin/complaints/${selectedId}/read`).catch(() => {});
            }
        }
    }, [selectedComplaint?.id, selectedComplaint?.messages?.length]);

    const filteredComplaints = complaints.filter(c => {
        const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
        const userName = `${c.user?.nom || ''} ${c.user?.prenom || ''}`.trim() || c.user?.email || 'Unknown User';
        const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const filteredFeedbacks = feedbacks.filter((f) => {
        const query = feedbackSearch.toLowerCase();
        return (
            f.nom.toLowerCase().includes(query) ||
            f.message.toLowerCase().includes(query) ||
            String(f.note).includes(query)
        );
    });

    const handleUpdateStatus = async (id: number, newStatus: 'PENDING' | 'ACCEPT' | 'REJECT') => {
        try {
            const res = await axios.put(`/api/admin/complaints/${id}/status`, { status: newStatus });
            setComplaints(prev => prev.map(c =>
                c.id === id ? { ...c, status: res.data.status } : c
            ));
            toast.success(t("adminComplaints.toasts.statusUpdated", { status: newStatus }));
        } catch (error) {
            toast.error(t("adminComplaints.toasts.updateStatusFailed"));
        }
    };

    const handleDeleteTicket = async (id: number) => {
        if (!confirm(t("adminComplaints.confirmDelete"))) return;
        try {
            await axios.delete(`/api/admin/complaints/${id}`);
            setComplaints(prev => prev.filter(c => c.id !== id));
            if (selectedId === id) setSelectedId(null);
            toast.success(t("adminComplaints.toasts.ticketDeleted"));
        } catch (error) {
            toast.error(t("adminComplaints.toasts.deleteFailed"));
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedId || !selectedComplaint) return;

        try {
            const res = await axios.post(`/api/admin/complaints/${selectedId}/messages`, { text: replyText });
            const isClosed = replyText.includes("🚨 TICKET CLOSED");

            const newMessage = res.data;

            setComplaints(prev => prev.map(c =>
                c.id === selectedId
                    ? { 
                        ...c, 
                        messages: [...c.messages, newMessage],
                        status: isClosed && c.status !== 'REJECT' ? 'REJECT' : c.status
                      }
                    : c
            ));
            setReplyText("");
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
                    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
                    : t("adminComplaints.toasts.sendMessageFailed");
            toast.error(message);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING': return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            case 'ACCEPT': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case 'REJECT': return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
            default: return "";
        }
    };

    const categories: Record<string, string> = {
        'ANALYSIS': '🔍',
        'ROUTINE': '✨',
        'PRODUCT': '🧴',
        'BADGE': '🏆',
        'BUG': '🐛',
        'PAYMENT': '💳',
        'SERVICE': '⚙️',
        'OTHER': '📝'
    };

    const statusLabel = (status: 'ALL' | 'PENDING' | 'ACCEPT' | 'REJECT') => {
        switch (status) {
            case 'ALL': return t("adminComplaints.status.all");
            case 'PENDING': return t("adminComplaints.status.pending");
            case 'ACCEPT': return t("adminComplaints.status.accept");
            case 'REJECT': return t("adminComplaints.status.reject");
        }
    };

    return (
        <AdminLayout>
            <div className="mb-4 inline-flex rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1 shadow-sm">
                <button
                    type="button"
                    onClick={() => setActiveTab("complaints")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === "complaints"
                            ? "bg-primary text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                >
                    Complaints
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("feedback")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === "feedback"
                            ? "bg-primary text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                >
                    Feedback
                </button>
            </div>

            <div className={cn(
                "flex h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden",
                activeTab === "feedback" && "hidden"
            )}>
                {/* List Sidebar */}
                <div className={cn(
                    "w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-700 flex flex-col",
                    selectedId && "hidden md:flex"
                )}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 space-y-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MessageSquare className="size-6 text-primary" />
                            {t("adminComplaints.title")}
                        </h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t("adminComplaints.searchPlaceholder")}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:border-primary transition-colors text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {(['ALL', 'PENDING', 'ACCEPT', 'REJECT'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize transition-all",
                                        filterStatus === s
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200"
                                    )}
                                >
                                    {statusLabel(s)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div 
                        className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide"
                        data-lenis-prevent
                    >
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <span className="loading loading-spinner text-primary text-3xl"></span>
                            </div>
                        ) : filteredComplaints.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <MessageSquare className="size-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">{t("adminComplaints.empty")}</p>
                            </div>
                        ) : (
                            filteredComplaints.map((c) => {
                                const userName = `${c.user?.nom || ''} ${c.user?.prenom || ''}`.trim() || c.user?.email || t('adminComplaints.unknownUser');
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedId(c.id)}
                                        className={cn(
                                            "p-6 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 relative group rounded-3xl mx-2 mb-2",
                                            selectedId === c.id ? "bg-white dark:bg-gray-800 shadow-lg border-primary/20" : "bg-transparent"
                                        )}
                                    >
                                        {/* Top Row: Category and Status */}
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gray-100 dark:bg-gray-900 text-[10px] font-bold text-gray-500">
                                                <span className="text-sm">{categories[c.category?.toUpperCase()] || '📝'}</span>
                                                <span className="uppercase tracking-widest">{c.category}</span>
                                            </div>
                                            <div className={cn("px-3 py-1.5 rounded-3xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border", 
                                                c.status === 'PENDING' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                c.status === 'ACCEPT' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                "bg-rose-50 text-rose-600 border-rose-100"
                                            )}>
                                                <Clock className="size-3" />
                                                {statusLabel(c.status)}
                                            </div>
                                        </div>

                                        {/* Middle Row: Title/Content (Last Message Preview) */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn("size-2 rounded-full shrink-0", 
                                                c.messages[c.messages.length-1]?.sender_role === 'USER' ? "bg-primary" : "bg-gray-300"
                                            )} />
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-sm">
                                                {c.messages[c.messages.length - 1]?.text || c.content}
                                            </h3>
                                        </div>

                                        {/* Bottom Row: Date and Stats */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold group-hover:text-primary transition-colors">
                                                    {c.messages.filter(m => m.sender_role === 'USER' && !m.is_read).length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[9px] font-black flex items-center gap-1 shadow-md animate-pulse whitespace-nowrap">
                                                            <Bell className="size-2.5 fill-current" />
                                                            {c.messages.filter(m => m.sender_role === 'USER' && !m.is_read).length} NEW MESSAGE
                                                        </span>
                                                    )}
                                                    <ChevronDown className="size-3 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30 dark:bg-gray-900/10 relative overflow-hidden">
                    {selectedComplaint ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 z-10 shadow-sm shrink-0">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedId(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                                        <ArrowLeft className="size-5" />
                                    </button>
                                    <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-2xl">
                                        {categories[selectedComplaint.category?.toUpperCase()] || '📝'}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">
                                            {`${selectedComplaint.user?.nom || ''} ${selectedComplaint.user?.prenom || ''}`.trim() || selectedComplaint.user?.email || t('adminComplaints.unknownUser')}
                                        </h2>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-medium">
                                            <span className="flex items-center gap-1"><User className="size-3" /> {t("adminComplaints.userId")} #{selectedComplaint.user_id}</span>
                                            <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(selectedComplaint.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="hidden lg:flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                        {(['PENDING', 'ACCEPT', 'REJECT'] as ('PENDING' | 'ACCEPT' | 'REJECT')[]).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleUpdateStatus(selectedComplaint.id, s)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                                    selectedComplaint.status === s
                                                        ? getStatusStyles(s)
                                                        : "text-gray-400 hover:text-gray-600"
                                                )}
                                            >
                                                {statusLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => handleDeleteTicket(selectedComplaint.id)} className="p-2 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 rounded-lg text-gray-400 transition-colors" title={t("adminComplaints.actions.deleteTicket")}>
                                        <Trash2 className="size-5" />
                                    </button>
                                    <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title={t("adminComplaints.actions.closeDiscussion")}>
                                        <X className="size-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div 
                                className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col-reverse custom-scrollbar scrollbar-hide"
                                data-lenis-prevent
                            >
                                <div ref={chatEndRef} />
                                {[...selectedComplaint.messages].reverse().map((msg, index, arr) => (
                                    <div key={msg.id} className={cn(
                                        "flex flex-col max-w-[80%]",
                                        msg.sender_role === 'ADMIN' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}>
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {msg.sender_role === 'ADMIN' ? t('adminComplaints.chat.teamSupport') : t('adminComplaints.chat.user')}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "p-3 px-5 rounded-2xl text-[13px] shadow-sm",
                                            msg.sender_role === 'ADMIN'
                                                ? "bg-primary text-white rounded-tr-none shadow-primary/10"
                                                : "bg-white dark:bg-gray-800 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700"
                                        )}>
                                            {msg.text}
                                        </div>
                                        {msg.sender_role === 'USER' && selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && index === arr.length - 1 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {selectedComplaint.evidence.map((ev, i) => (
                                                    <div key={i} className="size-32 rounded-xl overflow-hidden border-2 border-primary/10 hover:border-primary transition-all cursor-zoom-in shadow-md">
                                                        <img src={ev.url} alt="Evidence" className="size-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Interaction */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                                <form onSubmit={handleSendReply} className="flex gap-4 w-full">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder={t("adminComplaints.chat.writeResponse")}
                                            className="w-full px-6 py-4 pr-16 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        />
                                        <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                            <Paperclip className="size-5" />
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!replyText.trim()}
                                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-8 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                    >
                                        <Send className="size-5" />
                                        {t("adminComplaints.actions.respond")}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                            <div className="size-24 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                                <MessageSquare className="size-12 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">{t("adminComplaints.noSelection.title")}</h2>
                            <p className="text-sm max-w-xs">{t("adminComplaints.noSelection.description")}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={cn(
                "flex h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden",
                activeTab === "complaints" && "hidden"
            )}>
                <div className={cn(
                    "w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-700 flex flex-col",
                    selectedFeedbackId && "hidden md:flex"
                )}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 space-y-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Star className="size-6 text-primary" />
                            Feedback
                        </h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search feedbacks..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:border-primary transition-colors text-sm"
                                value={feedbackSearch}
                                onChange={(e) => setFeedbackSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide" data-lenis-prevent>
                        {isFeedbackLoading ? (
                            <div className="p-12 text-center">
                                <span className="loading loading-spinner text-primary text-3xl"></span>
                            </div>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Star className="size-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No feedback found</p>
                            </div>
                        ) : (
                            filteredFeedbacks.map((f) => (
                                <div
                                    key={f.id}
                                    onClick={() => setSelectedFeedbackId(f.id)}
                                    className={cn(
                                        "p-5 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-3xl mx-2 mb-2",
                                        selectedFeedbackId === f.id ? "bg-white dark:bg-gray-800 shadow-lg border-primary/20" : "bg-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{f.nom}</p>
                                        <span className="text-xs font-bold text-amber-500">{f.note}/5</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{f.message || "(No written message)"}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30 dark:bg-gray-900/10 relative overflow-hidden">
                    {selectedFeedback ? (
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar scrollbar-hide" data-lenis-prevent>
                            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback detail</h2>
                                    <button onClick={() => setSelectedFeedbackId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Close">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Name</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedFeedback.nom}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Rating</p>
                                        <p className="font-semibold text-amber-500">{selectedFeedback.note}/5</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Visibility</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedFeedback.etat}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Message</p>
                                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{selectedFeedback.message || "(No written message)"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                            <div className="size-24 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                                <Star className="size-12 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">No feedback selected</h2>
                            <p className="text-sm max-w-xs">Select feedback from the sidebar to view details.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
