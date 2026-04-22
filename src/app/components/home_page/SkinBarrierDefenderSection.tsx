"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import GameModal from "./game/GameModal"

export default function SkinBarrierDefenderSection() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <section
        className="relative w-full overflow-hidden py-20 sm:py-28 px-6"
        style={{ background: "linear-gradient(175deg, #0b1929 0%, #112b3c 50%, #0f2130 100%)" }}
      >
        {/* Ambient glow blobs */}
        <div
          className="absolute top-10 left-[15%] w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }}
        />
        <div
          className="absolute bottom-10 right-[10%] w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #156d95, transparent 70%)" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Badge pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            style={{
              fontFamily: "Satoshi",
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.2)",
              color: "#2dd4bf",
            }}
          >
            <span className="text-sm">🎮</span>
            Interactive Mini-Game
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-[44px] leading-tight font-bold tracking-tight text-white mb-4"
            style={{ fontFamily: "Satoshi" }}
          >
            Skin Barrier{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #2dd4bf, #156d95)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Defender
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-white/50 max-w-lg mx-auto mb-8 leading-relaxed"
            style={{ fontFamily: "Satoshi" }}
          >
            Can you protect your skin barrier for 60 seconds? Dodge the harmful
            elements, collect the right ingredients, and discover your
            personalized routine.
          </motion.p>

          {/* Floating preview emojis */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            {[
              { emoji: "🌞", label: "SPF 50", delay: 0 },
              { emoji: "💧", label: "Hydrate", delay: 0.08 },
              { emoji: "🛡️", label: "Defend", delay: 0.16 },
              { emoji: "☀️", label: "UV Rays", delay: 0.24, bad: true },
              { emoji: "🌿", label: "Soothe", delay: 0.32 },
            ].map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + item.delay }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: item.delay * 5,
                    ease: "easeInOut",
                  }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: item.bad
                      ? "rgba(248,113,113,0.12)"
                      : "rgba(45,212,191,0.1)",
                    border: item.bad
                      ? "1px solid rgba(248,113,113,0.25)"
                      : "1px solid rgba(45,212,191,0.2)",
                  }}
                >
                  {item.emoji}
                </motion.div>
                <span
                  className="text-[10px] text-white/35"
                  style={{ fontFamily: "Satoshi" }}
                >
                  {item.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA play button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <button
              onClick={() => setModalOpen(true)}
              className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full text-white font-semibold text-base transition-all duration-300 hover:brightness-110 hover:scale-[1.03]"
              style={{
                fontFamily: "Satoshi",
                background: "linear-gradient(135deg, #156d95, #0f766e)",
                boxShadow:
                  "0 4px 24px rgba(21,109,149,0.35), 0 0 0 1px rgba(45,212,191,0.15)",
              }}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "rgba(45,212,191,0.3)" }} />
              <span className="relative z-10 flex items-center gap-3">
                <span className="text-xl">▶</span>
                Play Now
              </span>
            </button>
          </motion.div>

          {/* Micro info */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-xs text-white/25 mt-5"
            style={{ fontFamily: "Satoshi" }}
          >
            60 seconds · No sign-up needed · Fun & educational
          </motion.p>
        </div>
      </section>

      {/* Game modal (renders via portal) */}
      <GameModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
