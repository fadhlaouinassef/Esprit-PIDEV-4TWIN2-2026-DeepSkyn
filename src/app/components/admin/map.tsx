
"use client";

import React, { useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup
} from "react-simple-maps";

// World Map TopoJSON URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryMetric = {
    country: string;
    users: number;
    logins?: number;
};

type MapProps = {
    countries?: CountryMetric[];
};

const normalizeCountry = (value: string): string => {
    const input = value.trim().toLowerCase();
    const aliases: Record<string, string> = {
        "united states": "united states of america",
        "usa": "united states of america",
        "us": "united states of america",
        "russia": "russian federation",
    };
    return aliases[input] || input;
};

const getCountryName = (geo: any): string => {
    return String(
        geo?.properties?.name ||
        geo?.properties?.NAME ||
        geo?.properties?.admin ||
        ""
    );
};

const getCountryFill = (count: number, maxCount: number): string => {
    if (count <= 0 || maxCount <= 0) return "#D6D6DA";

    const ratio = Math.min(1, count / maxCount);
    const light = [173, 216, 255];
    const dark = [21, 109, 149];

    const channel = (from: number, to: number) => Math.round(from + (to - from) * ratio);
    const r = channel(light[0], dark[0]);
    const g = channel(light[1], dark[1]);
    const b = channel(light[2], dark[2]);
    return `rgb(${r}, ${g}, ${b})`;
};

export default function VisitorsMap({ countries = [] }: MapProps = {}) {
    const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

    const countByCountry = new Map<string, number>();
    countries.forEach((item) => {
        if (!item.country) return;
        countByCountry.set(normalizeCountry(item.country), Number(item.users || 0));
    });

    const maxUsers = countries.reduce((max, item) => Math.max(max, Number(item.users || 0)), 0);

    function handleZoomIn() {
        if (position.zoom >= 4) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
    }

    function handleZoomOut() {
        if (position.zoom <= 1) return;
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
    }

    function handleMoveEnd(nextPosition: { coordinates: [number, number]; zoom: number }) {
        setPosition(nextPosition);
    }

    return (
        <div className="w-full h-[400px] relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <ComposableMap
                projectionConfig={{
                    rotate: [-10, 0, 0],
                    scale: 147
                }}
                width={800}
                height={400}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates as [number, number]}
                    onMoveEnd={handleMoveEnd}
                >
                    <Geographies geography={geoUrl}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo) => (
                                (() => {
                                    const countryName = getCountryName(geo);
                                    const users = countByCountry.get(normalizeCountry(countryName)) || 0;
                                    const fill = getCountryFill(users, maxUsers);

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={fill}
                                            stroke="#FFFFFF"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { fill, outline: "none" },
                                                hover: { fill: "#156d95", outline: "none" },
                                                pressed: { fill: "#0d4a6b", outline: "none" }
                                            }}
                                        />
                                    );
                                })()
                            ))
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-700 shadow-md rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Zoom in"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <button
                    onClick={handleZoomOut}
                    className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-700 shadow-md rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Zoom out"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
            </div>

            {/* Region Legend Placeholder (like labels in screenshot) */}
            <div className="absolute top-4 left-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-gray-100 dark:border-gray-700 pointer-events-none">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Regions</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Darker = More Users</span>
                </div>
            </div>
        </div>
    );
}
