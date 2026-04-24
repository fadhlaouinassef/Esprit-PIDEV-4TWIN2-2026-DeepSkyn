"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useSkinBarrierGame } from "./useSkinBarrierGame"
import { OPEN_SKIN_QUIZ_EVENT } from "../SkinQuizSection"
import GameHUD from "./GameHUD"
import GameBoard from "./GameBoard"
import GameResult from "./GameResult"

interface GameModalProps {
  open: boolean
  onClose: () => void
}

export default function GameModal({ open, onClose }: GameModalProps) {
  const {
    state,
    result,
    startGame,
    resetToIntro,
    setShieldX,
    BOARD_HEIGHT,
    SHIELD_WIDTH_PERCENT,
  } = useSkinBarrierGame()

  // When the modal opens for the first time, show intro
  useEffect(() => {
    if (open && state.phase === "idle") {
      resetToIntro()
    }
  }, [open, state.phase, resetToIntro])

  const handleClose = () => {
    resetToIntro()
    onClose()
  }

  const handleOpenQuiz = () => {
    handleClose()
    setTimeout(() => {
      window.dispatchEvent(new Event(OPEN_SKIN_QUIZ_EVENT))
    }, 350)
  }

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="game-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={state.phase !== "playing" ? handleClose : undefined}
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: "#0b1929",
              border: "1px solid rgba(45,212,191,0.15)",
              boxShadow:
                "0 0 60px 10px rgba(21,109,149,0.15), 0 25px 50px -12px rgba(0,0,0,0.4)",
            }}
          >
            {/* Close button (not during gameplay) */}
            {state.phase !== "playing" && (
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{
                  background: "rgba(255,255,255,0.08)",
                }}
                aria-label="Close game"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}

            {/* ── Intro screen ──────────────────────────────── */}
            <AnimatePresence mode="wait">
              {state.phase === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                  className="px-6 py-10 sm:py-14 text-center"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(45,212,191,0.18), rgba(21,109,149,0.18))",
                      border: "1.5px solid rgba(45,212,191,0.3)",
                    }}
                  >
                    <span className="text-4xl">🛡️</span>
                  </motion.div>

                  <h3
                    className="text-2xl font-bold text-white mb-2"
                    style={{ fontFamily: "Satoshi" }}
                  >
                    Skin Barrier Defender
                  </h3>

                  <p className="text-sm text-white/50 mb-6 max-w-xs mx-auto leading-relaxed" style={{ fontFamily: "Satoshi" }}>
                    Protect your skin barrier for 60 seconds!
                  </p>

                  <div
                    className="text-left max-w-xs mx-auto rounded-xl p-4 mb-8 space-y-2.5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {[
                      { icon: "🟢", text: "Catch beneficial skincare items to boost your stats" },
                      { icon: "🔴", text: "Avoid harmful elements — they damage your barrier" },
                      { icon: "🎭", text: "Rare Repair Masks restore everything!" },
                    ].map((rule, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-sm flex-shrink-0 mt-0.5">{rule.icon}</span>
                        <span
                          className="text-sm text-white/65 leading-snug"
                          style={{ fontFamily: "Satoshi" }}
                        >
                          {rule.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startGame}
                    className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full text-white font-medium transition-all hover:brightness-110"
                    style={{
                      fontFamily: "Satoshi",
                      background: "linear-gradient(135deg, #156d95, #0f766e)",
                      boxShadow: "0 4px 20px rgba(21,109,149,0.4)",
                    }}
                  >
                    <span className="text-lg">▶</span>
                    Start Game
                  </button>
                </motion.div>
              )}

              {/* ── Gameplay ────────────────────────────────── */}
              {state.phase === "playing" && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <GameHUD
                    timeLeft={state.timeLeft}
                    barrierHp={state.barrierHp}
                    stats={state.stats}
                    scoreRaw={state.scoreRaw}
                    combo={state.combo}
                  />
                  <GameBoard
                    items={state.items}
                    shieldX={state.shieldX}
                    shieldWidthPercent={SHIELD_WIDTH_PERCENT}
                    boardHeight={BOARD_HEIGHT}
                    onShieldMove={setShieldX}
                    lastHit={state.lastHit}
                  />
                </motion.div>
              )}

              {/* ── Result ──────────────────────────────────── */}
              {state.phase === "result" && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl"
                >
                  <GameResult
                    result={result}
                    onReplay={resetToIntro}
                    onOpenQuiz={handleOpenQuiz}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Render via portal so it sits above everything
  if (typeof window === "undefined") return null
  return createPortal(modalContent, document.body)
}
