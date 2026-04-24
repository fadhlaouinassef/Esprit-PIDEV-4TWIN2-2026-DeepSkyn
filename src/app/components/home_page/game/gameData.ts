// ─── Game Data — 100% static, no imports from backend ─────────────────────────

export type ItemKind = "good" | "bad" | "bonus"

export interface GameItem {
  id: string
  label: string
  emoji: string
  kind: ItemKind
  category: "hydration" | "protection" | "calmness" | "all"
  points: number
  /** hp removed when caught (bad items only) */
  damage: number
  /** stat deltas applied on catch */
  effects: {
    hydration?: number
    protection?: number
    calmness?: number
    barrierHp?: number
  }
  speedMin: number
  speedMax: number
  /** relative spawn weight (higher = more frequent) */
  spawnWeight: number
  /** item only appears after this many seconds elapsed */
  unlockAtSecond: number
}

export const GAME_ITEMS: GameItem[] = [
  // ── Good items ─────────────────────────────
  {
    id: "spf50",
    label: "SPF 50",
    emoji: "🌞",
    kind: "good",
    category: "protection",
    points: 15,
    damage: 0,
    effects: { protection: 12 },
    speedMin: 120,
    speedMax: 200,
    spawnWeight: 8,
    unlockAtSecond: 0,
  },
  {
    id: "moisturizer",
    label: "Moisturizer",
    emoji: "💧",
    kind: "good",
    category: "hydration",
    points: 12,
    damage: 0,
    effects: { hydration: 14 },
    speedMin: 110,
    speedMax: 190,
    spawnWeight: 9,
    unlockAtSecond: 0,
  },
  {
    id: "ceramides",
    label: "Ceramides",
    emoji: "🫧",
    kind: "good",
    category: "protection",
    points: 14,
    damage: 0,
    effects: { protection: 10, hydration: 6 },
    speedMin: 100,
    speedMax: 180,
    spawnWeight: 7,
    unlockAtSecond: 0,
  },
  {
    id: "niacinamide",
    label: "Niacinamide",
    emoji: "✨",
    kind: "good",
    category: "calmness",
    points: 13,
    damage: 0,
    effects: { calmness: 13, hydration: 4 },
    speedMin: 120,
    speedMax: 200,
    spawnWeight: 7,
    unlockAtSecond: 0,
  },
  {
    id: "aloe",
    label: "Aloe Vera",
    emoji: "🌿",
    kind: "good",
    category: "calmness",
    points: 10,
    damage: 0,
    effects: { calmness: 15 },
    speedMin: 100,
    speedMax: 180,
    spawnWeight: 8,
    unlockAtSecond: 0,
  },
  {
    id: "vitamin_c",
    label: "Vitamin C",
    emoji: "🍊",
    kind: "good",
    category: "all",
    points: 16,
    damage: 0,
    effects: { hydration: 6, protection: 6, calmness: 6 },
    speedMin: 130,
    speedMax: 210,
    spawnWeight: 5,
    unlockAtSecond: 10,
  },
  // ── Bad items ──────────────────────────────
  {
    id: "uv_rays",
    label: "UV Rays",
    emoji: "☀️",
    kind: "bad",
    category: "protection",
    points: -10,
    damage: 12,
    effects: { protection: -14, barrierHp: -12 },
    speedMin: 140,
    speedMax: 230,
    spawnWeight: 8,
    unlockAtSecond: 0,
  },
  {
    id: "pollution",
    label: "Pollution",
    emoji: "🏭",
    kind: "bad",
    category: "calmness",
    points: -8,
    damage: 10,
    effects: { calmness: -12, barrierHp: -10 },
    speedMin: 130,
    speedMax: 220,
    spawnWeight: 8,
    unlockAtSecond: 0,
  },
  {
    id: "over_exfoliation",
    label: "Over-Exfoliation",
    emoji: "🔴",
    kind: "bad",
    category: "calmness",
    points: -12,
    damage: 15,
    effects: { calmness: -16, hydration: -8, barrierHp: -15 },
    speedMin: 150,
    speedMax: 250,
    spawnWeight: 5,
    unlockAtSecond: 15,
  },
  {
    id: "hot_water",
    label: "Hot Water",
    emoji: "♨️",
    kind: "bad",
    category: "hydration",
    points: -9,
    damage: 11,
    effects: { hydration: -14, barrierHp: -11 },
    speedMin: 140,
    speedMax: 230,
    spawnWeight: 7,
    unlockAtSecond: 0,
  },
  {
    id: "harsh_soap",
    label: "Harsh Soap",
    emoji: "🧼",
    kind: "bad",
    category: "hydration",
    points: -11,
    damage: 13,
    effects: { hydration: -15, protection: -8, barrierHp: -13 },
    speedMin: 145,
    speedMax: 240,
    spawnWeight: 6,
    unlockAtSecond: 20,
  },
  // ── Bonus items (rare) ─────────────────────
  {
    id: "repair_mask",
    label: "Repair Mask",
    emoji: "🎭",
    kind: "bonus",
    category: "all",
    points: 30,
    damage: 0,
    effects: { hydration: 20, protection: 20, calmness: 20, barrierHp: 20 },
    speedMin: 80,
    speedMax: 130,
    spawnWeight: 2,
    unlockAtSecond: 20,
  },
]

