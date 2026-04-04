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

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedComplaint?.messages]);

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

        setComplaints(prev => prev.map(c => 
            c.id === selectedId 
                ? { ...c, messages: [...c.messages, newMessage] } 
                : c
        ));
        setReplyText("");
    };

    const getStatusStyles = (status: ComplaintStatus) => {
        switch(status) {
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
            <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
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

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                                        "p-5 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-900/50 relative group",
                                        selectedId === c.id && "bg-primary/5 dark:bg-primary/5 border-l-4 border-l-primary"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {c.userName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-sm truncate max-w-[120px]">{c.userName}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                                        {categories[c.category]} {c.content}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", getStatusStyles(c.status))}>
                                            {c.status}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <MessageSquare className="size-3" />
                                            {c.messages.length}
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
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {selectedComplaint.messages.map((msg) => (
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
                                            "p-5 rounded-2xl text-sm shadow-sm",
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
                                <div ref={chatEndRef} />
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
