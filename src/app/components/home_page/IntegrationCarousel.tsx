"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"

type PublicFeedback = {
  id: number
  nom: string
  message: string
  note: number
}

type IntegrationCarouselProps = {
  buttonText?: string
  buttonHref?: string
  title?: string
  subtitle?: string
}

const fallbackFeedbacks: PublicFeedback[] = [
  {
    id: -1,
    nom: "DeepSkyn User",
    message: "Great experience with the analysis.",
    note: 5,
  },
  {
    id: -2,
    nom: "DeepSkyn User",
    message: "Routine suggestions are very helpful.",
    note: 5,
  },
  {
    id: -3,
    nom: "DeepSkyn User",
    message: "Very practical recommendations.",
    note: 4,
  },
  {
    id: -4,
    nom: "DeepSkyn User",
    message: "The app is easy to use.",
    note: 4,
  },
]

// @component: IntegrationCarousel
export const IntegrationCarousel = ({
  buttonText,
  buttonHref = "#partners",
  title,
  subtitle,
}: IntegrationCarouselProps) => {
  const t = useTranslations()
  const [feedbacks, setFeedbacks] = useState<PublicFeedback[]>([])
  const resolvedButtonText = buttonText ?? t("home.integrations.buttonText")
  const resolvedTitle = title ?? t("home.integrations.title")
  const resolvedSubtitle = subtitle ?? t("home.integrations.subtitle")
  const topRowRef = useRef<HTMLDivElement>(null)
  const bottomRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        const response = await fetch("/api/user/feedback", { method: "GET" })
        const data = await response.json().catch(() => ({}))
        const rows = Array.isArray(data?.feedbacks) ? data.feedbacks : []
        setFeedbacks(rows)
      } catch {
        setFeedbacks([])
      }
    }

    loadFeedbacks()
  }, [])

  const { topRowFeedbacks, bottomRowFeedbacks } = useMemo(() => {
    const sourceFeedbacks = feedbacks.length > 0 ? feedbacks : fallbackFeedbacks

    const top = sourceFeedbacks.filter((_, index) => index % 2 === 0)
    const bottom = sourceFeedbacks.filter((_, index) => index % 2 !== 0)

    return {
      topRowFeedbacks: top.length > 0 ? top : sourceFeedbacks,
      bottomRowFeedbacks: bottom.length > 0 ? bottom : sourceFeedbacks,
    }
  }, [feedbacks])

  useEffect(() => {
    let topAnimationId: number
    let bottomAnimationId: number
    let topPosition = 0
    let bottomPosition = 0
    const animateTopRow = () => {
      if (topRowRef.current) {
        topPosition -= 0.5
        if (Math.abs(topPosition) >= topRowRef.current.scrollWidth / 2) {
          topPosition = 0
        }
        topRowRef.current.style.transform = `translateX(${topPosition}px)`
      }
      topAnimationId = requestAnimationFrame(animateTopRow)
    }
    const animateBottomRow = () => {
      if (bottomRowRef.current) {
        bottomPosition -= 0.65
        if (Math.abs(bottomPosition) >= bottomRowRef.current.scrollWidth / 2) {
          bottomPosition = 0
        }
        bottomRowRef.current.style.transform = `translateX(${bottomPosition}px)`
      }
      bottomAnimationId = requestAnimationFrame(animateBottomRow)
    }
    topAnimationId = requestAnimationFrame(animateTopRow)
    bottomAnimationId = requestAnimationFrame(animateBottomRow)
    return () => {
      cancelAnimationFrame(topAnimationId)
      cancelAnimationFrame(bottomAnimationId)
    }
  }, [])

  // @return
  return (
    <div className="w-full py-24 bg-white">
      <div className="max-w-[680px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center mb-20"
        >
          <div className="flex flex-col items-center gap-4">
            <h2
              className="text-[40px] leading-tight font-normal text-[#222222] text-center tracking-tight mb-0"
              style={{
                fontFamily: "Satoshi",
                fontWeight: "400",
                fontSize: "40px",
              }}
            >
              {resolvedTitle}
            </h2>
            <p
              className="text-lg leading-7 text-[#666666] text-center max-w-[600px] mt-2"
              style={{
                fontFamily: "Satoshi",
              }}
            >
              {resolvedSubtitle}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            className="flex gap-3 mt-6"
          >
            <button
              onClick={() => {
                const element = document.querySelector(buttonHref)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="inline-block px-5 py-2.5 rounded-full bg-white text-[#222222] text-[15px] font-medium leading-6 text-center whitespace-nowrap transition-all duration-75 ease-out w-[182px] cursor-pointer hover:shadow-lg"
              style={{
                boxShadow:
                  "0 -1px 0 0 rgb(181, 181, 181) inset, -1px 0 0 0 rgb(227, 227, 227) inset, 1px 0 0 0 rgb(227, 227, 227) inset, 0 1px 0 0 rgb(227, 227, 227) inset",
                backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.06) 80%, rgba(255, 255, 255, 0.12))",
              }}
            >
              {resolvedButtonText}
            </button>
          </motion.div>
        </motion.div>
      </div>

      <div className="h-[268px] -mt-6 mb-0 pb-0 relative overflow-hidden">
        <div
          ref={topRowRef}
          className="flex items-start gap-6 absolute top-6 whitespace-nowrap"
          style={{
            willChange: "transform",
          }}
        >
          {[...topRowFeedbacks, ...topRowFeedbacks].map((feedback, index) => (
            <div
              key={`top-feedback-${feedback.id}-${index}`}
              className="w-72 h-24 rounded-3xl flex-shrink-0 p-3 flex flex-col justify-between"
              style={{
                backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                boxShadow:
                  "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px, rgba(0, 0, 0, 0.04) 0px 6px 6px -3px, rgba(0, 0, 0, 0.04) 0px 12px 12px -6px, rgba(0, 0, 0, 0.04) 0px 12px 12px -12px",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-900 truncate">{feedback.nom}</p>
                <p className="text-xs font-bold text-amber-500">
                  {"★".repeat(Math.max(1, Math.min(5, Number(feedback.note || 0))))}
                </p>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{feedback.message || "No message"}</p>
            </div>
          ))}
        </div>

        <div
          className="absolute top-0 right-0 bottom-0 w-60 h-[268px] z-10 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(255, 255, 255))",
          }}
        />

        <div
          className="absolute top-0 left-0 bottom-0 w-60 h-[268px] z-10 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(90deg, rgb(255, 255, 255), rgba(0, 0, 0, 0))",
          }}
        />

        <div
          ref={bottomRowRef}
          className="flex items-start gap-6 absolute top-[148px] whitespace-nowrap"
          style={{
            willChange: "transform",
          }}
        >
          {[...bottomRowFeedbacks, ...bottomRowFeedbacks].map((feedback, index) => (
            <div
              key={`bottom-feedback-${feedback.id}-${index}`}
              className="w-72 h-24 rounded-3xl flex-shrink-0 p-3 flex flex-col justify-between"
              style={{
                backgroundImage: "linear-gradient(rgb(255, 255, 255), rgb(252, 252, 252))",
                boxShadow:
                  "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(0, 0, 0, 0.04) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 3px 3px -1.4px, rgba(0, 0, 0, 0.04) 0px 6px 6px -3px, rgba(0, 0, 0, 0.04) 0px 12px 12px -6px, rgba(0, 0, 0, 0.04) 0px 12px 12px -12px",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-900 truncate">{feedback.nom}</p>
                <p className="text-xs font-bold text-amber-500">
                  {"★".repeat(Math.max(1, Math.min(5, Number(feedback.note || 0))))}
                </p>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">{feedback.message || "No message"}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


