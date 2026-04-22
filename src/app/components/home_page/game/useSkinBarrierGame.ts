"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  GAME_ITEMS,
  DIFFICULTY_STAGES,
  BADGE_RULES,
  RECOMMENDATION_RULES,
  type GameItem,
  type BadgeRule,
  type RecommendationRule,
} from "./gameData"

// ── Types ─────────────────────────────────────────────────────────────────────

export type GamePhase = "idle" | "intro" | "playing" | "result"

export interface FallingItem {
  instanceId: string
  item: GameItem
  x: number          // % from left
  y: number          // px from top
  speed: number      // px/s
  caught: boolean
  missed: boolean
}

export interface GameStats {
  hydration: number
  protection: number
  calmness: number
}

export interface GameState {
  phase: GamePhase
  timeLeft: number
  barrierHp: number
  stats: GameStats
  scoreRaw: number
  combo: number
  items: FallingItem[]
  shieldX: number    // % from left
  lastHit: { id: string; kind: "good" | "bad" | "bonus" } | null
}

export interface GameResult {
  finalScore: number
  badge: BadgeRule
  recommendations: RecommendationRule[]
  stats: GameStats
  barrierHp: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BOARD_HEIGHT = 460       // px — matches GameBoard height
const SHIELD_WIDTH_PERCENT = 14
const TICK_MS = 16             // ~60fps
const TOTAL_SECONDS = 60
const INITIAL_HP = 100
const INITIAL_STAT = 50
const MAX_STAT = 100

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function weightedRandomItem(elapsed: number, bias: number): GameItem {
  const available = GAME_ITEMS.filter((it) => it.unlockAtSecond <= elapsed)

  // Build weighted pool incorporating difficulty bias
  const pool: GameItem[] = []
  for (const item of available) {
    let w = item.spawnWeight
    // Increase bad weight by bias, decrease good weight
    if (item.kind === "bad") w = Math.round(w * (1 + bias * 2))
    else if (item.kind === "good") w = Math.round(w * (1 - bias * 0.5))
    for (let i = 0; i < w; i++) pool.push(item)
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

function getDifficulty(elapsed: number) {
  return (
    DIFFICULTY_STAGES.find(
      (s) => elapsed >= s.fromSecond && elapsed <= s.toSecond
    ) ?? DIFFICULTY_STAGES[DIFFICULTY_STAGES.length - 1]
  )
}

function computeFinalScore(
  scoreRaw: number,
  barrierHp: number,
  stats: GameStats
): number {
  // Normalize scoreRaw to 0-60 range
  const maxRaw = GAME_ITEMS.filter((i) => i.kind !== "bad").reduce(
    (acc, i) => acc + i.points * 4,
    0
  )
  const normalized = clamp((scoreRaw / Math.max(maxRaw, 1)) * 60, 0, 60)
  // Bonus: barrier hp (0-20) + stat average (0-20)
  const hpBonus = (barrierHp / INITIAL_HP) * 20
  const statAvg = (stats.hydration + stats.protection + stats.calmness) / 3
  const statBonus = (statAvg / MAX_STAT) * 20
  return Math.round(clamp(normalized + hpBonus + statBonus, 0, 100))
}

function getBadge(score: number): BadgeRule {
  return (
    BADGE_RULES.find((b) => score >= b.minScore) ??
    BADGE_RULES[BADGE_RULES.length - 1]
  )
}

function getRecommendations(stats: GameStats): RecommendationRule[] {
  // Sort stats ascending to find weakest first
  const entries = (["hydration", "protection", "calmness"] as const).map(
    (key) => ({ key, value: stats[key] })
  )
  entries.sort((a, b) => a.value - b.value)

  const recs: RecommendationRule[] = []
  for (const entry of entries) {
    if (recs.length >= 3) break
    // Find the strictest matching rule for this stat
    const matched = RECOMMENDATION_RULES.filter(
      (r) => r.stat === entry.key && entry.value < r.threshold
    ).sort((a, b) => b.threshold - a.threshold)[0]
    if (matched) recs.push(matched)
  }

  // Fill up to 3 with softer thresholds if needed
  if (recs.length < 3) {
    for (const entry of entries) {
      if (recs.length >= 3) break
      const already = recs.some((r) => r.stat === entry.key)
      if (!already) {
        const matched = RECOMMENDATION_RULES.find((r) => r.stat === entry.key)
        if (matched && !recs.includes(matched)) recs.push(matched)
      }
    }
  }

  return recs.slice(0, 3)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSkinBarrierGame() {
  const [state, setState] = useState<GameState>({
    phase: "idle",
    timeLeft: TOTAL_SECONDS,
    barrierHp: INITIAL_HP,
    stats: { hydration: INITIAL_STAT, protection: INITIAL_STAT, calmness: INITIAL_STAT },
    scoreRaw: 0,
    combo: 0,
    items: [],
    shieldX: 50,
    lastHit: null,
  })

  const [result, setResult] = useState<GameResult | null>(null)

  // Refs hold mutable values that the game loop reads/writes without re-renders
  const stateRef = useRef(state)
  stateRef.current = state

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTickRef = useRef<number>(0)
  const idCounterRef = useRef(0)
  const isPlayingRef = useRef(false)

  // ── Game loop tick (runs at ~60fps) ──────────────────────────────────────
  const tick = useCallback(() => {
    const now = Date.now()
    const dt = (now - lastTickRef.current) / 1000 // seconds
    lastTickRef.current = now

    setState((prev) => {
      if (prev.phase !== "playing") return prev

      const newTimeLeft = Math.max(0, prev.timeLeft - dt)
      const elapsed = TOTAL_SECONDS - newTimeLeft

      // Move falling items
      let newItems = prev.items.map((fi) => ({
        ...fi,
        y: fi.y + fi.speed * dt,
      }))

      // Collision detection: shield zone
      const shieldY = BOARD_HEIGHT - 60 // shield top in px
      const shieldLeft = prev.shieldX - SHIELD_WIDTH_PERCENT / 2
      const shieldRight = prev.shieldX + SHIELD_WIDTH_PERCENT / 2

      let scoreRaw = prev.scoreRaw
      let barrierHp = prev.barrierHp
      let combo = prev.combo
      let stats = { ...prev.stats }
      let lastHit = prev.lastHit

      newItems = newItems.map((fi) => {
        if (fi.caught || fi.missed) return fi

        // Item center x in %
        const itemLeftPct = fi.x
        const itemRightPct = fi.x + 7 // item width ≈ 7%

        // Is item in shield zone?
        if (
          fi.y + 40 >= shieldY &&
          fi.y <= shieldY + 40 &&
          itemRightPct >= shieldLeft &&
          itemLeftPct <= shieldRight
        ) {
          // Caught!
          const { item } = fi
          scoreRaw += item.points * (item.kind === "good" ? 1 + combo * 0.1 : 1)

          // Apply effects
          if (item.effects.hydration) {
            stats.hydration = clamp(stats.hydration + item.effects.hydration, 0, MAX_STAT)
          }
          if (item.effects.protection) {
            stats.protection = clamp(stats.protection + item.effects.protection, 0, MAX_STAT)
          }
          if (item.effects.calmness) {
            stats.calmness = clamp(stats.calmness + item.effects.calmness, 0, MAX_STAT)
          }
          if (item.effects.barrierHp) {
            barrierHp = clamp(barrierHp + item.effects.barrierHp, 0, INITIAL_HP)
          }
          if (item.damage > 0) {
            barrierHp = clamp(barrierHp - item.damage, 0, INITIAL_HP)
          }

          if (item.kind === "good" || item.kind === "bonus") {
            combo += 1
          } else {
            combo = 0
          }

          lastHit = { id: fi.instanceId, kind: item.kind }
          return { ...fi, caught: true }
        }

        // Missed (fell off screen)
        if (fi.y > BOARD_HEIGHT + 60) {
          return { ...fi, missed: true }
        }

        return fi
      })

      // Prune old items (keep caught/missed brief for animation)
      newItems = newItems.filter(
        (fi) => !fi.missed && !(fi.caught && fi.y > BOARD_HEIGHT + 40)
      )

      // Check end conditions
      const isOver = newTimeLeft <= 0 || barrierHp <= 0
      if (isOver) {
        isPlayingRef.current = false
        const finalScore = computeFinalScore(scoreRaw, barrierHp, stats)
        const badge = getBadge(finalScore)
        const recommendations = getRecommendations(stats)
        setResult({ finalScore, badge, recommendations, stats, barrierHp })
        return {
          ...prev,
          phase: "result" as const,
          timeLeft: 0,
          barrierHp,
          stats,
          scoreRaw,
          combo,
          items: [],
          lastHit,
        }
      }

      return {
        ...prev,
        timeLeft: newTimeLeft,
        barrierHp,
        stats,
        scoreRaw,
        combo,
        items: newItems,
        lastHit,
      }
    })
  }, [])

  // ── Spawner ───────────────────────────────────────────────────────────────
  const scheduleSpawn = useCallback(() => {
    if (!isPlayingRef.current) return
    const { timeLeft, items } = stateRef.current
    const elapsed = TOTAL_SECONDS - timeLeft
    const stage = getDifficulty(elapsed)

    if (items.filter((i) => !i.caught && !i.missed).length < stage.maxItemsOnScreen) {
      const item = weightedRandomItem(elapsed, stage.badItemBias)
      const speed = item.speedMin + Math.random() * (item.speedMax - item.speedMin)
      const x = 5 + Math.random() * 82 // 5–87% to keep within board

      setState((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            instanceId: `item-${idCounterRef.current++}`,
            item,
            x,
            y: -60,
            speed,
            caught: false,
            missed: false,
          },
        ],
      }))
    }

    spawnRef.current = setTimeout(scheduleSpawn, stage.spawnIntervalMs)
  }, [])

  // ── Public API ────────────────────────────────────────────────────────────

  const startGame = useCallback(() => {
    isPlayingRef.current = true
    idCounterRef.current = 0
    lastTickRef.current = Date.now()

    setState({
      phase: "playing",
      timeLeft: TOTAL_SECONDS,
      barrierHp: INITIAL_HP,
      stats: { hydration: INITIAL_STAT, protection: INITIAL_STAT, calmness: INITIAL_STAT },
      scoreRaw: 0,
      combo: 0,
      items: [],
      shieldX: 50,
      lastHit: null,
    })
    setResult(null)

    // Start tick loop
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = setInterval(tick, TICK_MS)

    // Start spawner
    if (spawnRef.current) clearTimeout(spawnRef.current)
    scheduleSpawn()
  }, [tick, scheduleSpawn])

  const resetToIntro = useCallback(() => {
    isPlayingRef.current = false
    if (tickRef.current) clearInterval(tickRef.current)
    if (spawnRef.current) clearTimeout(spawnRef.current)
    setResult(null)
    setState((prev) => ({
      ...prev,
      phase: "intro",
      timeLeft: TOTAL_SECONDS,
      barrierHp: INITIAL_HP,
      stats: { hydration: INITIAL_STAT, protection: INITIAL_STAT, calmness: INITIAL_STAT },
      scoreRaw: 0,
      combo: 0,
      items: [],
    }))
  }, [])

  const openIntro = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "intro" }))
  }, [])

  const setShieldX = useCallback((x: number) => {
    setState((prev) => ({ ...prev, shieldX: clamp(x, SHIELD_WIDTH_PERCENT / 2, 100 - SHIELD_WIDTH_PERCENT / 2) }))
  }, [])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      if (spawnRef.current) clearTimeout(spawnRef.current)
      isPlayingRef.current = false
    }
  }, [])

  return {
    state,
    result,
    startGame,
    resetToIntro,
    openIntro,
    setShieldX,
    BOARD_HEIGHT,
    SHIELD_WIDTH_PERCENT,
  }
}
