
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    Calendar,
    Shield,
    Settings,
    ChevronRight,
    Camera,
    Activity,
    UserCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "@/store/slices/authSlice";

interface AdminProfile {
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

export default function Profile() {
    const dispatch = useDispatch();
    const [profile, setProfile] = useState<AdminProfile | null>(null);
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
                const response = await fetch("/api/user/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64String }),
                });

                if (!response.ok) throw new Error("Failed to update photo");

                setProfile((prev) => (prev ? { ...prev, image: base64String } : null));
                dispatch(updateUserProfile({ photo: base64String }));
                toast.success("Photo updated successfully!");
            } catch {
                toast.error("Error updating photo");
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/user/profile");
                if (!response.ok) throw new Error("Failed to fetch profile");
                const data = await response.json();
                setProfile(data);
                dispatch(
                    updateUserProfile({
                        nom: data.nom,
                        prenom: data.prenom,
                        photo: data.image,
                        role: data.role,
                        age: data.age,
                        sexe: data.sexe,
                        skin_type: data.skin_type,
                    })
                );
            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Error loading profile data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="size-12 animate-spin rounded-full border-4 border-[#156d95] border-t-transparent"></div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="mx-auto w-full max-w-[1200px] pb-20 space-y-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <span>Admin</span>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">My Profile</span>
            </nav>

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                <motion.div
                    variants={itemVariants}
                    className="hc-keep-gradient relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#156d95] to-[#0d4a6b] p-8 md:p-12 text-white shadow-2xl"
                >
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
                                    <Image src={profile.image} alt={profile.nom} fill className="object-cover" />
                                ) : (
                                    <User size={80} className="text-white/50" />
                                )}
                                <button
                                    onClick={() => document.getElementById("photo-upload")?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Camera className="text-white" size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                {profile?.nom || "Admin User"}
                            </h1>
                            <p className="mt-2 text-white/70 text-lg font-medium">
                                Member since{" "}
                                {profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                                          month: "long",
                                          year: "numeric",
                                      })
                                    : "Unknown"}
                            </p>

                            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                                <Link
                                    href="/admin/settings"
                                    className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[#156d95] font-bold shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    <Settings size={18} />
                                    Edit Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{profile?.age ? `${profile.age} years old` : "Not set"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <UserCircle size={12} /> Gender
                                    </label>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{profile?.sexe || "Not set"}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        <motion.div variants={itemVariants} className="rounded-[32px] bg-emerald-50 dark:bg-emerald-900/20 p-8 border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-start gap-4">
                                <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                    <Shield className="text-white" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Admin Account Secured</h4>
                                    <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-500/80">
                                        Your administrative session is protected and monitored by DeepSkyn security policies.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
