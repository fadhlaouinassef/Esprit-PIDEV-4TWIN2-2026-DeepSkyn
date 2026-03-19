
"use client";

import React, { useState } from "react";
import { User, Mail, Edit, Upload, Lock, Calendar, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    defaultValue,
    icon,
    className = "",
    readOnly = false
}: {
    label: string;
    type: string;
    name: string;
    placeholder: string;
    defaultValue: string;
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
                    defaultValue={defaultValue}
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

function TextAreaGroup({
    label,
    placeholder,
    defaultValue,
    icon
}: {
    label: string;
    placeholder: string;
    defaultValue: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="mb-6">
            <label className="mb-3 block text-[13px] font-medium text-gray-900 dark:text-white">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-5 top-5 text-gray-400">
                    {icon}
                </span>
                <textarea
                    rows={5}
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-4 pl-12 pr-5 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-[#156d95]"
                />
            </div>
        </div>
    );
}

// --- Main Components ---

export function PersonalInfoForm() {
    return (
        <ShowcaseSection title="Personal Information">
            <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        type="text"
                        name="fullName"
                        label="Full Name"
                        placeholder="Souhir"
                        defaultValue="Souhir"
                        icon={<User size={20} />}
                    />

                    <InputGroup
                        type="email"
                        name="email"
                        label="Email Address"
                        placeholder="souhir@example.com"
                        defaultValue="souhir@example.com"
                        icon={<Mail size={20} />}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        type="date"
                        name="birthDate"
                        label="Date of Birth"
                        placeholder=""
                        defaultValue="2000-01-01"
                        icon={<Calendar size={20} />}
                    />

                    <div className="mb-6">
                        <label className="mb-3 block text-[13px] font-medium text-gray-900 dark:text-white">
                            Sex (Gender)
                        </label>
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                                <UserCircle size={20} />
                            </span>
                            <select
                                name="gender"
                                defaultValue="Male"
                                className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 py-4 pl-12 pr-5 text-[15px] font-medium text-gray-900 outline-none transition-all focus:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-[#156d95]"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        type="text"
                        name="username"
                        label="Username"
                        placeholder="souhir_dev"
                        defaultValue="souhir_dev"
                        icon={<User size={20} />}
                    />
                    <div />
                </div>

                <TextAreaGroup
                    label="BIO"
                    placeholder="Write your bio here"
                    icon={<Edit size={20} />}
                    defaultValue="Passionate deep sky enthusiast and software developer. Currently exploring the limits of AI and web technology."
                />

                <div className="flex justify-end gap-3">
                    <button
                        className="rounded-xl border border-gray-200 px-8 py-3.5 text-[15px] font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 transition-all"
                        type="button"
                    >
                        Reset
                    </button>
                    <button
                        className="rounded-xl bg-[#156d95] px-8 py-3.5 text-[15px] font-bold text-white hover:shadow-lg hover:bg-opacity-95 transition-all"
                        type="submit"
                    >
                        Update Profile
                    </button>
                </div>
            </form>
        </ShowcaseSection>
    );
}

export function SecurityForm() {
    return (
        <ShowcaseSection title="Security & Password" className="mt-8">
            <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup
                        type="password"
                        name="currentPassword"
                        label="Current Password"
                        placeholder="••••••••"
                        defaultValue=""
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
                        defaultValue=""
                        icon={<Lock size={20} />}
                    />
                    <InputGroup
                        type="password"
                        name="confirmNewPassword"
                        label="Confirm New Password"
                        placeholder="••••••••"
                        defaultValue=""
                        icon={<Lock size={20} />}
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <button
                        className="rounded-xl bg-[#156d95] px-8 py-3.5 text-[15px] font-bold text-white hover:shadow-lg hover:bg-opacity-95 transition-all"
                        type="submit"
                    >
                        Change Password
                    </button>
                </div>
            </form>
        </ShowcaseSection>
    );
}

export function UploadPhotoForm() {
    return (
        <ShowcaseSection title="Your Photo">
            <form className="flex h-full flex-col">
                <div className="mb-7 flex items-center gap-4">
                    <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                        <User size={34} className="text-gray-400" />
                    </div>

                    <div>
                        <span className="mb-2 block text-lg font-bold text-gray-900 dark:text-white">
                            Edit your photo
                        </span>
                        <div className="flex gap-4">
                            <button type="button" className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
                                Delete
                            </button>
                            <button type="button" className="text-sm font-medium text-[#156d95] hover:underline transition-colors">
                                Update
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative mb-7 block w-full rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30 hover:border-[#156d95] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-[#156d95] transition-all">
                    <input
                        type="file"
                        name="profilePhoto"
                        id="profilePhoto"
                        accept="image/png, image/jpg, image/jpeg"
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />

                    <label
                        htmlFor="profilePhoto"
                        className="flex cursor-pointer flex-col items-center justify-center p-6 py-10"
                    >
                        <div className="flex size-14 items-center justify-center rounded-full border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 mb-4 shadow-sm">
                            <Upload size={24} className="text-[#156d95]" />
                        </div>

                        <p className="mb-2 text-base font-medium text-gray-900 dark:text-white">
                            <span className="text-[#156d95]">Click to upload</span> or drag and drop
                        </p>

                        <p className="text-sm text-gray-400">
                            SVG, PNG, JPG or GIF (max, 800 X 800px)
                        </p>
                    </label>
                </div>

                <div className="mt-auto flex justify-end gap-3 pt-6">
                    <button
                        className="rounded-xl border border-gray-200 px-8 py-3.5 text-[15px] font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900 transition-all"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        className="rounded-xl bg-[#156d95] px-8 py-3.5 text-[15px] font-bold text-white hover:shadow-lg hover:bg-opacity-95 transition-all"
                        type="submit"
                    >
                        Save Photo
                    </button>
                </div>
            </form>
        </ShowcaseSection>
    );
}

export default function Profile() {
    return (
        <div className="mx-auto w-full max-w-[1200px] mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                <div className="lg:col-span-3 flex flex-col gap-8">
                    <PersonalInfoForm />
                    <SecurityForm />
                </div>
                <div className="lg:col-span-2">
                    <UploadPhotoForm />
                </div>
            </div>
        </div>
    );
}
