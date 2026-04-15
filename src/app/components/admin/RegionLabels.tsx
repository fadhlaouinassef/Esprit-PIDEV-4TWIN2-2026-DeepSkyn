
"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const Map = dynamic(() => import("./map"), { ssr: false });

export function RegionLabels({ data }: { data: any }) {
    const t = useTranslations();

    return (
        <div className="w-full">
            <h2 className="mb-7 text-xl font-bold text-gray-900 dark:text-white">
                {t('components.regionLabels.title')}
            </h2>

            <Map />
        </div>
    );
}


