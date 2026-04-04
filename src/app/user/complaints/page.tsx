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
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComplaintCategory, ChatMessage } from "@/lib/complaintsData";
import { toast } from "sonner";
import axios from "axios";

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

export default function UserComplaintsPage() {
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

    useEffect(() => {
        fetchComplaints();
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

    const fetchComplaints = async () => {
        try {
            const res = await axios.get('/api/user/complaints');
            setComplaints(res.data);
            setIsLoading(false);
        } catch (error) {
            toast.error("Failed to fetch complaints");
            setIsLoading(false);
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
            setIsAddingNew(false);
            setNewComplaint({ category: 'Other', content: '', evidence: [] });
            toast.success("Complaint submitted successfully! (Cleaned from bad words)");
        } catch (error) {
            toast.error("An error occurred during submission.");
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
            toast.success("Reply sent (Cleaned from bad words)");
        } catch (error) {
            toast.error("An error occurred.");
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
                
                // Potentially call API to mark as read here if implemented
                // axios.put(`/api/user/complaints/${selectedComplaint.id}/read`);
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

    return (
        <UserLayout>
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[10%] -left-[10%] size-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] size-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
            </div>

            <div className="mx-auto w-full max-w-[1300px] p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck className="size-3.5" />
                            Backend Connected
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            RECLAMATION <span className="text-primary italic">& FEEDBACK</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Your voice matters. Track and manage your reports in real-time.
                        </p>
                    </div>
                    {!isAddingNew && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsAddingNew(true)}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl font-bold shadow-2xl transition-all active:scale-95"
                        >
                            <Plus className="size-5" />
                            New Request
                        </motion.button>
                    )}
                </div>

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
                                placeholder="Search by message or category..."
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
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All clear</h3>
                                <p className="text-gray-500 dark:text-gray-400">No active complaints found.</p>
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
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-400">{c.category}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", getStatusBg(c.status))}>
                                                {getStatusIcon(c.status)}
                                                {c.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={cn("size-2 rounded-full shrink-0", 
                                                c.messages[c.messages.length-1]?.sender_role === 'ADMIN' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-gray-300"
                                            )} />
                                            <p className="text-gray-900 dark:text-white font-bold text-sm line-clamp-1">
                                                {c.messages[c.messages.length - 1]?.text || c.content}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 lowercase italic">
                                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    {c.messages.length} messages
                                                </span>
                                                {c.messages.filter(m => m.sender_role === 'ADMIN' && !m.is_read).length > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                                                        {c.messages.filter(m => m.sender_role === 'ADMIN' && !m.is_read).length} nouveaux
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

                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8">What happened?</h2>

                                    <form onSubmit={handleSubmitNew} className="space-y-8">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">Select Category</label>
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
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">Your detailed report</label>
                                            <textarea
                                                required
                                                placeholder="Write your reclamation here..."
                                                className="w-full min-h-[150px] p-6 rounded-3xl border-none ring-1 ring-gray-200 dark:ring-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary outline-none transition-all resize-none shadow-inner"
                                                value={newComplaint.content}
                                                onChange={(e) => setNewComplaint(prev => ({ ...prev, content: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 px-1">Upload Proof (Images, Documents)</label>
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
                                                    <span className="text-[10px] font-black uppercase tracking-widest">ADD</span>
                                                </button>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,.pdf,.doc,.docx" />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSending}
                                            className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-50"
                                        >
                                            {isSending ? "SUBMITTING..." : "CONFIRM & SUBMIT"}
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
                                                <h3 className="font-black text-xl tracking-tight text-gray-900 dark:text-white uppercase leading-none">{selectedComplaint.category} Claims</h3>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className={cn("px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm", getStatusBg(selectedComplaint.status))}>
                                                        {selectedComplaint.status}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">#{selectedComplaint.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedComplaint(null)} className="lg:hidden p-3 bg-gray-100 rounded-full">
                                            <X className="size-6" />
                                        </button>
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
                                                        <div className="px-2 py-1 rounded-lg bg-primary text-[8px] font-black text-white flex items-center justify-center shadow-lg shadow-primary/20">DEEPSKYN</div>
                                                    )}
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
                                                        {msg.sender_role === 'USER' ? 'My Message' : 'Team Support DeepSkyn'}
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
                                                            System Prohibition
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
                                                <p className="text-sm font-bold uppercase tracking-wide">This ticket has been officially closed.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleReply} className="flex gap-4 items-center">
                                                <div className="flex-1 relative group">
                                                    <input
                                                        type="text"
                                                        placeholder="Write an update..."
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
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Support Inbox</h3>
                                    <p className="text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                                        Choose a conversation to view detailed history and updates from our security team.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
