"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";
import { Dropdown, DropdownContent, DropdownTrigger } from "./dropdown";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearUser } from "@/store/slices/authSlice";
import { signOut } from "next-auth/react";

const AUTH_MODE_KEY = 'deepskyn_auth_mode';

interface UserInfoProps {
    name?: string;
    photo?: string;
}

export function UserInfo({ name: propName, photo: propPhoto }: UserInfoProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    // Use Redux state if available, otherwise fallback to props or defaults
    const name = user?.nom || propName || "User Name";
    const photo = user?.photo || propPhoto || "/avatar.png";

    const handleNavigation = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    const handleLogout = async () => {
        setIsOpen(false);
        dispatch(clearUser());
        localStorage.removeItem(AUTH_MODE_KEY);
        await signOut({ redirect: false });
        window.location.href = "/";
    };

    return (
        <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
            <DropdownTrigger
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-lg align-middle outline-none transition-all hover:bg-gray-100 dark:hover:bg-gray-800 p-1 cursor-pointer"
            >
                <span className="sr-only">My Account</span>

                <figure className="flex items-center gap-3">
                    <div className="size-11 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                        <Image
                            src={photo}
                            className="h-full w-full object-cover"
                            alt={`Avatar of ${name}`}
                            width={44}
                            height={44}
                        />
                    </div>
                    <figcaption className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white max-[1024px]:hidden">
                        <span>{name}</span>

                        <ChevronUp
                            className={cn(
                                "w-4 h-4 text-gray-400 transition-transform rotate-180",
                                isOpen && "rotate-0",
                            )}
                            strokeWidth={2}
                        />
                    </figcaption>
                </figure>
            </DropdownTrigger>

            <DropdownContent
                isOpen={isOpen}
                className="border border-gray-100 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 min-w-[280px] mt-2"
                align="end"
            >
                <h2 className="sr-only">User information</h2>

                <figure className="flex items-center gap-3.5 px-5 py-4">
                    <div className="size-12 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                        <Image
                            src={photo}
                            className="h-full w-full object-cover"
                            alt={`Avatar for ${name}`}
                            width={48}
                            height={48}
                        />
                    </div>

                    <figcaption className="flex flex-col">
                        <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                            {name}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            User Account
                        </span>
                    </figcaption>
                </figure>

                <hr className="border-gray-100 dark:border-gray-700" />

                <div className="p-2">
                    <button
                        onClick={() => handleNavigation("/user/profile")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <User className="w-4 h-4" />
                        <span>View profile</span>
                    </button>

                    <button
                        onClick={() => handleNavigation("/user/settings")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white transition-all cursor-pointer"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                    </button>
                </div>

                <hr className="border-gray-100 dark:border-gray-700" />

                <div className="p-2">
                    <button
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                    </button>
                </div>
            </DropdownContent>
        </Dropdown>
    );
}
