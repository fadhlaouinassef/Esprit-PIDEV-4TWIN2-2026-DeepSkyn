"use client"

import React from "react"
import Image from "next/image"

export type BadgeVariant = "silver" | "gold" | "platinum" | "bronze"

interface UserBadgeCardProps {
    userPhoto: string
    userName: string
    badgeTitle: string
    description: string
    variant?: BadgeVariant
}

const VARIANT_COLORS: Record<BadgeVariant, { primary: string, secondary: string, accent: string }> = {
    silver: {
        primary: "#ffffff",
        secondary: "#9ca3af",
        accent: "#d1d5db"
    },
    gold: {
        primary: "#fde047", // yellow-300
        secondary: "#ca8a04", // yellow-600
        accent: "#fef9c3"  // yellow-100
    },
    platinum: {
        primary: "#e5e7eb",
        secondary: "#6b7280",
        accent: "#f9fafb"
    },
    bronze: {
        primary: "#fb923c", // orange-400
        secondary: "#9a3412", // orange-900
        accent: "#ffedd5"  // orange-100
    }
}

export function UserBadgeCard({
    userPhoto,
    userName,
    badgeTitle,
    description,
    variant = "silver"
}: UserBadgeCardProps) {

    // Get colors based on variant
    const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.silver;

    return (
        <div className="relative flex items-center justify-center p-10">
            {/* SVG Filter Definition */}
            <svg className="absolute w-0 h-0 overflow-hidden">
                <defs>
                    <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
                        <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                            <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                        </feOffset>

                        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
                        <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                            <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                        </feOffset>

                        <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                        <feBlend in="part1" in2="SourceGraphic" mode="color-dodge" result="combinedNoise" />

                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="combinedNoise"
                            scale="25"
                            xChannelSelector="R"
                            yChannelSelector="B"
                        />
                    </filter>
                </defs>
            </svg>

            <div className="badge-card-container">
                {/* 1. Animated Border Layer with Dynamic Gradient */}
                <div className="badge-border-wrapper">
                    <div
                        className="badge-silver-border"
                        style={{
                            background: `linear-gradient(135deg, 
                                ${colors.primary} 0%, 
                                ${colors.secondary} 25%, 
                                ${colors.accent} 50%, 
                                ${colors.secondary} 75%, 
                                ${colors.primary} 100%)`,
                            backgroundSize: '200% 200%'
                        }}
                    ></div>
                </div>

                {/* 2. Main Card Content */}
                <div className="badge-main-card">
                    <Image
                        src={userPhoto}
                        alt={userName}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                </div>

                {/* 3. Glowing Layers */}
                <div className="badge-glow-layer-1"></div>
                <div className="badge-glow-layer-2"></div>
                <div className="badge-overlay-reflect"></div>

                {/* 4. Text Content */}
                <div className="badge-content-container">
                    <div className="badge-content-top">
                        <div
                            className="badge-label-glass"
                            style={{ borderColor: `${colors.primary}33` }}
                        >
                            DeepSkyn Certified
                        </div>
                        <p
                            className="badge-title"
                            style={{
                                background: `linear-gradient(to bottom, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            {badgeTitle}
                        </p>
                    </div>

                    <hr className="badge-divider" />

                    <div className="badge-content-bottom">
                        <p className="badge-description truncate-2-lines">{description}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
