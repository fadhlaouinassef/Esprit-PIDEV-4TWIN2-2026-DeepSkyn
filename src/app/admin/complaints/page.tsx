"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/app/ui/AdminLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Search,
    Filter,
    Send,
    Clock,
    CheckCircle2,
    XCircle,
    Paperclip,
    ChevronDown,
    User,
    Calendar,
    ArrowLeft,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Complaint, ComplaintStatus, ComplaintCategory, MOCK_COMPLAINTS, ChatMessage } from "@/lib/complaintsData";
import { toast } from "sonner";

export default function AdminComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState("");

    const selectedComplaint = complaints.find(c => c.id === selectedId);
    const chatEndRef = useRef<HTMLDivElement>(null);

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

        // Mark as read when selected
        if (selectedId) {
            setComplaints(prev => prev.map(c => {
                if (c.id === selectedId) {
                    return {
                        ...c,
                        messages: c.messages.map(m =>
                            m.sender === 'user' ? { ...m, isRead: true } : m
                        )
                    };
                }
                return c;
            }));
        }
    }, [selectedComplaint?.messages?.length]);

    const filteredComplaints = complaints.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesSearch = c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleUpdateStatus = (id: string, newStatus: ComplaintStatus) => {
        setComplaints(prev => prev.map(c =>
            c.id === id ? { ...c, status: newStatus } : c
        ));
        toast.success(`Ticket status updated to ${newStatus}`);
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedId) return;

        const newMessage: ChatMessage = {
            id: `m${Date.now()}`,
            sender: 'admin',
            text: replyText,
            timestamp: new Date().toISOString()
        };

        const isClosed = newMessage.text.includes("🚨 TICKET CLOSED");

        setComplaints(prev => prev.map(c =>
            c.id === selectedId
                ? { 
                    ...c, 
                    messages: [...c.messages, newMessage],
                    status: isClosed ? 'rejected' : c.status
                  }
                : c
        ));
        setReplyText("");
    };

    const getStatusStyles = (status: ComplaintStatus) => {
        switch (status) {
            case 'pending': return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            case 'accepted': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case 'rejected': return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
        }
    };

    const categories: Record<ComplaintCategory, string> = {
        'Analysis': '🔍',
        'Routine': '✨',
        'Product': '🧴',
        'Badge': '🏆',
        'Bug': '🐛',
        'Payment': '💳',
        'Service': '⚙️',
        'Other': '📝'
    };

    return (
        <AdminLayout>
            <div className="flex h-[calc(100vh-12rem)] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                {/* List Sidebar */}
                <div className={cn(
                    "w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-700 flex flex-col",
                    selectedId && "hidden md:flex"
                )}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 space-y-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MessageSquare className="size-6 text-primary" />
                            Feedbacks
                        </h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:border-primary transition-colors text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s as any)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap capitalize transition-all",
                                        filterStatus === s
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 dark:bg-gray-900 text-gray-500 hover:bg-gray-200"
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div 
                        className="flex-1 overflow-y-auto custom-scrollbar scrollbar-hide"
                        data-lenis-prevent
                    >
                        {filteredComplaints.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <MessageSquare className="size-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No results found</p>
                            </div>
                        ) : (
                            filteredComplaints.map((c) => (
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
                                            <span className="text-sm">{categories[c.category]}</span>
                                            <span className="uppercase tracking-widest">{c.category}</span>
                                        </div>
                                        <div className={cn("px-3 py-1.5 rounded-3xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm border", 
                                            c.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            c.status === 'accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                            "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            <Clock className="size-3" />
                                            {c.status}
                                        </div>
                                    </div>

                                    {/* Middle Row: Title/Content (Last Message Preview) */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={cn("size-2 rounded-full shrink-0", 
                                            c.messages[c.messages.length-1]?.sender === 'user' ? "bg-primary" : "bg-gray-300"
                                        )} />
                                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-sm">
                                            {c.messages[c.messages.length - 1]?.text || c.content}
                                        </h3>
                                    </div>

                                    {/* Bottom Row: Date and Stats */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-bold group-hover:text-primary transition-colors">
                                                <span className="italic">{c.messages.length} replies</span>
                                                {c.messages.filter(m => m.sender === 'user' && !m.isRead).length > 0 && (
                                                    <span className="text-rose-500 ml-1 font-extrabold underline decoration-rose-500/30">
                                                        ({c.messages.filter(m => m.sender === 'user' && !m.isRead).length} unread)
                                                    </span>
                                                )}
                                                <ChevronDown className="size-3 -rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30 dark:bg-gray-900/10">
                    {selectedComplaint ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedId(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                                        <ArrowLeft className="size-5" />
                                    </button>
                                    <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-2xl">
                                        {categories[selectedComplaint.category]}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">{selectedComplaint.userName}</h2>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-medium">
                                            <span className="flex items-center gap-1"><User className="size-3" /> User ID: #{selectedComplaint.userId}</span>
                                            <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="hidden lg:flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                        {(['pending', 'accepted', 'rejected'] as ComplaintStatus[]).map((s) => (
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
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg">
                                        <MoreHorizontal className="size-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div 
                                className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col-reverse custom-scrollbar scrollbar-hide"
                                data-lenis-prevent
                            >
                                <div ref={chatEndRef} />
                                {[...selectedComplaint.messages].reverse().map((msg) => (
                                    <div key={msg.id} className={cn(
                                        "flex flex-col max-w-[80%]",
                                        msg.sender === 'admin' ? "ml-auto items-end" : "mr-auto items-start"
                                    )}>
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {msg.sender === 'admin' ? 'Support Agent' : 'User'}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "p-3 px-5 rounded-2xl text-[13px] shadow-sm",
                                            msg.sender === 'admin'
                                                ? "bg-primary text-white rounded-tr-none shadow-primary/10"
                                                : "bg-white dark:bg-gray-800 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700"
                                        )}>
                                            {msg.text}
                                        </div>
                                        {msg.sender === 'user' && selectedComplaint.evidence && selectedComplaint.evidence.length > 0 && selectedComplaint.messages[0].id === msg.id && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {selectedComplaint.evidence.map((url, i) => (
                                                    <div key={i} className="size-32 rounded-xl overflow-hidden border-2 border-primary/10 hover:border-primary transition-all cursor-zoom-in shadow-md">
                                                        <img src={url} alt="Evidence" className="size-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Interaction */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <form onSubmit={handleSendReply} className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Write your response..."
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
                                        Respond
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-40">
                            <div className="size-24 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                                <MessageSquare className="size-12 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">No feedback selected</h2>
                            <p className="text-sm max-w-xs">Select a conversation from the sidebar to view details and respond.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
