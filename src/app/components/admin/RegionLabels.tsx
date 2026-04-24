
"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const Map = dynamic(() => import("./map"), { ssr: false });

type CountryMetric = {
    country: string;
    users: number;
    logins?: number;
};

const labelTone = (value: number, max: number): string => {
    if (max <= 0) return "bg-gray-100 text-gray-600";
    const ratio = value / max;
    if (ratio >= 0.75) return "bg-[#0d4a6b] text-white";
    if (ratio >= 0.45) return "bg-[#156d95] text-white";
    if (ratio >= 0.2) return "bg-[#5aa4c7] text-white";
    return "bg-[#d8edf6] text-[#0d4a6b]";
};

export function RegionLabels({ data }: { data?: CountryMetric[] }) {
    const t = useTranslations();
    const countries = Array.isArray(data) ? data.filter((item) => item.country !== "Unknown") : [];
    const maxUsers = countries.reduce((max, item) => Math.max(max, Number(item.users || 0)), 0);
    const topLabels = countries.slice(0, 8);

    return (
        <div className="w-full">
            <h2 className="mb-7 text-xl font-bold text-gray-900 dark:text-white">
                {t('components.regionLabels.title')}
            </h2>

            <Map countries={countries} />

            <div className="mt-6 flex flex-wrap gap-2">
                {topLabels.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">No country data yet</span>
                ) : (
                    topLabels.map((item) => (
                        <span
                            key={item.country}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${labelTone(item.users, maxUsers)}`}
                        >
                            {item.country}: {item.users}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}


