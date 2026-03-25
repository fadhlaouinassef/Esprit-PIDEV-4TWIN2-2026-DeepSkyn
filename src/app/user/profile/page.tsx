"use client";

import React, { useEffect, useState } from "react";
import { UserLayout } from "@/app/ui/UserLayout";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Calendar,
    Shield,
    Settings,
    Award,
    Clock,
    ChevronRight,
    Camera,
    Activity,
    Droplets,
    Sparkles,
    UserCircle
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";

interface UserProfile {
    id: number;
    nom: string;
    email: string;
    image?: string;
    age?: number;
    sexe?: string;
    skin_type?: string;
    created_at: string;
    badges?: any[];
    skinAnalyses?: any[];
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large (max 5MB)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const response = await fetch('/api/user/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64String })
                });

                if (!response.ok) throw new Error('Failed to update photo');

                setProfile(prev => prev ? { ...prev, image: base64String } : null);
                toast.success("Photo updated successfully!");
            } catch (error) {
                toast.error("Error updating photo");
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch('/api/user/profile');
                if (!response.ok) throw new Error('Failed to fetch profile');
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile data');
            } finally {
                setIsLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchProfile();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status]);

    if (isLoading) {
        return (
            <UserLayout>
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="size-12 animate-spin rounded-full border-4 border-[#156d95] border-t-transparent"></div>
                </div>
            </UserLayout>
        );
    }

    if (!session) {
        return (
            <UserLayout>
                <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                    <Shield className="mb-4 size-16 text-gray-300" />
                    <h2 className="text-2xl font-bold">Please log in</h2>
                    <p className="text-gray-500">You must be authenticated to view this page.</p>
                    <Link href="/signin" className="mt-6 rounded-xl bg-[#156d95] px-8 py-3 text-white font-bold">
                        Go to Sign In
                    </Link>
                </div>
            </UserLayout>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <UserLayout userName={profile?.nom} userPhoto={profile?.image}>
            <div className="mx-auto w-full max-w-[1200px] pb-20 space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                    <span>User</span>
                    <ChevronRight size={14} />
                    <span className="text-foreground font-medium">My Profile</span>
                </nav>

                <motion.div

                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Hero Section */}
                    <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#156d95] to-[#0d4a6b] p-8 md:p-12 text-white shadow-2xl">
                        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/5 blur-3xl opacity-50"></div>
                        <div className="absolute right-20 bottom-0 size-60 rounded-full bg-blue-400/10 blur-3xl opacity-30"></div>

                        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                            <div className="relative group">
                                <input
                                    type="file"
                                    id="photo-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                />
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                                <div className="relative size-32 md:size-40 rounded-full border-4 border-white/30 overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
                                    {profile?.image ? (
                                        <Image
                                            src={profile.image}
                                            alt={profile.nom}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <User size={80} className="text-white/50" />
                                    )}
                                    <button
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Camera className="text-white" size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {profile?.skin_type || 'New User'}
                                </span>
                                <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {profile?.nom || 'User Name'}
                                </h1>
                                <p className="mt-2 text-white/70 text-lg font-medium">
                                    Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Unknown'}
                                </p>

                                <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                                    <Link href="/user/settings" className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[#156d95] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all">
                                        <Settings size={18} />
                                        Edit Profile
                                    </Link>
                                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-white font-bold backdrop-blur-md border border-white/20">
                                        <Award size={18} className="text-yellow-400" />
                                        {profile?.badges?.length || 0} Badges
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle Column: Personal Info & Stats */}
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="mb-8 text-xl font-bold flex items-center gap-3">
                                    <Activity className="text-[#156d95]" size={22} />
                                    Personal Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Mail size={12} /> Email Address
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{profile?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Age
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{profile?.age ? `${profile.age} years old` : 'Not set'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <UserCircle size={12} /> Gender
                                        </label>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{profile?.sexe || 'Not set'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Droplets size={12} /> Skin Type
                                        </label>
                                        <p className="text-lg font-bold text-[#156d95]">{profile?.skin_type || 'Not analyzed yet'}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <Sparkles className="text-[#156d95]" size={22} />
                                        Recent Skin Analyses
                                    </h3>
                                    <Link href="/user/routines" className="text-sm font-bold text-[#156d95] hover:underline flex items-center gap-1 uppercase tracking-wider">
                                        View All <ChevronRight size={14} />
                                    </Link>
                                </div>

                                {profile?.skinAnalyses && profile.skinAnalyses.length > 0 ? (
                                    <div className="space-y-4">
                                        {profile.skinAnalyses.map((scan, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-[#156d95]/10 flex items-center justify-center text-[#156d95] group-hover:bg-[#156d95] group-hover:text-white transition-all">
                                                        <Activity size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-gray-900 dark:text-white">Analysis Result: {scan.description || 'Routine Check'}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Clock size={12} /> {new Date(scan.date_creation).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-3 py-1 rounded-full bg-[#156d95]/20 text-[#156d95] text-[10px] font-black uppercase tracking-widest group-hover:bg-[#156d95] group-hover:text-white transition-all">
                                                        {scan.score ? `Score: ${scan.score}` : 'View'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
                                        <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mb-4">
                                            <Camera size={30} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No analysis performed yet.</p>
                                        <Link href="/user/questionnaire" className="mt-4 text-[#156d95] font-bold hover:underline">
                                            Start your first analysis
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Right Column: Achievements & Badges */}
                        <div className="space-y-8">
                            <motion.div variants={itemVariants} className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h3 className="mb-6 text-xl font-bold flex items-center gap-3">
                                    <Award className="text-yellow-500" size={22} />
                                    Badges
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {profile?.badges && profile.badges.length > 0 ? (
                                        profile.badges.map((badge, idx) => (
                                            <div key={idx} className="flex flex-col items-center text-center group">
                                                <div className="size-20 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 p-1 mb-2 shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                                    <div className="size-full bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
                                                        <Sparkles className="text-yellow-600" size={24} />
                                                    </div>
                                                </div>
                                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{badge.titre}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 py-6 text-center">
                                            <p className="text-sm text-gray-400 font-medium">Earn badges by completing routines and scans.</p>
                                        </div>
                                    )}
                                </div>

                                <Link href="/user/badge" className="mt-8 block text-center rounded-2xl border-2 border-[#156d95]/20 py-3 text-[#156d95] font-bold hover:bg-[#156d95]/5 transition-all uppercase text-[10px] tracking-[0.2em]">
                                    View Achievement Gallery
                                </Link>
                            </motion.div>

                            {/* Verification status / Security notice */}
                            <motion.div variants={itemVariants} className="rounded-[32px] bg-emerald-50 dark:bg-emerald-900/20 p-8 border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-start gap-4">
                                    <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                        <Shield className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Account Secured</h4>
                                        <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-500/80">
                                            Your data is protected with 128-bit encryption and DeepSkyn Privacy Protocol.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                @font-face {
                    font-family: 'Satoshi';
                    src: url('/fonts/Satoshi-Variable.woff2') format('woff2');
                }
                body {
                    font-family: 'Satoshi', sans-serif;
                }
            `}</style>
        </UserLayout>
    );
}