// ── Difficulty stages ──────────────────────────────────────────────────────────
export interface DifficultyStage {
  fromSecond: number
  toSecond: number
  label: string
  spawnIntervalMs: number
  /** 0-1: fraction of bad items in spawn pool */
  badItemBias: number
  maxItemsOnScreen: number
}

export const DIFFICULTY_STAGES: DifficultyStage[] = [
  {
    fromSecond: 0,
    toSecond: 20,
    label: "Easy",
    spawnIntervalMs: 1400,
    badItemBias: 0.25,
    maxItemsOnScreen: 4,
  },
  {
    fromSecond: 20,
    toSecond: 40,
    label: "Medium",
    spawnIntervalMs: 1100,
    badItemBias: 0.4,
    maxItemsOnScreen: 6,
  },
  {
    fromSecond: 40,
    toSecond: 60,
    label: "Hard",
    spawnIntervalMs: 850,
    badItemBias: 0.55,
    maxItemsOnScreen: 8,
  },
]

// ── Badge rules ────────────────────────────────────────────────────────────────
export interface BadgeRule {
  minScore: number
  label: string
  emoji: string
  color: string
  description: string
}

export const BADGE_RULES: BadgeRule[] = [
  {
    minScore: 90,
    label: "Barrier Legend",
    emoji: "🏆",
    color: "#f59e0b",
    description: "Perfect skin protector! Your barrier is impenetrable.",
  },
  {
    minScore: 75,
    label: "Skin Guardian",
    emoji: "🛡️",
    color: "#156d95",
    description: "Excellent defense! Your skin is well protected.",
  },
  {
    minScore: 55,
    label: "Hydration Hero",
    emoji: "💧",
    color: "#0ea5e9",
    description: "Good job! Keep building your barrier strength.",
  },
  {
    minScore: 35,
    label: "Skin Apprentice",
    emoji: "🌱",
    color: "#22c55e",
    description: "Learning the basics — every habit counts!",
  },
  {
    minScore: 0,
    label: "Barrier Beginner",
    emoji: "🌿",
    color: "#94a3b8",
    description: "Your barrier needs some love. Time to level up!",
  },
]

// ── Recommendation rules ───────────────────────────────────────────────────────
export interface RecommendationRule {
  stat: "hydration" | "protection" | "calmness"
  threshold: number // triggered when stat falls below this value
  product: string
  reason: string
  emoji: string
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  // hydration recommendations
  {
    stat: "hydration",
    threshold: 60,
    product: "Hyaluronic Acid Serum",
    reason: "Your hydration barrier was compromised — HA plumps and retains moisture.",
    emoji: "💧",
  },
  {
    stat: "hydration",
    threshold: 40,
    product: "Rich Ceramide Cream",
    reason: "Critical hydration loss detected. Ceramides rebuild your lipid barrier fast.",
    emoji: "🧴",
  },
  // protection recommendations
  {
    stat: "protection",
    threshold: 60,
    product: "SPF 50+ Broad Spectrum",
    reason: "UV damage weakened your barrier. Daily SPF is non-negotiable.",
    emoji: "🌞",
  },
  {
    stat: "protection",
    threshold: 40,
    product: "Mineral Sunscreen + Antioxidant Serum",
    reason: "Severe UV exposure. Layer antioxidants under physical SPF for full defense.",
    emoji: "🛡️",
  },
  // calmness recommendations
  {
    stat: "calmness",
    threshold: 60,
    product: "Niacinamide 10% Toner",
    reason: "Inflammation detected. Niacinamide calms redness and strengthens barrier.",
    emoji: "✨",
  },
  {
    stat: "calmness",
    threshold: 40,
    product: "Centella Asiatica Soothing Cream",
    reason: "High skin stress. Cica extract repairs and deeply soothes irritated skin.",
    emoji: "🌿",
  },
]
