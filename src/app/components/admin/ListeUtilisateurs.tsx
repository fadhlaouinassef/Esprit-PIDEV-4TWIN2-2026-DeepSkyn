"use client";

import React from "react";
import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { compactFormat, standardFormat } from "@/lib/format-number";

interface User {
    name: string;
    visitors: number;
    revenues: number;
    sales: number;
    conversion: number;
    logo: string;
}

interface ListeUtilisateursProps {
    users: User[];
}

export function ListeUtilisateurs({ users }: ListeUtilisateursProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Active Users</h3>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Name</th>
                            <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Visitors</th>
                            <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Revenues</th>
                            <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Sales</th>
                            <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Conversion</th>
                            <th className="py-4 px-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, i) => (
                            <tr
                                key={user.name + i}
                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-900/50 transition-colors"
                            >
                                <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <Image
                                                src={user.logo}
                                                width={36}
                                                height={36}
                                                alt={user.name}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {user.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center font-medium text-gray-900 dark:text-white">
                                    {compactFormat(user.visitors)}
                                </td>
                                <td className="py-4 px-4 text-center font-medium text-green-600 dark:text-green-400">
                                    ${standardFormat(user.revenues)}
                                </td>
                                <td className="py-4 px-4 text-center font-medium text-gray-900 dark:text-white">
                                    {user.sales}
                                </td>
                                <td className="py-4 px-4 text-center font-medium text-gray-900 dark:text-white">
                                    {user.conversion}%
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
