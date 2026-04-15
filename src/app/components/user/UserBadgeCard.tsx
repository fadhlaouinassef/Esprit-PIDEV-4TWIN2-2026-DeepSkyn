"use client"

import React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"

export type BadgeVariant = "silver" | "gold" | "platinum" | "platinium" | "bronze" | "ruby"

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
        primary: "#fde047",
        secondary: "#ca8a04",
        accent: "#fef9c3"
    },
    platinum: {
        primary: "#7dd3fc",
        secondary: "#0ea5e9",
        accent: "#e0f2fe"
    },
    platinium: {
        primary: "#7dd3fc",
        secondary: "#0ea5e9",
        accent: "#e0f2fe"
    },
    bronze: {
        primary: "#fb923c", // orange-400
        secondary: "#9a3412", // orange-900
        accent: "#ffedd5"  // orange-100
    },
    ruby: {
        primary: "#fca5a5", // red-300
        secondary: "#b91c1c", // red-700
        accent: "#fee2e2"  // red-100
    }
}

export function UserBadgeCard({
    userPhoto,
    userName,
    badgeTitle,
    description,
    variant = "silver"
}: UserBadgeCardProps) {
    const t = useTranslations();

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

                        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
                        <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                            <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                        </feOffset>

                        <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
                        <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                            <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                        </feOffset>

                        <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                        <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                        <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="combinedNoise"
                            scale="30"
                            xChannelSelector="R"
                            yChannelSelector="B"
                        />
                    </filter>
                </defs>
            </svg>

            <div className="badge-card-container">
                <div className="badge-inner-container">
                    {/* Distorted Border Layer - ONLY this part is distorted */}
                    <div className="badge-electric-border-wrapper">
                        <div
                            className="badge-electric-border-glow"
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

                    {/* Clean Card Content - Filter NOT applied here */}
                    <div className="badge-main-card-clean">
                        <div className="badge-image-wrapper">
                            <Image
                                src={userPhoto}
                                alt={userName}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                        </div>
                    </div>

                    <div className="badge-glow-layer-1"></div>
                    <div className="badge-glow-layer-2"></div>
                </div>

                <div className="badge-overlay-1"></div>
                <div className="badge-overlay-2"></div>
                <div className="badge-background-glow"></div>

                <div className="badge-content-container">
                    <div className="badge-content-top">
                        <div
                            className="badge-label-glass"
                            style={{ borderColor: `${colors.primary}33` }}
                        >
                            {t('components.userBadgeCard.certifiedLabel')}
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
