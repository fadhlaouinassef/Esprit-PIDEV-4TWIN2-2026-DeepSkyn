
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Bell, UserPlus, FileSearch, Sparkles, Check, ShieldCheck } from "lucide-react";
import { Dropdown, DropdownContent, DropdownTrigger } from "./dropdown";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface NotificationItem {
    id: string | number;
    image: string;
    title: string;
    subTitle: string;
    type: 'signup' | 'analyse' | 'verify';
    time: string;
    date: string;
    isNew: boolean;
    link: string;
}

export function Notification() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const isMobile = useIsMobile();
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);

    // Fetch existing notifications and Initialize socket
    useEffect(() => {
        if (session?.user?.role !== 'ADMIN') return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/admin/notifications');
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map((n: any) => {
                        const now = new Date(n.created_at);
                        return {
                            id: n.id,
                            image: n.image || "/avatar.png",
                            title: n.title,
                            subTitle: n.subTitle,
                            type: n.type as 'signup' | 'analyse' | 'verify',
                            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            date: now.toLocaleDateString(),
                            isNew: !n.is_read,
                            link: n.type === 'signup' ? '/admin/users' : n.type === 'verify' ? '/admin/users' : `/admin/analyzes?search=${encodeURIComponent(n.title.split(' completed')[0])}`
                        };
                    });
                    setNotifications(formatted);
                    setUnreadCount(formatted.filter((n: any) => n.isNew).length);
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };

        const initSocket = async () => {
            try {
                // Ensure the socket server is initialized
                const socketInit = await fetch('/api/socket');

                // If the fetch fails with 404, we might be in a different environment
                // Log it to help debugging
                if (socketInit.status === 404) {
                    console.warn('⚠️ Socket initialization route not found (404). Real-time functionality might be limited.');
                }

                const socket = io({
                    path: '/api/socket',
                    addTrailingSlash: false,
                    reconnectionAttempts: 5,
                    timeout: 20000,
                });

                socket.on('connect', () => {
                    console.log('🔗 Connected to Real-time Notification Server');
                });

                socket.on('connect_error', (err) => {
                    console.warn('⚠️ Socket connection error. Falling back to manual refresh.', err.message);
                });

                socket.on('signup', (data: any) => {
                    const now = new Date(data.timestamp || Date.now());
                    const newNotif: NotificationItem = {
                        id: data.id || Date.now(),
                        image: data.image || "/avatar.png",
                        title: data.nom ? `${data.nom} Joined the Team!` : "New User Joined!",
                        subTitle: "Congratulate him",
                        type: 'signup',
                        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: now.toLocaleDateString(),
                        isNew: true,
                        link: '/admin/users'
                    };

                    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                    setUnreadCount(prev => prev + 1);

                    toast.success(`${data.nom || 'A user'} joined!`, {
                        description: "A new user just signed up.",
                        icon: <UserPlus className="size-4" />,
                    });
                });

                socket.on('analyse', (data: any) => {
                    const now = new Date(data.timestamp || Date.now());
                    const newNotif: NotificationItem = {
                        id: data.id || Date.now(),
                        image: data.image || "/avatar.png",
                        title: data.nom ? `${data.nom} completed a skin analysis!` : "User completed an analysis!",
                        subTitle: `Score: ${data.score}/100 - Analysis details`,
                        type: 'analyse',
                        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: now.toLocaleDateString(),
                        isNew: true,
                        link: `/admin/analyzes?search=${encodeURIComponent(data.nom || '')}`
                    };

                    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                    setUnreadCount(prev => prev + 1);

                    toast.message(`${data.nom || 'A user'} analyzed their skin`, {
                        description: `Skin Score: ${data.score}/100`,
                        icon: <FileSearch className="size-4" />,
                    });
                });

                socket.on('verify', (data: any) => {
                    const now = new Date(data.timestamp || Date.now());
                    const newNotif: NotificationItem = {
                        id: data.id || Date.now(),
                        image: data.image || "/avatar.png",
                        title: data.nom ? `${data.nom} Verified their account!` : "User Verified!",
                        subTitle: "Identity confirmed",
                        type: 'verify',
                        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        date: now.toLocaleDateString(),
                        isNew: true,
                        link: '/admin/users'
                    };

                    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                    setUnreadCount(prev => prev + 1);

                    toast.success(`${data.nom || 'A user'} verified!`, {
                        description: "Account identity has been confirmed.",
                        icon: <ShieldCheck className="size-4" />,
                    });
                });

                socketRef.current = socket;
            } catch (err) {
                console.error('Socket initialization error:', err);
            }
        };

        fetchNotifications();
        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [session]);

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
            setUnreadCount(0);
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id: 'all' }),
            });
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const markAsRead = async (id: string | number) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await fetch('/api/admin/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id }),
            });
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleNotificationClick = (link: string, id: string | number) => {
        markAsRead(id);
        setIsOpen(false);
        router.push(link);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
    };

    return (
        <Dropdown
            isOpen={isOpen}
            setIsOpen={handleOpenChange}
        >
            <DropdownTrigger
                onClick={() => handleOpenChange(!isOpen)}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors group"
                aria-label="View Notifications"
            >
                <div className="relative">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform duration-300" />

                    {unreadCount > 0 && (
                        <span
                            className={cn(
                                "absolute -right-2 -top-2 z-1 size-5 rounded-full bg-[#156d95] ring-2 ring-white dark:ring-gray-800 text-[10px] flex items-center justify-center text-white font-bold animate-in zoom-in-50 duration-300",
                            )}
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </DropdownTrigger>

            <DropdownContent
                isOpen={isOpen}
                align={isMobile ? "end" : "end"}
                className="border border-gray-100 bg-white p-0 shadow-2xl dark:border-gray-800 dark:bg-gray-dark/95 backdrop-blur-xl w-[max-content] min-w-[24rem] right-0 translate-x-0 rounded-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/50 dark:bg-gray-900/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">{unreadCount} new notifications</p>
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-xs text-[#156d95] hover:text-[#1a85b5] transition-colors font-bold px-2 py-1 rounded-lg hover:bg-[#156d95]/5"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                {/* List */}
                <ul className="max-h-[28rem] overflow-y-auto custom-scrollbar p-2">
                    {notifications.length === 0 ? (
                        <div className="py-14 text-center flex flex-col items-center gap-4">
                            <div className="size-20 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
                                <Sparkles className="w-10 h-10 text-gray-200 dark:text-gray-700 animate-pulse" />
                                <div className="absolute -top-1 -right-1 size-6 rounded-full bg-[#156d95]/10 flex items-center justify-center">
                                    <Check className="size-3 text-[#156d95]" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">All caught up!</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No new notifications at the moment.</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {notifications.map((item, index) => (
                                <motion.li
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                    role="menuitem"
                                    className="mb-1 last:mb-0"
                                >
                                    <button
                                        onClick={() => handleNotificationClick(item.link, item.id)}
                                        className={cn(
                                            "w-full text-left flex items-center gap-4 rounded-xl px-3 py-3 outline-none transition-all relative group",
                                            item.isNew
                                                ? "bg-[#156d95]/5 hover:bg-[#156d95]/10 dark:bg-[#156d95]/10 dark:hover:bg-[#156d95]/20"
                                                : "hover:bg-gray-50 dark:hover:bg-white/5"
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="size-12 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-sm relative z-0">
                                                <Image
                                                    src={item.image}
                                                    className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    width={48}
                                                    height={48}
                                                    alt="User"
                                                />
                                            </div>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-gray-800 shadow-lg z-10",
                                                item.type === 'signup' ? "bg-emerald-500" : item.type === 'verify' ? "bg-blue-500" : "bg-indigo-500"
                                            )}>
                                                {item.type === 'signup' ? <UserPlus className="size-3" /> : item.type === 'verify' ? <ShieldCheck className="size-3" /> : <FileSearch className="size-3" />}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <strong className={cn(
                                                    "block text-sm font-bold truncate transition-colors",
                                                    item.isNew ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                )}>
                                                    {item.title}
                                                </strong>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                        {item.time}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <span className="block truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    {item.subTitle}
                                                </span>
                                                <span className="text-[9px] text-gray-300 dark:text-gray-600 font-medium">
                                                    {item.date}
                                                </span>
                                            </div>
                                        </div>

                                        {item.isNew && (
                                            <div className="size-1.5 rounded-full bg-[#156d95] absolute right-4 bottom-4 ring-4 ring-[#156d95]/10 animate-pulse" />
                                        )}
                                    </button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    )}
                </ul>

                {/* Footer */}
                <div className="p-3 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
                    <Link
                        href="#"
                        className="flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 py-2.5 text-center text-sm font-bold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#156d95] shadow-sm active:scale-95"
                    >
                        See all notifications
                    </Link>
                </div>
            </DropdownContent>
        </Dropdown>
    );
}
