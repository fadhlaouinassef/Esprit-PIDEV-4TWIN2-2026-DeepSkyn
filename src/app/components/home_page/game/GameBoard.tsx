"use client"

import { useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { FallingItem } from "./useSkinBarrierGame"

interface GameBoardProps {
  items: FallingItem[]
  shieldX: number
  shieldWidthPercent: number
  boardHeight: number
  onShieldMove: (x: number) => void
  lastHit: { id: string; kind: "good" | "bad" | "bonus" } | null
}

export default function GameBoard({
  items,
  shieldX,
  shieldWidthPercent,
  boardHeight,
  onShieldMove,
  lastHit,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  // ── Mouse tracking (desktop) ────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      onShieldMove(pct)
    },
    [onShieldMove]
  )

  // ── Touch tracking (mobile) ─────────────────────────────────────────────
  const handleTouchStart = useCallback(() => {
    dragging.current = true
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const touch = e.touches[0]
      const pct = ((touch.clientX - rect.left) / rect.width) * 100
      onShieldMove(pct)
    },
    [onShieldMove]
  )

  const handleTouchEnd = useCallback(() => {
    dragging.current = false
  }, [])

  // Prevent body scroll on the board when touching (mobile)
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const prevent = (e: TouchEvent) => e.preventDefault()
    el.addEventListener("touchmove", prevent, { passive: false })
    return () => el.removeEventListener("touchmove", prevent)
  }, [])

  // ── Item visuals ────────────────────────────────────────────────────────
  const kindGlow: Record<string, string> = {
    good: "0 0 18px 4px rgba(45,212,191,0.45)",
    bad: "0 0 18px 4px rgba(248,113,113,0.45)",
    bonus: "0 0 22px 6px rgba(245,158,11,0.55)",
  }

  const kindBorder: Record<string, string> = {
    good: "1px solid rgba(45,212,191,0.5)",
    bad: "1px solid rgba(248,113,113,0.5)",
    bonus: "2px solid rgba(245,158,11,0.7)",
  }

  const kindBg: Record<string, string> = {
    good: "rgba(10,30,40,0.8)",
    bad: "rgba(40,10,10,0.8)",
    bonus: "rgba(40,30,10,0.85)",
  }

  return (
    <div
      ref={boardRef}
      className="relative w-full overflow-hidden cursor-none select-none touch-none"
      style={{
        height: boardHeight,
        background:
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(21,109,149,0.12) 0%, transparent 60%), linear-gradient(180deg, #0b1929 0%, #0f2130 60%, #112b3c 100%)",
      }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Falling items */}
      <AnimatePresence>
        {items
          .filter((fi) => !fi.missed)
          .map((fi) => (
            <motion.div
              key={fi.instanceId}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: fi.caught ? 0 : 1,
                scale: fi.caught ? 1.6 : 1,
              }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ duration: fi.caught ? 0.25 : 0.15 }}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: `${fi.x}%`,
                top: fi.y,
                willChange: "transform",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm"
                style={{
                  background: kindBg[fi.item.kind],
                  border: kindBorder[fi.item.kind],
                  boxShadow: kindGlow[fi.item.kind],
                }}
              >
                {fi.item.emoji}
              </div>
              <span
                className="mt-0.5 text-[10px] text-white/60 whitespace-nowrap"
                style={{ fontFamily: "Satoshi" }}
              >
                {fi.item.label}
              </span>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Hit flash */}
      <AnimatePresence>
        {lastHit && (
          <motion.div
            key={lastHit.id}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                lastHit.kind === "bad"
                  ? "radial-gradient(ellipse at 50% 90%, rgba(248,113,113,0.25), transparent 60%)"
                  : lastHit.kind === "bonus"
                    ? "radial-gradient(ellipse at 50% 90%, rgba(245,158,11,0.25), transparent 60%)"
                    : "radial-gradient(ellipse at 50% 90%, rgba(45,212,191,0.25), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Shield */}
      <motion.div
        className="absolute bottom-3 flex flex-col items-center pointer-events-none"
        animate={{ left: `${shieldX}%` }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.6 }}
        style={{
          width: `${shieldWidthPercent}%`,
          transform: "translateX(-50%)",
        }}
      >
        {/* Shield glow */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] h-10 rounded-full blur-xl pointer-events-none"
          style={{ background: "rgba(45,212,191,0.3)" }}
        />
        {/* Shield body */}
        <div
          className="relative w-full h-10 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, rgba(45,212,191,0.85) 0%, rgba(21,109,149,0.9) 100%)",
            border: "1.5px solid rgba(255,255,255,0.25)",
            boxShadow: "0 0 24px 4px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <span className="text-lg drop-shadow-sm">🛡️</span>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(10,22,40,0.6), transparent)",
        }}
      />
    </div>
  )
}
