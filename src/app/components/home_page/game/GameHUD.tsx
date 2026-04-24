"use client"

import { motion } from "framer-motion"
import type { GameStats } from "./useSkinBarrierGame"

interface GameHUDProps {
  timeLeft: number
  barrierHp: number
  stats: GameStats
  scoreRaw: number
  combo: number
}

function StatBar({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Satoshi" }}>
        <span className="flex items-center gap-1 text-white/70">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className="text-white font-medium">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

export default function GameHUD({ timeLeft, barrierHp, stats, scoreRaw, combo }: GameHUDProps) {
  const timeDisplay = Math.ceil(timeLeft)
  const isUrgent = timeLeft <= 10
  const hpColor = barrierHp > 60 ? "#2dd4bf" : barrierHp > 30 ? "#fbbf24" : "#f87171"

  return (
    <div
      className="w-full px-3 pt-3 pb-2 rounded-t-2xl flex flex-col gap-2"
      style={{ background: "rgba(10,22,40,0.92)", backdropFilter: "blur(12px)" }}
    >
      {/* Top row: timer / score / combo */}
      <div className="flex items-center justify-between">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`text-3xl font-bold tabular-nums transition-colors ${isUrgent ? "text-red-400" : "text-white"
              }`}
            style={{ fontFamily: "Satoshi" }}
          >
            {String(timeDisplay).padStart(2, "0")}
            <span className="text-sm font-normal text-white/50 ml-1">s</span>
          </div>
          {isUrgent && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-red-400 text-xs font-medium"
              style={{ fontFamily: "Satoshi" }}
            >
              HURRY!
            </motion.span>
          )}
        </div>

        {/* Combo */}
        {combo >= 2 && (
          <motion.div
            key={combo}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              color: "white",
              fontFamily: "Satoshi",
            }}
          >
            🔥 x{combo} COMBO
          </motion.div>
        )}

        {/* Score */}
        <div
          className="text-right"
          style={{ fontFamily: "Satoshi" }}
        >
          <div className="text-xs text-white/50">Score</div>
          <div className="text-xl font-bold text-[#2dd4bf]">{Math.max(0, Math.round(scoreRaw))}</div>
        </div>
      </div>

      {/* Barrier HP bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1" style={{ fontFamily: "Satoshi" }}>
          <span className="text-white/70 flex items-center gap-1">🛡️ Skin Barrier</span>
          <span style={{ color: hpColor }} className="font-medium">{Math.round(barrierHp)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${hpColor}, ${hpColor}88)` }}
            animate={{ width: `${barrierHp}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 3 stat bars */}
      <div className="grid grid-cols-3 gap-2">
        <StatBar label="Hydration" value={stats.hydration} color="#38bdf8" icon="💧" />
        <StatBar label="Protection" value={stats.protection} color="#2dd4bf" icon="🛡️" />
        <StatBar label="Calmness" value={stats.calmness} color="#c084fc" icon="🌿" />
      </div>
    </div>
  )
}
