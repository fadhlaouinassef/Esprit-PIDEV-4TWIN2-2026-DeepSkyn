
"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./map"), { ssr: false });

export function RegionLabels({ data }: { data: any }) {
    return (
        <div className="w-full">
            <h2 className="mb-7 text-xl font-bold text-gray-900 dark:text-white">
                Region labels
            </h2>

            <Map />
        </div>
    );
}


