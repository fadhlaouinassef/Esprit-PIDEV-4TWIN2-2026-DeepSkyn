
"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

function Breadcrumb({ pageName }: { pageName: string }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {pageName}
            </h2>
            <nav>
                <ol className="flex items-center gap-2 text-sm font-medium">
                    <li>
                        <a className="text-gray-500 hover:text-primary transition-colors" href="/admin">
                            Dashboard /
                        </a>
                    </li>
                    <li className="text-primary">{pageName}</li>
                </ol>
            </nav>
        </div>
    );
}

function SocialAccounts() {
    const socials = [
        { icon: <Facebook size={20} />, link: "#", label: "Facebook" },
        { icon: <Twitter size={20} />, link: "#", label: "Twitter" },
        { icon: <Instagram size={20} />, link: "#", label: "Instagram" },
        { icon: <Linkedin size={20} />, link: "#", label: "LinkedIn" },
        { icon: <Github size={20} />, link: "#", label: "GitHub" },
    ];

    return (
        <div className="mt-8 flex items-center justify-center gap-4">
            {socials.map((social, index) => (
                <a
                    key={index}
                    href={social.link}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-gray-700 dark:text-gray-400 dark:hover:text-white transition-all"
                    aria-label={social.label}
                >
                    {social.icon}
                </a>
            ))}
        </div>
    );
}

export default function Profile() {
    const [data, setData] = useState({
        name: "Nassef Fadhlaoui",
        role: "Full Stack Developer",
        profilePhoto: "/avatar.png",
        coverPhoto: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === "profilePhoto" || e.target.name === "coverPhoto") {
            const file = e.target.files?.[0];
            if (file) {
                setData({
                    ...data,
                    [e.target.name]: URL.createObjectURL(file),
                });
            }
        } else {
            setData({
                ...data,
                [e.target.name]: e.target.value,
            });
        }
    };

    return (
        <div className="mx-auto w-full max-w-[970px]">
            <Breadcrumb pageName="Profile" />

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {/* Cover Photo */}
                <div className="relative z-20 h-48 md:h-64">
                    <Image
                        src={data?.coverPhoto}
                        alt="profile cover"
                        className="h-full w-full object-cover object-center"
                        width={970}
                        height={260}
                    />
                    <div className="absolute bottom-4 right-4 z-10">
                        <label
                            htmlFor="coverPhoto"
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#156d95] px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 shadow-lg transition-all"
                        >
                            <input
                                type="file"
                                name="coverPhoto"
                                id="coverPhoto"
                                className="sr-only"
                                onChange={handleChange}
                                accept="image/png, image/jpg, image/jpeg"
                            />
                            <Camera size={18} />
                            <span>Edit Cover</span>
                        </label>
                    </div>
                </div>

                {/* Profile Info Section */}
                <div className="px-6 pb-10 text-center lg:pb-12">
                    {/* Profile Photo */}
                    <div className="relative z-30 mx-auto -mt-20 h-32 w-32 rounded-full bg-white p-1.5 shadow-xl dark:bg-gray-800 sm:-mt-24 sm:h-44 sm:w-44">
                        <div className="relative h-full w-full overflow-hidden rounded-full">
                            <Image
                                src={data?.profilePhoto}
                                fill
                                className="object-cover"
                                alt="profile"
                            />

                            <label
                                htmlFor="profilePhoto"
                                className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#156d95] text-white hover:scale-110 shadow-lg transition-all ring-4 ring-white dark:ring-gray-800"
                            >
                                <Camera size={18} />
                                <input
                                    type="file"
                                    name="profilePhoto"
                                    id="profilePhoto"
                                    className="sr-only"
                                    onChange={handleChange}
                                    accept="image/png, image/jpg, image/jpeg"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                            {data?.name}
                        </h3>
                        <p className="font-medium text-gray-600 dark:text-gray-400">{data?.role}</p>

                        <div className="mx-auto mb-7 mt-6 grid max-w-[400px] grid-cols-3 rounded-xl border border-gray-100 bg-gray-50 py-3 dark:border-gray-700 dark:bg-gray-900/50">
                            <div className="flex flex-col items-center justify-center gap-1 border-r border-gray-100 dark:border-gray-700 px-4">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    259
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Posts</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1 border-r border-gray-100 dark:border-gray-700 px-4">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    129K
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Followers</span>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-1 px-4">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    2K
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Following</span>
                            </div>
                        </div>

                        <div className="mx-auto max-w-[720px] px-4">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                About Me
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                Pellentesque posuere fermentum urna, eu condimentum mauris
                                tempus ut. Donec fermentum blandit aliquet. Etiam dictum dapibus
                                ultricies. Sed vel aliquet libero. Nunc a augue fermentum,
                                pharetra ligula sed, aliquam lacus.
                            </p>
                        </div>

                        <SocialAccounts />
                    </div>
                </div>
            </div>
        </div>
    );
}
