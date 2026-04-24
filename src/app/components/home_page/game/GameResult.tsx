"use client"

import { motion } from "framer-motion"
import type { GameResult as GameResultType } from "./useSkinBarrierGame"

interface GameResultProps {
  result: GameResultType
  onReplay: () => void
  onOpenQuiz: () => void
}

function StatFinalBar({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1" style={{ fontFamily: "Satoshi" }}>
          <span className="text-[#334155]">{label}</span>
          <span className="font-medium" style={{ color }}>
            {Math.round(value)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: "0%" }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  )
}

export default function GameResult({ result, onReplay, onOpenQuiz }: GameResultProps) {
  const { finalScore, badge, recommendations, stats, barrierHp } = result

  // Animated score counter
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center w-full overflow-y-auto max-h-[82vh] px-4 py-6 sm:px-6"
      style={{ scrollbarWidth: "thin" }}
    >
      {/* Badge + Score hero */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
        className="flex flex-col items-center mb-6 text-center"
      >
        {/* Animated badge circle */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
          style={{
            background: `linear-gradient(135deg, ${badge.color}22, ${badge.color}44)`,
            border: `2px solid ${badge.color}66`,
            boxShadow: `0 0 40px 8px ${badge.color}22`,
          }}
        >
          <span className="text-5xl">{badge.emoji}</span>
        </div>

        <h3
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "Satoshi", color: badge.color }}
        >
          {badge.label}
        </h3>
        <p className="text-sm text-[#64748b] max-w-sm mb-3" style={{ fontFamily: "Satoshi" }}>
          {badge.description}
        </p>

        {/* Score ring */}
        <div className="relative w-28 h-28 mb-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="6"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={badge.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 42 * (1 - finalScore / 100),
              }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold"
              style={{ fontFamily: "Satoshi", color: badge.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {finalScore}
            </motion.span>
            <span className="text-[10px] text-[#94a3b8] font-medium" style={{ fontFamily: "Satoshi" }}>
              / 100
            </span>
          </div>
        </div>
      </motion.div>

      {/* Final stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md rounded-2xl p-5 mb-5"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <p className="text-sm font-medium text-[#334155] mb-3" style={{ fontFamily: "Satoshi" }}>
          Barrier Status
        </p>
        <div className="space-y-3 mb-4">
          <StatFinalBar label="Barrier HP" value={barrierHp} icon="🛡️" color="#2dd4bf" />
          <StatFinalBar label="Hydration" value={stats.hydration} icon="💧" color="#38bdf8" />
          <StatFinalBar label="Protection" value={stats.protection} icon="🌞" color="#2dd4bf" />
          <StatFinalBar label="Calmness" value={stats.calmness} icon="🌿" color="#c084fc" />
        </div>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-md mb-6"
        >
          <p
            className="text-sm font-medium text-[#334155] mb-3 px-1"
            style={{ fontFamily: "Satoshi" }}
          >
            ✨ Your Skincare Picks
          </p>
          <div className="space-y-2.5">
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.product}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.12 }}
                className="flex items-start gap-3 rounded-xl p-3.5"
                style={{ background: "#f0fdf9", border: "1px solid #ccfbf1" }}
              >
                <span className="text-xl flex-shrink-0">{rec.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-[#0f766e]" style={{ fontFamily: "Satoshi" }}>
                    {rec.product}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed" style={{ fontFamily: "Satoshi" }}>
                    {rec.reason}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
      >
        <button
          onClick={onOpenQuiz}
          className="w-full sm:flex-1 py-3.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
          style={{
            fontFamily: "Satoshi",
            background: "linear-gradient(135deg, #156d95, #0f766e)",
            boxShadow: "0 4px 16px rgba(21,109,149,0.3)",
          }}
        >
          🔬 Take the Full Skin Quiz
        </button>
        <button
          onClick={onReplay}
          className="w-full sm:flex-1 py-3.5 rounded-full text-sm font-medium border transition-all hover:bg-[#f1f5f9]"
          style={{
            fontFamily: "Satoshi",
            color: "#475569",
            borderColor: "#cbd5e1",
          }}
        >
          🔄 Play Again
        </button>
      </motion.div>
    </motion.div>
  )
}
