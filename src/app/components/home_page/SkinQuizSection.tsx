"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, RotateCcw, Sparkles, ArrowRight, X } from "lucide-react"

export const OPEN_SKIN_QUIZ_EVENT = "open-skin-quiz"

const questions = [
  {
    id: 1,
    question: "How does your skin feel when you wake up, without any skincare?",
    options: [
      { label: "Tight and uncomfortable", value: "dry" },
      { label: "Shiny and oily", value: "oily" },
      { label: "Normal, neither oily nor dry", value: "normal" },
      { label: "Oily on forehead/nose, dry on cheeks", value: "mixed" },
    ],
  },
  {
    id: 2,
    question: "How does your skin react after cleansing?",
    options: [
      { label: "Very dry, sometimes flaky", value: "dry" },
      { label: "Becomes oily again quickly", value: "oily" },
      { label: "Comfortable and balanced", value: "normal" },
      { label: "Different depending on the zone", value: "mixed" },
    ],
  },
  {
    id: 3,
    question: "Your pores are generally…",
    options: [
      { label: "Nearly invisible, fine-textured skin", value: "dry" },
      { label: "Large and visible, especially on the nose", value: "oily" },
      { label: "Barely visible, uniform", value: "normal" },
      { label: "Large in the center, invisible on the sides", value: "mixed" },
    ],
  },
  {
    id: 4,
    question: "Do you experience redness or burning sensations?",
    options: [
      { label: "Yes, very often", value: "sensitive" },
      { label: "Sometimes, in certain areas", value: "mixed" },
      { label: "Rarely", value: "normal" },
      { label: "No, never", value: "oily" },
    ],
  },
  {
    id: 5,
    question: "What is your main skin concern?",
    options: [
      { label: "Dryness, lack of radiance", value: "dry" },
      { label: "Shine, blackheads, acne", value: "oily" },
      { label: "Redness, reactivity, discomfort", value: "sensitive" },
      { label: "No particular concern", value: "normal" },
    ],
  },
]

type SkinType = "dry" | "oily" | "normal" | "mixed" | "sensitive"

const skinResults: Record<SkinType, { label: string; color: string; bg: string; description: string; tips: string[] }> = {
  dry: {
    label: "Dry Skin",
    color: "#b5651d",
    bg: "#fff7ed",
    description:
      "Your skin lacks lipids and hydration. It tends to feel tight, look dull, and may show flaking. It needs a nourishing and protective daily care routine.",
    tips: ["Use gentle, sulfate-free cleansers", "Apply a rich cream with hydrating actives", "Avoid very hot showers"],
  },
  oily: {
    label: "Oily Skin",
    color: "#156d95",
    bg: "#f0f9ff",
    description:
      "Your skin produces excess sebum, giving it a shiny appearance. It is prone to enlarged pores and blemishes. A balancing and mattifying routine will suit you perfectly.",
    tips: ["Cleanse twice daily with a purifying gel", "Use a lightweight, non-comedogenic moisturizer", "Exfoliate 1–2 times per week"],
  },
  normal: {
    label: "Normal Skin",
    color: "#15803d",
    bg: "#f0fdf4",
    description:
      "You have a well-balanced skin — neither too oily nor too dry. It's comfortable day-to-day with few imperfections. The goal is to maintain this balance with the right care.",
    tips: ["Keep a simple and consistent routine", "Apply SPF every morning", "Moisturize daily"],
  },
  mixed: {
    label: "Combination Skin",
    color: "#7c3aed",
    bg: "#faf5ff",
    description:
      "Your skin shows different characteristics depending on the zone: oily on the T-zone (forehead, nose, chin) and normal to dry on the cheeks. It requires a targeted zone-by-zone approach.",
    tips: ["Adapt your products to each facial zone", "Use a gentle cleanser to avoid worsening dryness", "Apply mattifying care only on the T-zone"],
  },
  sensitive: {
    label: "Sensitive Skin",
    color: "#be123c",
    bg: "#fff1f2",
    description:
      "Your skin reacts easily to external aggressors: redness, tingling, discomfort. It requires gentle, hypoallergenic, and soothing formulas to protect it effectively.",
    tips: ["Choose fragrance-free and alcohol-free products", "Patch test every new product before full use", "Favor soothing actives like niacinamide or aloe vera"],
  },
}

function computeSkinType(answers: string[]): SkinType {
  const counts: Record<string, number> = { dry: 0, oily: 0, normal: 0, mixed: 0, sensitive: 0 }
  answers.forEach((a) => { if (a in counts) counts[a]++ })
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as SkinType
}

