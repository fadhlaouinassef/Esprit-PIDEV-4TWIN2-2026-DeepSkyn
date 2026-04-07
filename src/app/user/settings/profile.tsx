
"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Edit, Upload, Lock, Calendar, UserCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "@/store/slices/authSlice";
import { AudioToggleButton } from "@/app/components/user/AudioToggleButton";

// --- Internal Helper Components ---

function ShowcaseSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 h-full", className)}>
            <div className="border-b border-gray-100 px-7 py-5 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="p-7">
                {children}
            </div>
        </div>
    );
}

function InputGroup({
    label,
    type,
    name,
    placeholder,
    value,
    onChange,
    icon,
    className = "",
    readOnly = false
}: {
    label: string;
    type: string;
    name: string;
    placeholder: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode;
    className?: string;
    readOnly?: boolean;
}) {
    return (
        <div className={cn("mb-6", className)}>
            <label className="mb-3 block text-[13px] font-medium text-gray-900 dark:text-white">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </span>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    className={cn(
                        "w-full rounded-xl border border-gray-100 bg-gray-50/50 py-4 pl-12 pr-5 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-[#156d95]",
                        readOnly && "bg-gray-100 cursor-not-allowed opacity-70"
                    )}
                />
            </div>
        </div>
    );
}

// --- Main Components ---

