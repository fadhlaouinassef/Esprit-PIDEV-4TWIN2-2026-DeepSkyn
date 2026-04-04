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
    Image as ImageIcon,
    FileText,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { filterBadWords } from "@/lib/badWordsFilter";
import { Complaint, ComplaintCategory, ComplaintStatus, MOCK_COMPLAINTS, ChatMessage } from "@/lib/complaintsData";
import { toast } from "sonner";

export default function UserComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [newComplaint, setNewComplaint] = useState({
        category: 'Other' as ComplaintCategory,
        content: '',
        evidence: [] as string[]
    });
    const [replyText, setReplyText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const categories: { label: ComplaintCategory; icon: string }[] = [
        { label: 'Analysis', icon: '🔍' },
        { label: 'Routine', icon: '✨' },
        { label: 'Product', icon: '🧴' },
        { label: 'Badge', icon: '🏆' },
        { label: 'Bug', icon: '🐛' },
        { label: 'Payment', icon: '💳' },
        { label: 'Service', icon: '⚙️' },
        { label: 'Other', icon: '📝' }
    ];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedComplaint?.messages]);

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

    const handleSubmitNew = (e: React.FormEvent) => {
        e.preventDefault();

        const { isClean, filteredText } = filterBadWords(newComplaint.content);

        if (!isClean) {
            toast.warning("Your message contains offensive language. It has been filtered.");
        }

        const newTicket: Complaint = {
            id: `C${complaints.length + 1}`,
            userId: "U1", // Mock current user
            userName: "John Doe",
            category: newComplaint.category,
            content: filteredText,
            status: 'pending',
            evidence: newComplaint.evidence,
            createdAt: new Date().toISOString(),
            messages: [
                {
                    id: `m${Date.now()}`,
                    sender: 'user',
                    text: filteredText,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        setComplaints([newTicket, ...complaints]);
        setIsAddingNew(false);
        setNewComplaint({ category: 'Other', content: '', evidence: [] });
        toast.success("Complaint submitted successfully!");
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedComplaint) return;

        const { filteredText } = filterBadWords(replyText);

        const newMessage: ChatMessage = {
            id: `m${Date.now()}`,
            sender: 'user',
            text: filteredText,
            timestamp: new Date().toISOString()
        };

        const updatedComplaint = {
            ...selectedComplaint,
            messages: [...selectedComplaint.messages, newMessage]
        };

        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? updatedComplaint : c));
        setSelectedComplaint(updatedComplaint);
        setReplyText("");

        // Mock auto-response for demonstration (frontend only)
        setTimeout(() => {
            const adminReply: ChatMessage = {
                id: `m-admin-${Date.now()}`,
                sender: 'admin',
                text: "Thank you for your message. We have received it and an investigation is underway. We appreciate your patience.",
                timestamp: new Date().toISOString()
            };

            setComplaints(prev => prev.map(c => {
                if (c.id === selectedComplaint.id) {
                    return { ...c, messages: [...c.messages, adminReply] };
                }
                return c;
            }));

            setSelectedComplaint(prev => {
                if (prev && prev.id === selectedComplaint.id) {
                    return { ...prev, messages: [...prev.messages, adminReply] };
                }
                return prev;
            });
        }, 3000);
    };

    const getStatusIcon = (status: ComplaintStatus) => {
        switch (status) {
            case 'pending': return <Clock className="size-4 text-amber-500" />;
            case 'accepted': return <CheckCircle2 className="size-4 text-emerald-500" />;
            case 'rejected': return <X className="size-4 text-rose-500" />;
        }
    };

    const getStatusBg = (status: ComplaintStatus) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
        }
    };

    return (
        <UserLayout>
            <div className="mx-auto w-full max-w-[1200px] p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <MessageSquare className="size-8 text-primary" />
                            Complaints & Feedback
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            We value your feedback. Submit a complaint and interact with our team.
                        </p>
                    </div>
                    {!isAddingNew && (
                        <button
                            onClick={() => setIsAddingNew(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="size-5" />
                            New Complaint
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Complaints List */}
                    <div className={cn(
                        "lg:col-span-5 space-y-4",
                        (selectedComplaint || isAddingNew) && "hidden lg:block"
                    )}>
                        {complaints.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <MessageSquare className="size-16 mx-auto text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No complaints yet</h3>
                                <p className="text-gray-500 dark:text-gray-400">Your feedback history will appear here.</p>
                            </div>
                        ) : (
                            complaints.map((c) => (
                                <motion.div
                                    layoutId={c.id}
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedComplaint(c);
                                        setIsAddingNew(false);
                                    }}
                                    className={cn(
                                        "p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md",
                                        selectedComplaint?.id === c.id
                                            ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{categories.find(cat => cat.label === c.category)?.icon}</span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-primary transition-colors">
                                                {c.category}
                                            </span>
                                        </div>
                                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border", getStatusBg(c.status))}>
                                            {getStatusIcon(c.status)}
                                            {c.status}
                                        </div>
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium line-clamp-1 mb-2">
                                        {c.content}
                                    </p>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">
                                            {c.messages.length} messages <ChevronRight className="size-3" />
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Detailed View / New Form */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {isAddingNew ? (
                                <motion.div
                                    key="new-form"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-xl"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-bold">New Complaint</h2>
                                        <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                            <X className="size-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmitNew} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-gray-500">Select Category</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.label}
                                                        type="button"
                                                        onClick={() => setNewComplaint(prev => ({ ...prev, category: cat.label }))}
                                                        className={cn(
                                                            "p-4 rounded-2xl border-2 transition-all text-center group",
                                                            newComplaint.category === cat.label
                                                                ? "border-primary bg-primary/5 text-primary"
                                                                : "border-gray-100 dark:border-gray-700 hover:border-gray-200"
                                                        )}
                                                    >
                                                        <span className="block text-2xl mb-1">{cat.icon}</span>
                                                        <span className="text-sm font-bold">{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-gray-500">How can we help?</label>
                                            <textarea
                                                required
                                                placeholder="Describe your issue in detail..."
                                                className="w-full min-h-[150px] p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                                value={newComplaint.content}
                                                onChange={(e) => setNewComplaint(prev => ({ ...prev, content: e.target.value }))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold mb-3 uppercase tracking-wider text-gray-500">Upload Evidence</label>
                                            <div className="flex flex-wrap gap-4">
                                                {newComplaint.evidence.map((file, idx) => (
                                                    <div key={idx} className="relative size-20 rounded-xl overflow-hidden border border-gray-200 group">
                                                        <img src={file} alt="Preview" className="size-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="size-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all"
                                                >
                                                    <Plus className="size-6" />
                                                    <span className="text-[10px] font-bold mt-1">UPLOAD</span>
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    multiple
                                                    accept="image/*,.pdf,.doc,.docx"
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-2">Images, screenshots or documents (Max 5MB)</p>
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all transform active:scale-[0.98]"
                                        >
                                            Submit Message
                                        </button>
                                    </form>
                                </motion.div>
                            ) : selectedComplaint ? (
                                <motion.div
                                    key={`chat-${selectedComplaint.id}`}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col h-[700px] shadow-xl overflow-hidden"
                                >
                                    {/* Chat Header */}
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
                                        <div className="flex gap-4 items-center">
                                            <div className="size-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-2xl">
                                                {categories.find(cat => cat.label === selectedComplaint.category)?.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg leading-tight">{selectedComplaint.category} Issue</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", getStatusBg(selectedComplaint.status))}>
                                                        {selectedComplaint.status}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium">#{selectedComplaint.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedComplaint(null)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full">
                                            <X className="size-6" />
                                        </button>
                                    </div>

                                    {/* Chat Messages */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                        {selectedComplaint.messages.map((msg, idx) => (
                                            <div key={msg.id} className={cn(
                                                "flex flex-col max-w-[85%]",
                                                msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                            )}>
                                                <div className="flex items-center gap-2 mb-1.5 px-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {msg.sender === 'user' ? 'Me' : 'DeepSkyn Support'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-2xl text-sm leading-relaxed",
                                                    msg.sender === 'user'
                                                        ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                                                        : "bg-gray-100 dark:bg-gray-900 dark:text-white rounded-tl-none"
                                                )}>
                                                    {msg.text}
                                                </div>
                                                {idx === 0 && selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                                                        {selectedComplaint.evidence.map((url, i) => (
                                                            <div key={i} className="size-24 rounded-lg overflow-hidden border-2 border-primary/20 hover:border-primary transition-colors cursor-zoom-in">
                                                                <img src={url} alt="Evidence" className="size-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>

                                    {/* Chat Input */}
                                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10">
                                        {selectedComplaint.status === 'rejected' ? (
                                            <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                                <AlertTriangle className="size-5 shrink-0" />
                                                <p className="text-sm font-medium">This ticket has been closed. You cannot send more messages.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleReply} className="flex gap-3">
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Type your message..."
                                                        className="w-full px-5 py-4 pr-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                    />
                                                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                                                        <Paperclip className="size-5" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={!replyText.trim()}
                                                    className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all transform active:scale-[0.95]"
                                                >
                                                    <Send className="size-6" />
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-12 bg-gray-50/50 dark:bg-gray-900/10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="size-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                        <MessageSquare className="size-10 text-primary/40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a ticket</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                                        Choose a complaint from the list to view the conversation and status.
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
