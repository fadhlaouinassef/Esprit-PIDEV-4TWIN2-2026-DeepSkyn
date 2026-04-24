"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Plus,
    Send,
    Paperclip,
    X,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Search,
    Sparkles,
    ShieldCheck,
    Image as ImageIcon,
    FileText,
    AlertTriangle,
    Trash2,
    Bell,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplaintCategory, ChatMessage } from "@/lib/complaintsData";
import { toast } from "sonner";
import axios from "axios";
import { AudioToggleButton } from "@/app/components/user/AudioToggleButton";
import { useTranslations } from "next-intl";

// Status in DB: PENDING, ACCEPT, REJECT
// Category in DB: ANALYSIS, ROUTINE, PRODUCT, BADGE, BUG, PAYMENT, SERVICE, OTHER

interface DBMessage {
    id: number | string;
    sender_role: 'USER' | 'ADMIN';
    text: string;
    is_read: boolean;
    created_at: string;
}

interface DBComplaint {
    id: number | string;
    category: string;
    content: string;
    status: 'PENDING' | 'ACCEPT' | 'REJECT';
    created_at: string;
    messages: DBMessage[];
    evidence: { url: string }[];
}

interface PublicFeedback {
    id: number;
    nom: string;
    message: string;
    note: number;
}

export default function UserComplaintsPage() {
    const t = useTranslations();
    const [complaints, setComplaints] = useState<DBComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<DBComplaint | null>(null);
    const [newComplaint, setNewComplaint] = useState({
        category: 'Other' as ComplaintCategory,
        content: '',
        evidence: [] as string[]
    });
    const [replyText, setReplyText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);
    const [activeTab, setActiveTab] = useState<"complaints" | "feedback">("complaints");
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [publishFeedback, setPublishFeedback] = useState(true);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackSaved, setFeedbackSaved] = useState(false);
    const [publicFeedbacks, setPublicFeedbacks] = useState<PublicFeedback[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const categories: { label: ComplaintCategory; icon: string; color: string }[] = [
        { label: 'Analysis', icon: '🔍', color: 'bg-blue-500' },
        { label: 'Routine', icon: '✨', color: 'bg-purple-500' },
        { label: 'Product', icon: '🧴', color: 'bg-emerald-500' },
        { label: 'Badge', icon: '🏆', color: 'bg-amber-500' },
        { label: 'Bug', icon: '🐛', color: 'bg-rose-500' },
        { label: 'Payment', icon: '💳', color: 'bg-indigo-500' },
        { label: 'Service', icon: '⚙️', color: 'bg-slate-500' },
        { label: 'Other', icon: '📝', color: 'bg-gray-500' }
    ];

    const categoryLabelMap: Record<string, string> = {
        ANALYSIS: t("userComplaints.categories.analysis"),
        ROUTINE: t("userComplaints.categories.routine"),
        PRODUCT: t("userComplaints.categories.product"),
        BADGE: t("userComplaints.categories.badge"),
        BUG: t("userComplaints.categories.bug"),
        PAYMENT: t("userComplaints.categories.payment"),
        SERVICE: t("userComplaints.categories.service"),
        OTHER: t("userComplaints.categories.other"),
    };

    useEffect(() => {
        fetchComplaints();
        const interval = setInterval(() => {
            fetchComplaints(true);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Scroll instantly to bottom on selection
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [selectedComplaint?.id]);

    // Scroll smoothly on new messages
    useEffect(() => {
        if (chatEndRef.current && selectedComplaint) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedComplaint?.messages?.length]);

    const fetchComplaints = async (silent = false) => {
        try {
            const res = await axios.get('/api/user/complaints');
            setComplaints(res.data);
            if (!silent) setIsLoading(false);
            
            // Auto update selected complaint to reflect new messages
            setSelectedComplaint(prev => {
                if (!prev) return null;
                const updated = res.data.find((c: DBComplaint) => c.id === prev.id);
                return updated || prev;
            });
        } catch (error) {
            if (!silent) toast.error(t("userComplaints.toasts.fetchFailed"));
            setIsLoading(false);
        }
    };

    const fetchPublicFeedbacks = async () => {
        try {
            const res = await axios.get('/api/user/feedback');
            setPublicFeedbacks(Array.isArray(res.data?.feedbacks) ? res.data.feedbacks : []);
        } catch (error) {
            console.error("Failed to fetch feedbacks", error);
        }
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();
        if (feedbackRating < 1 || feedbackRating > 5) {
            toast.error("Please choose a rating between 1 and 5.");
            return;
        }
        if (feedbackMessage.trim().length > 400) {
            toast.error("Message must be 400 characters or less.");
            return;
        }

        setFeedbackSubmitting(true);
        setFeedbackSaved(false);
        try {
            const res = await axios.post('/api/user/feedback', {
                rating: feedbackRating,
                message: feedbackMessage.trim(),
                publish: publishFeedback,
            });

            if (res.status >= 200 && res.status < 300) {
                setFeedbackSaved(true);
                setFeedbackMessage("");
                fetchPublicFeedbacks();
                setTimeout(() => setFeedbackSaved(false), 2500);
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to save feedback.");
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // Mock file upload - just push the names
            const newFileNames = Array.from(files).map(f => URL.createObjectURL(f));
            setNewComplaint(prev => ({
                ...prev,
                evidence: [...prev.evidence, ...newFileNames]
            }));
        }
    };

    const removeFile = (index: number) => {
        setNewComplaint(prev => ({
            ...prev,
            evidence: prev.evidence.filter((_, i) => i !== index)
        }));
    };

    const handleSubmitNew = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            const res = await axios.post('/api/user/complaints', {
                category: newComplaint.category.toUpperCase(),
                content: newComplaint.content,
                evidence: newComplaint.evidence
            });

            setComplaints([res.data, ...complaints]);
            setSelectedComplaint(null); // Return to list view
            setIsAddingNew(false);
            setNewComplaint({ category: 'Other', content: '', evidence: [] });
            toast.success(t("userComplaints.toasts.submitSuccess"));
        } catch (error) {
            toast.error(t("userComplaints.toasts.submitError"));
        } finally {
            setIsSending(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedComplaint) return;
        setIsSending(true);

        try {
            const res = await axios.post(`/api/user/complaints/${selectedComplaint.id}/messages`, {
                text: replyText
            });

            const newMessages = Array.isArray(res.data) ? res.data : [res.data];

            // Check if any new message indicates a closure
            const isClosed = newMessages.some(m => m.text.includes("🚨 TICKET CLOSED"));

            const updatedComplaint: DBComplaint = {
                ...selectedComplaint,
                messages: [...selectedComplaint.messages, ...newMessages],
                status: isClosed ? 'REJECT' : selectedComplaint.status
            };

            setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
            setSelectedComplaint(updatedComplaint);
            setReplyText("");
            toast.success(t("userComplaints.toasts.replySent"));
        } catch (error) {
            toast.error(t("userComplaints.toasts.replyError"));
        } finally {
            setIsSending(false);
        }
    };

    // Mark as read when selected
    useEffect(() => {
        if (selectedComplaint) {
            const hasUnread = selectedComplaint.messages.some(m => m.sender_role === 'ADMIN' && !m.is_read);
            if (hasUnread) {
                // Optimistic update
                setComplaints(prev => prev.map(c => {
                    if (c.id === selectedComplaint.id) {
                        return {
                            ...c,
                            messages: c.messages.map(m =>
                                m.sender_role === 'ADMIN' ? { ...m, is_read: true } : m
                            )
                        };
                    }
                    return c;
                }));

                axios.put(`/api/user/complaints/${selectedComplaint.id}/read`);
            }
        }
    }, [selectedComplaint?.id, selectedComplaint?.messages.length]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="size-4 text-amber-500" />;
            case 'ACCEPT': return <CheckCircle2 className="size-4 text-emerald-500" />;
            case 'REJECT': return <X className="size-4 text-rose-500" />;
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'ACCEPT': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'REJECT': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
        }
    };

    const filteredComplaints = complaints.filter(c =>
        c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stopSpeaking = () => {
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
        }
    };

    const speakContent = (text: string, id: string) => {
        if (typeof window === "undefined") return;

        if (speakingIndex === id) {
            stopSpeaking();
            return;
        }

        stopSpeaking();

        const utterance = new SpeechSynthesisUtterance(text);
        if (/[éèàùâêîôûëïü]/.test(text.toLowerCase())) {
            utterance.lang = "fr-FR";
        } else {
            utterance.lang = "en-US";
        }

        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onend = () => setSpeakingIndex(null);
        utterance.onerror = () => setSpeakingIndex(null);

        setSpeakingIndex(id);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (autoSpeech && !isLoading) {
            const pendingCount = complaints.filter(c => c.status === "PENDING").length;
            const closedCount = complaints.filter(c => c.status === "REJECT").length;
            const acceptedCount = complaints.filter(c => c.status === "ACCEPT").length;

            let fullText = t("userComplaints.speech.overview");
            fullText += t("userComplaints.speech.totalClaims", { count: complaints.length });
            fullText += t("userComplaints.speech.breakdown", { pending: pendingCount, accepted: acceptedCount, closed: closedCount });

            if (searchQuery.trim()) {
                fullText += t("userComplaints.speech.searchActive", { query: searchQuery });
                fullText += t("userComplaints.speech.searchMatches", { count: filteredComplaints.length });
            }

            if (isAddingNew) {
                fullText += t("userComplaints.speech.newClaimOpen");
            } else if (selectedComplaint) {
                fullText += t("userComplaints.speech.selectedCategory", { category: selectedComplaint.category });
                fullText += t("userComplaints.speech.selectedStatus", { status: selectedComplaint.status });
                fullText += t("userComplaints.speech.ticketMessages", { count: selectedComplaint.messages.length });
                if (selectedComplaint.status === "REJECT") {
                    fullText += t("userComplaints.speech.ticketClosed");
                }
            } else {
                fullText += t("userComplaints.speech.noneSelected");
            }

            const id = `complaints-${complaints.length}-${pendingCount}-${acceptedCount}-${closedCount}-${selectedComplaint?.id ?? "none"}-${isAddingNew}-${searchQuery}-${filteredComplaints.length}`;
            if (speakingIndex !== id) {
                speakContent(fullText, id);
            }
        }
    }, [
        autoSpeech,
        isLoading,
        complaints,
        selectedComplaint,
        isAddingNew,
        searchQuery,
        filteredComplaints.length,
    ]);

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (activeTab === "feedback") {
            fetchPublicFeedbacks();
        }
    }, [activeTab]);

    return (
        <UserLayout>
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[10%] -left-[10%] size-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] size-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
            </div>

            <div className="user-complaints-page mx-auto w-full max-w-[1300px] p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="size-3.5" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {t("userComplaints.header.title")} <span className="text-primary italic">{t("userComplaints.header.titleAccent")}</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {t("userComplaints.header.subtitle")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <AudioToggleButton
                            enabled={autoSpeech}
                            onToggle={() => {
                                if (autoSpeech) stopSpeaking();
                                setAutoSpeech(!autoSpeech);
                            }}
                            label={t("userComplaints.audioLabel")}
                        />
                        {!isAddingNew && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsAddingNew(true)}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl font-bold shadow-2xl transition-all active:scale-95"
                            >
                                <Plus className="size-5" />
                                {t("userComplaints.actions.newClaim")}
                            </motion.button>
                        )}
                    </div>
                </div>

                <div className="inline-flex rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setActiveTab("complaints")}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activeTab === "complaints"
                                ? "bg-[#156d95] text-white"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                    >
                        Complaints
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("feedback")}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activeTab === "feedback"
                                ? "bg-[#156d95] text-white"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                    >
                        Feedback
                    </button>
                </div>

                {activeTab === "complaints" ? (

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* List Panel */}
                    <div className={cn(
                        "lg:col-span-5 space-y-6",
                        (selectedComplaint || isAddingNew) && "hidden lg:block"
                    )}>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={t("userComplaints.searchPlaceholder")}
                                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-800 border-none shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all font-medium text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <span className="loading loading-spinner text-primary"></span>
                            </div>
                        ) : filteredComplaints.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <MessageSquare className="size-16 mx-auto text-gray-300 mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t("userComplaints.empty.title")}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t("userComplaints.empty.description")}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredComplaints.map((c) => (
                                    <motion.div
                                        key={c.id}
                                        layoutId={String(c.id)}
                                        onClick={() => { setSelectedComplaint(c); setIsAddingNew(false); }}
                                        className={cn(
                                            "p-6 rounded-[2rem] border-2 transition-all cursor-pointer group relative overflow-hidden",
                                            selectedComplaint?.id === c.id
                                                ? "bg-white dark:bg-gray-800 border-primary shadow-xl shadow-primary/5"
                                                : "bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("size-10 rounded-xl flex items-center justify-center text-xl shadow-inner bg-primary/10")}>
                                                    {categories.find(cat => cat.label.toUpperCase() === c.category)?.icon || '📝'}
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">{categoryLabelMap[c.category] || c.category}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", getStatusBg(c.status))}>
                                                {getStatusIcon(c.status)}
                                                {c.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn("size-2 rounded-full shrink-0",
                                                c.messages[c.messages.length - 1]?.sender_role === 'ADMIN' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-gray-300"
                                            )} />
                                            <p className="text-gray-900 dark:text-white font-bold text-sm line-clamp-1">
                                                {c.messages[c.messages.length - 1]?.text || c.content}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 lowercase italic">
                                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-3">
                                                {c.messages.filter(m => m.sender_role === 'ADMIN' && !m.is_read).length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center gap-1 shadow-md animate-pulse whitespace-nowrap">
                                                        <Bell className="size-2.5 fill-current" />
                                                        {c.messages.filter(m => m.sender_role === 'ADMIN' && !m.is_read).length} NEW MESSAGE
                                                    </span>
                                                )}
                                                <ChevronRight className="size-3" />
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chat or Form Detail View */}
                    <div className="lg:col-span-7 sticky top-8">
                        <AnimatePresence mode="wait">
                            {isAddingNew ? (
                                <motion.div
                                    key="new-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 md:p-8 shadow-2xl relative"
                                >
                                    <div className="absolute top-6 right-6">
                                        <button onClick={() => setIsAddingNew(false)} className="p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors">
                                            <X className="size-6" />
                                        </button>
                                    </div>

                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8">{t("userComplaints.newForm.title")}</h2>

                                    <form onSubmit={handleSubmitNew} className="space-y-8">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">{t("userComplaints.newForm.selectCategory")}</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.label}
                                                        type="button"
                                                        onClick={() => setNewComplaint(prev => ({ ...prev, category: cat.label }))}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 group",
                                                            newComplaint.category === cat.label
                                                                ? "border-primary bg-primary/5 text-primary"
                                                                : "border-gray-50 dark:border-gray-700 hover:border-gray-200"
                                                        )}
                                                    >
                                                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">{t("userComplaints.newForm.detailedReport")}</label>
                                            <textarea
                                                required
                                                placeholder={t("userComplaints.newForm.reportPlaceholder")}
                                                className="w-full min-h-[150px] p-6 rounded-3xl border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary outline-none transition-all resize-none shadow-inner"
                                                value={newComplaint.content}
                                                onChange={(e) => setNewComplaint(prev => ({ ...prev, content: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">{t("userComplaints.newForm.uploadProof")}</label>
                                            <div className="flex flex-wrap gap-4 p-4 rounded-[2rem] bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-inner">
                                                {newComplaint.evidence.map((file, idx) => (
                                                    <div key={idx} className="relative size-20 rounded-2xl overflow-hidden shadow-md group">
                                                        <img src={file} alt="Preview" className="size-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="size-20 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all shadow-sm"
                                                >
                                                    <Plus className="size-6 mb-1" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{t("userComplaints.newForm.add")}</span>
                                                </button>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,.pdf,.doc,.docx" />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSending}
                                            className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-50"
                                        >
                                            {isSending ? t("userComplaints.newForm.submitting") : t("userComplaints.newForm.confirmSubmit")}
                                        </button>
                                    </form>
                                </motion.div>
                            ) : selectedComplaint ? (
                                <motion.div
                                    key={`chat-${selectedComplaint.id}`}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex flex-col h-[650px] shadow-2xl overflow-hidden"
                                >
                                    {/* Chat Header */}
                                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 z-10">
                                            <div className="flex gap-5 items-center">
                                                <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-3xl shadow-inner">
                                                    {categories.find(cat => cat.label.toUpperCase() === selectedComplaint.category)?.icon || '📝'}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase leading-none">{t("userComplaints.chat.claimsTitle", { category: categoryLabelMap[selectedComplaint.category] || selectedComplaint.category })}</h3>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm", getStatusBg(selectedComplaint.status))}>
                                                            {selectedComplaint.status}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{selectedComplaint.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {selectedComplaint.status === 'PENDING' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm(t("userComplaints.confirmDelete"))) {
                                                                try {
                                                                    await axios.delete(`/api/user/complaints/${selectedComplaint.id}`);
                                                                    setComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));
                                                                    setSelectedComplaint(null);
                                                                    toast.success(t("userComplaints.toasts.ticketDeleted"));
                                                                } catch (error) {
                                                                    toast.error(t("userComplaints.toasts.deleteFailed"));
                                                                }
                                                            }
                                                        }}
                                                        className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 rounded-2xl transition-colors"
                                                        title={t("userComplaints.actions.deleteClaim")}
                                                    >
                                                        <Trash2 className="size-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => setSelectedComplaint(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-2xl transition-colors" title={t("userComplaints.actions.closeDiscussion")}>
                                                    <X className="size-6" />
                                                </button>
                                            </div>
                                        </div>

                                    {/* Chat Messages */}
                                    <div
                                        className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col-reverse custom-scrollbar"
                                        data-lenis-prevent
                                    >
                                        <div ref={chatEndRef} />
                                        {[...selectedComplaint.messages].reverse().map((msg, idx) => (
                                            <div key={msg.id} className={cn(
                                                "flex flex-col max-w-[85%]",
                                                msg.sender_role === 'USER' ? "ml-auto items-end" : "mr-auto items-start font-medium"
                                            )}>
                                                <div className="flex items-center gap-3 mb-2 px-3">
                                                    {msg.sender_role === 'ADMIN' && (
                                                        <div className="px-2 py-1 rounded-lg bg-primary text-[8px] font-black text-white flex items-center justify-center shadow-lg shadow-primary/20">{t("userComplaints.chat.brand")}</div>
                                                    )}
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                                                        {msg.sender_role === 'USER' ? t('userComplaints.chat.myMessage') : t('userComplaints.chat.teamSupport')}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-bold opacity-60">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "p-3 px-5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm relative group",
                                                    msg.sender_role === 'USER'
                                                        ? "bg-primary text-white rounded-tr-none shadow-xl shadow-primary/10"
                                                        : msg.text.includes("⚠️")
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-2 border-rose-500/30 rounded-tl-none shadow-[0_0_20px_rgba(244,63,94,0.1)] backdrop-blur-md"
                                                            : "bg-white dark:bg-gray-700 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-600"
                                                )}>
                                                    {(msg.text.includes("⚠️") || msg.text.includes("🚫")) && (
                                                        <div className="absolute -top-3 -right-3 size-8 bg-white dark:bg-gray-800 rounded-full border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-lg animate-pulse">
                                                            <AlertCircle className="size-4" />
                                                        </div>
                                                    )}

                                                    {msg.text.includes("⚠️") && (
                                                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rose-500/20 font-black uppercase tracking-[0.1em] text-[8px] text-rose-700 dark:text-rose-400">
                                                            <div className="size-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                                                            {t("userComplaints.chat.systemProhibition")}
                                                        </div>
                                                    )}
                                                    <div className="relative z-10 leading-relaxed font-semibold">
                                                        {msg.text}
                                                    </div>
                                                </div>
                                                {idx === 0 && selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && (
                                                    <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                                                        {selectedComplaint.evidence.map((urlObj, i) => (
                                                            <div key={i} className="size-24 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl cursor-zoom-in">
                                                                <img src={urlObj.url} alt="Evidence" className="size-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Input Footer */}
                                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        {selectedComplaint.status === 'REJECT' ? (
                                            <div className="flex items-center gap-4 p-5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-3xl border-2 border-rose-100 dark:border-rose-900/30 shadow-inner">
                                                <AlertTriangle className="size-6 shrink-0" />
                                                <p className="text-sm font-bold uppercase tracking-wide">{t("userComplaints.chat.ticketClosed")}</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleReply} className="flex gap-4 items-center">
                                                <div className="flex-1 relative group">
                                                    <input
                                                        type="text"
                                                        placeholder={t("userComplaints.chat.writeUpdate")}
                                                        className="w-full px-8 py-5 pr-16 rounded-[2rem] border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner font-medium"
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        disabled={isSending}
                                                    />
                                                    <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                                        <Paperclip className="size-6" />
                                                    </button>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="submit"
                                                    disabled={!replyText.trim() || isSending}
                                                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white size-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/30 transition-all shrink-0"
                                                >
                                                    {isSending ? <span className="loading loading-spinner loading-sm"></span> : <Send className="size-7" />}
                                                </motion.button>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden relative">
                                    <div className="relative mb-10">
                                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 rotate-45" />
                                        <div className="relative size-32 bg-white dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-gray-100 dark:border-gray-700">
                                            <MessageSquare className="size-14 text-primary/30" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">{t("userComplaints.inboxTitle")}</h3>
                                    <p className="text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                                        {t("userComplaints.inboxHint")}
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-6">
                            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 md:p-8 shadow-2xl">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Share your feedback</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Tell us how helpful your experience was.
                                </p>

                                <form onSubmit={submitFeedback} className="space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Rating</label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => {
                                                const active = value <= feedbackRating;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setFeedbackRating(value)}
                                                        className={cn(
                                                            "inline-flex size-10 items-center justify-center rounded-full border transition-all",
                                                            active
                                                                ? "border-amber-300 bg-amber-50 text-amber-500"
                                                                : "border-gray-200 bg-white text-gray-300 hover:text-amber-400 dark:border-gray-700 dark:bg-gray-900"
                                                        )}
                                                    >
                                                        <Star size={18} className={active ? "fill-current" : ""} />
                                                    </button>
                                                );
                                            })}
                                            <span className="ml-2 text-xs font-bold text-gray-500">{feedbackRating}/5</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Message (optional)</label>
                                        <textarea
                                            rows={4}
                                            maxLength={400}
                                            value={feedbackMessage}
                                            onChange={(e) => setFeedbackMessage(e.target.value)}
                                            placeholder="What did you like and what should be improved?"
                                            className="w-full p-4 rounded-2xl border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                        />
                                        <p className="mt-2 text-xs text-gray-400">{feedbackMessage.length}/400</p>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={publishFeedback}
                                            onChange={(e) => setPublishFeedback(e.target.checked)}
                                            className="size-4 rounded border-gray-300"
                                        />
                                        Allow display in public testimonials
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={feedbackSubmitting}
                                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-[1.2rem] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                    >
                                        {feedbackSubmitting ? "Saving..." : feedbackSaved ? "Saved" : "Submit feedback"}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-6 space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Recent public feedback</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visible feedback from users</p>
                            </div>

                            {publicFeedbacks.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No public feedback yet.</p>
                                </div>
                            ) : (
                                publicFeedbacks.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-black text-gray-900 dark:text-white">{item.nom}</p>
                                            <span className="text-xs font-bold text-amber-500">{item.note}/5</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {item.message || "(No written message)"}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