function QuizContent({ onClose }: { onClose?: () => void }) {
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<SkinType | null>(null)

  const res = result ? skinResults[result] : null

  const handleNext = () => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    setAnswers(newAnswers)
    setSelected(null)
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      setResult(computeSkinType(newAnswers))
    }
  }

  const handleReset = () => {
    setStarted(false)
    setCurrent(0)
    setAnswers([])
    setSelected(null)
    setResult(null)
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#e5e5e5] overflow-hidden relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-[#e5e5e5] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-[#666]" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Intro */}
        {!started && !result && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-[#156d95]/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-[#156d95]" />
            </div>
            <h3 className="text-2xl font-normal text-[#202020] mb-3" style={{ fontFamily: "Satoshi" }}>
              Ready for your skin assessment?
            </h3>
            <p className="text-[#666666] mb-8 max-w-sm mx-auto" style={{ fontFamily: "Satoshi" }}>
              5 simple questions · 2 minutes · Instant result
            </p>
            <button
              onClick={() => setStarted(true)}
              className="inline-flex items-center gap-2 bg-[#156d95] text-white px-8 py-4 rounded-full text-lg hover:bg-[#125f82] transition-colors"
              style={{ fontFamily: "Satoshi" }}
            >
              Start the test
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Quiz */}
        {started && !result && (
          <motion.div
            key={`question-${current}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35 }}
            className="p-10"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-[#999]" style={{ fontFamily: "Satoshi" }}>
                Question {current + 1} / {questions.length}
              </span>
              <div className="flex-1 mx-4 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#156d95] rounded-full"
                  animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <h3 className="text-xl font-normal text-[#202020] mb-7 leading-snug" style={{ fontFamily: "Satoshi" }}>
              {questions[current].question}
            </h3>

            <div className="space-y-3 mb-8">
              {questions[current].options.map((opt) => (
                <button
                  key={opt.value + opt.label}
                  onClick={() => setSelected(opt.value)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                    selected === opt.value
                      ? "border-[#156d95] bg-[#156d95]/5 text-[#156d95]"
                      : "border-[#e5e5e5] text-[#202020] hover:border-[#156d95]/40"
                  }`}
                  style={{ fontFamily: "Satoshi" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={!selected}
              className={`w-full py-4 rounded-full text-lg transition-all ${
                selected
                  ? "bg-[#156d95] text-white hover:bg-[#125f82]"
                  : "bg-[#f0f0f0] text-[#999] cursor-not-allowed"
              }`}
              style={{ fontFamily: "Satoshi" }}
            >
              {current + 1 === questions.length ? "See my analysis" : "Next question"}
            </button>
          </motion.div>
        )}

        {/* Result */}
        {result && res && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-10"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: res.bg, color: res.color, fontFamily: "Satoshi" }}
            >
              <Sparkles className="w-4 h-4" />
              Your skin type
            </div>

            <h3 className="text-3xl font-normal mb-4" style={{ fontFamily: "Satoshi", color: res.color }}>
              {res.label}
            </h3>

            <p className="text-[#444] leading-relaxed mb-7 text-lg" style={{ fontFamily: "Satoshi" }}>
              {res.description}
            </p>

            <div className="bg-[#f8f8f6] rounded-2xl p-6 mb-8">
              <p className="text-sm font-medium text-[#202020] mb-3" style={{ fontFamily: "Satoshi" }}>
                Basic tips for your skin:
              </p>
              <ul className="space-y-2">
                {res.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#666] text-sm" style={{ fontFamily: "Satoshi" }}>
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs"
                      style={{ backgroundColor: res.color }}
                    >
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#156d95] rounded-2xl p-6 text-white mb-6">
              <p className="text-lg font-normal mb-1" style={{ fontFamily: "Satoshi" }}>
                Want a detailed and precise analysis?
              </p>
              <p className="text-white/80 text-sm mb-4" style={{ fontFamily: "Satoshi" }}>
                Our <strong>DeepSkyN</strong> app analyzes your skin with AI — imperfection detection, progress tracking, personalized routines and dermatological advice.
              </p>
              <a
                href="/signin"
                className="inline-flex items-center gap-2 bg-white text-[#156d95] px-6 py-3 rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
                style={{ fontFamily: "Satoshi" }}
              >
                Consult DeepSkyN
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#202020] text-sm transition-colors"
              style={{ fontFamily: "Satoshi" }}
            >
              <RotateCcw className="w-4 h-4" />
              Retake the test
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SkinQuizSection() {
  const [modalOpen, setModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handler = () => setModalOpen(true)
    window.addEventListener(OPEN_SKIN_QUIZ_EVENT, handler)
    return () => window.removeEventListener(OPEN_SKIN_QUIZ_EVENT, handler)
  }, [])

  const modal = (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          key="skin-quiz-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto"
          >
            <QuizContent onClose={() => setModalOpen(false)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {mounted && createPortal(modal, document.body)}

      {/* Inline section */}
      <section className="w-full py-24 px-8 bg-[#f8f8f6]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-[#156d95]/10 text-[#156d95] px-4 py-2 rounded-full text-sm mb-4" style={{ fontFamily: "Satoshi" }}>
              <Sparkles className="w-4 h-4" />
              <span>Free Skin Diagnostic</span>
            </div>
            <h2
              className="text-[40px] leading-tight font-normal text-[#202020] tracking-tight mb-4"
              style={{ fontFamily: "Satoshi", fontWeight: "400" }}
            >
              What is your skin type?
            </h2>
            <p className="text-lg text-[#666666]" style={{ fontFamily: "Satoshi" }}>
              Answer 5 questions to get a personalized skin analysis in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <QuizContent />
          </motion.div>
        </div>
      </section>
    </>
  )
}