export default function Profile() {
    const { data: session, status, update } = useSession();
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isSavedPassword, setIsSavedPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<string | null>(null);
    const [autoSpeech, setAutoSpeech] = useState(false);

    const [formValues, setFormValues] = useState({
        nom: "",
        prenom: "",
        email: "",
        age: "",
        sexe: "Male",
    });

    const [hasPassword, setHasPassword] = useState<boolean | null>(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    const [userPhoto, setUserPhoto] = useState<string | null>(null);

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
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user/profile');
                if (response.ok) {
                    const data = await response.json();
                    setFormValues({
                        nom: data.nom || "",
                        prenom: data.prenom || "",
                        email: data.email || "",
                        age: data.age?.toString() || "",
                        sexe: data.sexe || "Male",
                    });
                    setUserPhoto(data.image || null);
                    setHasPassword(data.hasPassword === true);

                    // Sync Redux with fresh DB data
                    dispatch(updateUserProfile({
                        nom: data.nom,
                        prenom: data.prenom,
                        photo: data.image,
                        role: data.role,
                        age: data.age,
                        sexe: data.sexe,
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchUserData();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (autoSpeech && !isLoading) {
            let fullText = "Account settings interface. ";
            fullText += `Personal information section for ${formValues.prenom || "user"} ${formValues.nom || ""}. `;

            if (formValues.email) {
                fullText += `Email is ${formValues.email}. `;
            }

            if (formValues.age) {
                fullText += `Age is ${formValues.age}. `;
            }

            fullText += `Gender is ${formValues.sexe || "not specified"}. `;

            if (hasPassword === true) {
                fullText += "Security and password section is available to update your password. ";
            } else {
                fullText += "Security password section is not available for this account. ";
            }

            fullText += userPhoto
                ? "Profile photo is set and can be updated from the photo panel. "
                : "No profile photo yet. You can upload one from the photo panel. ";

            const id = `settings-${formValues.nom}-${formValues.prenom}-${formValues.email}-${formValues.age}-${formValues.sexe}-${hasPassword}-${Boolean(userPhoto)}`;
            if (speakingIndex !== id) {
                speakContent(fullText, id);
            }
        }
    }, [
        autoSpeech,
        isLoading,
        formValues.nom,
        formValues.prenom,
        formValues.email,
        formValues.age,
        formValues.sexe,
        hasPassword,
        userPhoto,
    ]);

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setIsSaved(false);
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nom: formValues.nom,
                    prenom: formValues.prenom,
                    age: formValues.age,
                    sexe: formValues.sexe
                })
            });

            if (!response.ok) throw new Error('Failed to update profile');

            // Update session
            update({ name: `${formValues.prenom} ${formValues.nom}`.trim() });
            
            // Update Redux - parse age safely
            const ageParsed = formValues.age ? parseInt(formValues.age) : undefined;
            dispatch(updateUserProfile({
                nom: formValues.nom,
                prenom: formValues.prenom,
                age: isNaN(Number(ageParsed)) ? undefined : Number(ageParsed),
                sexe: formValues.sexe
            }));

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsSavingPassword(true);
        setIsSavedPassword(false);
        try {
            const response = await fetch('/api/user/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to change password');

            setIsSavedPassword(true);
            setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
            setTimeout(() => setIsSavedPassword(false), 3000);
        } catch (error: any) {
            toast.error(error.message || "Error changing password");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large (max 5MB)");
            return;
        }

        setIsUploading(true);
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

                setUserPhoto(base64String);
                update({ image: base64String });
                // Update Redux
                dispatch(updateUserProfile({ photo: base64String }));
            } catch (error) {
                toast.error("Error updating photo");
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="size-12 animate-spin text-[#156d95]" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-[1200px] mb-12">
            <div className="flex justify-end mb-4">
                <AudioToggleButton
                    enabled={autoSpeech}
                    onToggle={() => {
                        if (autoSpeech) stopSpeaking();
                        setAutoSpeech(!autoSpeech);
                    }}
                    label="Audio Settings"
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                {/* Left Column: Forms */}
                <div className="lg:col-span-3 flex flex-col gap-8">
                    {/* Personal Information Form */}
                    <ShowcaseSection title="Personal Information">
                        <form onSubmit={handleUpdateProfile}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup
                                    type="text"
                                    name="nom"
                                    label="Last Name"
                                    placeholder="Nom"
                                    value={formValues.nom}
                                    onChange={handleFormChange}
                                    icon={<User size={20} />}
                                />
                                <InputGroup
                                    type="text"
                                    name="prenom"
                                    label="First Name"
                                    placeholder="Prenom"
                                    value={formValues.prenom}
                                    onChange={handleFormChange}
                                    icon={<User size={20} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup
                                    type="email"
                                    name="email"
                                    label="Email Address"
                                    placeholder="email@example.com"
                                    value={formValues.email}
                                    readOnly={true}
                                    icon={<Mail size={20} />}
                                />
                                <InputGroup
                                    type="number"
                                    name="age"
                                    label="Age"
                                    placeholder="Age"
                                    value={formValues.age}
                                    onChange={handleFormChange}
                                    icon={<Calendar size={20} />}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="mb-6">
                                    <label className="mb-3 block text-[13px] font-medium text-gray-900 dark:text-white">
                                        Sex (Gender)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                                            <UserCircle size={20} />
                                        </span>
                                        <select
                                            name="sexe"
                                            value={formValues.sexe}
                                            onChange={handleFormChange}
                                            className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 py-4 pl-12 pr-5 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-[#156d95]"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    className={cn(
                                        "rounded-xl px-8 py-3.5 text-[15px] font-bold text-white transition-all flex items-center gap-2",
                                        isSaved ? "bg-emerald-500" : "bg-[#156d95] hover:shadow-lg hover:bg-opacity-95"
                                    )}
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : isSaved ? (
                                        <>
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Saved!
                                        </>
                                    ) : (
                                        "Update Profile"
                                    )}
                                </button>
                            </div>
                        </form>
                    </ShowcaseSection>

                    {/* Security & Password Form - Only show for Credentials users */}
                    {hasPassword === true && (
                        <ShowcaseSection title="Security & Password">
                            <form onSubmit={handleChangePassword}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup
                                        type="password"
                                        name="currentPassword"
                                        label="Current Password"
                                        placeholder="••••••••"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        icon={<Lock size={20} />}
                                    />
                                    <div />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup
                                        type="password"
                                        name="newPassword"
                                        label="New Password"
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        icon={<Lock size={20} />}
                                    />
                                    <InputGroup
                                        type="password"
                                        name="confirmNewPassword"
                                        label="Confirm New Password"
                                        placeholder="••••••••"
                                        value={passwordData.confirmNewPassword}
                                        onChange={handlePasswordChange}
                                        icon={<Lock size={20} />}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        className={cn(
                                            "rounded-xl px-8 py-3.5 text-[15px] font-bold text-white transition-all flex items-center gap-2",
                                            isSavedPassword ? "bg-emerald-500" : "bg-[#156d95] hover:shadow-lg hover:bg-opacity-95"
                                        )}
                                        type="submit"
                                        disabled={isSavingPassword}
                                    >
                                        {isSavingPassword ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : isSavedPassword ? (
                                            <>
                                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Saved!
                                            </>
                                        ) : (
                                            "Change Password"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </ShowcaseSection>
                    )}
                </div>

                {/* Right Column: Photo Upload */}
                <div className="lg:col-span-2">
                    <ShowcaseSection title="Your Photo">
                        <div className="flex h-full flex-col">
                            <div className="mb-7 flex items-center gap-4">
                                <div className="relative size-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-[#156d95]/20 dark:bg-gray-700 dark:border-gray-600">
                                    {userPhoto ? (
                                        <Image src={userPhoto} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <User size={34} className="text-gray-400" />
                                    )}
                                </div>

                                <div>
                                    <span className="mb-2 block text-lg font-bold text-gray-900 dark:text-white">
                                        Profile Avatar
                                    </span>
                                    <p className="text-sm text-gray-500">
                                        Update your personal photo
                                    </p>
                                </div>
                            </div>

                            <div className="relative mb-7 block w-full rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30 hover:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-[#156d95] transition-all">
                                <input
                                    type="file"
                                    name="profilePhoto"
                                    id="profilePhoto"
                                    accept="image/png, image/jpg, image/jpeg"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={handlePhotoUpload}
                                    disabled={isUploading}
                                />

                                <div className="flex cursor-pointer flex-col items-center justify-center p-6 py-10">
                                    <div className="flex size-14 items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 mb-4 shadow-sm">
                                        {isUploading ? (
                                            <Loader2 size={24} className="text-[#156d95] animate-spin" />
                                        ) : (
                                            <Upload size={24} className="text-[#156d95]" />
                                        )}
                                    </div>

                                    <p className="mb-2 text-base font-medium text-gray-900 dark:text-white text-center">
                                        <span className="text-[#156d95]">Click to upload</span> or drag and drop
                                    </p>

                                    <p className="text-sm text-gray-400 text-center">
                                        PNG, JPG (max 5MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ShowcaseSection>
                </div>
            </div>
        </div>
    );
}
