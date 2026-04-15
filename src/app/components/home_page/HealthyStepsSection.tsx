"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

const stepsData = [
  {
    id: "quiz",
    score: 20,
  },
  {
    id: "analysis",
    score: 45,
  },
  {
    id: "advice",
    score: 65,
  },
  {
    id: "routine",
    score: 80,
  },
  {
    id: "progress",
    score: 92,
  },
]

export default function HealthyStepsSection() {
  const t = useTranslations()
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const current = activeStep !== null ? stepsData[activeStep] : null
  const currentPreviewTitle = current
    ? t(`home.healthySteps.steps.${current.id}.previewTitle`)
    : t("home.healthySteps.preview.defaultTitle")
  const currentPreviewText = current
    ? t(`home.healthySteps.steps.${current.id}.previewText`)
    : t("home.healthySteps.preview.defaultText")

  return (
    <section
      id="healthy-steps"
      className="py-32 bg-gradient-to-br from-[#f7f5ff] to-[#fdfbff]"
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">

        {/* LEFT SIDE (UNCHANGED) */}
        <div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#3b3572] leading-tight">
            {t("home.healthySteps.title")}
          </h2>

          <div className="mt-12 space-y-8">
            {stepsData.map((step, index) => (
              <div
                key={index}
                onMouseEnter={() => setActiveStep(index)}
                onMouseLeave={() => setActiveStep(null)}
                className="group cursor-pointer transition-all duration-300"
              >
                <div className="flex items-start gap-6">
                  <div className="w-1 h-14 bg-[#3b3572] rounded-full group-hover:h-20 transition-all duration-300"></div>

                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      <span className="text-[#3b3572]">
                        {index + 1} -
                      </span>{" "}
                      {t(`home.healthySteps.steps.${step.id}.title`)}
                    </p>

                    <p className="text-gray-600 text-sm mt-2 opacity-0 max-h-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-h-40">
                      {t(`home.healthySteps.steps.${step.id}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* RIGHT SIDE */}
        <div className="relative flex justify-center items-center mt-16 lg:mt-0 py-6 lg:py-0">
          <div className="relative w-full max-w-[440px] h-[440px] sm:h-[480px] flex items-center justify-center overflow-hidden">

            {/* Subtle base panel so glows feel contained */}
            <div className="absolute inset-0 rounded-[40px] bg-white/45 border border-white/70 shadow-[0_12px_60px_rgba(59,53,114,0.06)]" />

            {/* Ambient gradient field */}
            <div
              className="absolute inset-0 rounded-[40px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(900px 520px at 20% 18%, rgba(59,53,114,0.18) 0%, transparent 55%), radial-gradient(720px 520px at 78% 70%, rgba(124,58,237,0.16) 0%, transparent 58%), radial-gradient(620px 420px at 55% 35%, rgba(236,72,153,0.10) 0%, transparent 60%)",
              }}
            />

            {/* Subtle dot-grid texture (no images) */}
            <div
              className="absolute inset-0 rounded-[40px] opacity-60 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(59,53,114,0.16) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                maskImage:
                  "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 72%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 72%)",
              }}
            />

            {/* Floating glow orbs */}
            <motion.div
              className="absolute -top-28 -left-28 w-80 h-80 rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(59,53,114,0.35) 0%, rgba(59,53,114,0.0) 60%)",
              }}
              animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute -bottom-32 -right-28 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(124,58,237,0.0) 62%)",
              }}
              animate={{ x: [0, -14, 0], y: [0, 10, 0], scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute top-1/3 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(236,72,153,0.0) 65%)",
              }}
              animate={{ x: [0, -10, 0], y: [0, -6, 0], opacity: [0.75, 0.9, 0.75] }}
              transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
            />

            {/* CARD (main focal point) */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 w-[360px] max-w-[92%] bg-white/90 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_30px_90px_rgba(59,53,114,0.16)] border border-white/70"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#3b3572]">
                  {currentPreviewTitle}
                </h3>

                <span className="text-xs bg-[#3b3572] text-white px-3 py-1 rounded-full">
                  {t("home.healthySteps.preview.aiPowered")}
                </span>
              </div>

              <div className="bg-[#f3f1fa] rounded-2xl p-5 mb-6">
                <p className="text-sm text-gray-600">
                  {currentPreviewText}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t("home.healthySteps.preview.scoreLabel")}
                </p>

                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3b3572] transition-all duration-500"
                    style={{
                      width: `${current?.score || 0}%`,
                    }}
                  ></div>
                </div>

                <p className="text-right mt-2 text-lg font-bold text-[#3b3572]">
                  {current?.score || 0}%
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
