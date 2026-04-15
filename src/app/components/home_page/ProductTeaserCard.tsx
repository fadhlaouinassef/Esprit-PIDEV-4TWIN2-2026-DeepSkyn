"use client"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import HeroSection from "./HeroSection"
import { useTranslations } from "next-intl"
type ProductTeaserCardProps = {
  dailyVolume?: string
  dailyVolumeLabel?: string
  headline?: string
  subheadline?: string
  description?: string
  videoSrc?: string
  posterSrc?: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
}

// @component: ProductTeaserCard
export const ProductTeaserCard = (props: ProductTeaserCardProps) => {
  const t = useTranslations()
  const {
    dailyVolume = "50,000+",
    dailyVolumeLabel = t('home.product.dailyVolumeLabel'),
    headline = t('home.product.headline'),
    subheadline = t('home.product.subheadline'),
    description = t('home.product.description'),
    videoSrc = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop",
    posterSrc = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop",
    primaryButtonText = t('home.product.primaryCta'),
    primaryButtonHref = "#routine",
    secondaryButtonText = t('home.product.secondaryCta'),
    secondaryButtonHref = "#products",
  } = props

  // @return
  return (
    <section id="routine" className="w-full px-8 pt-32 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-2">
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
            }}
            className="col-span-12 lg:col-span-6 bg-[#e9e9e9] rounded-[40px] p-12 lg:p-16 flex flex-col justify-end aspect-square overflow-hidden"
          >
            <a
              href={primaryButtonHref}
              onClick={(e) => e.preventDefault()}
              className="flex flex-col gap-1 text-[#9a9a9a]"
            >
              <motion.span
                initial={{
                  transform: "translateY(20px)",
                  opacity: 0,
                }}
                animate={{
                  transform: "translateY(0px)",
                  opacity: 1,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.645, 0.045, 0.355, 1],
                  delay: 0.6,
                }}
                className="text-sm uppercase tracking-tight flex items-center gap-1"
                style={{
                  fontFamily: "Satoshi",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                }}
              >
                {dailyVolumeLabel}
                <ArrowUpRight className="w-[0.71em] h-[0.71em]" />
              </motion.span>
              <span
                className="text-[32px] leading-[160px] tracking-tight bg-gradient-to-r from-[#202020] via-[#00517f] via-[#52aee3] to-[#9ed2fc] bg-clip-text text-transparent"
                style={{
                  fontFeatureSettings: '"clig" 0, "liga" 0',
                  height: "98px",
                  marginBottom: "0px",
                  paddingTop: "",
                  display: "none",
                }}
              >
                {dailyVolume}
              </span>
            </a>

            <h1
              className="text-[56px] leading-[60px] tracking-tight text-[#202020] max-w-[520px] mb-6"
              style={{
                fontWeight: "500",
                fontFamily: "Satoshi",
              }}
            >
              {headline}
            </h1>

            <p
              className="text-lg leading-7 text-[#404040] max-w-[520px] mb-6"
              style={{
                fontFamily: "Satoshi",
              }}
            >
              {subheadline}
            </p>

            <div className="max-w-[520px] mb-0">
              <p
                className="text-base leading-5"
                style={{
                  display: "none",
                }}
              >
                {description}
              </p>
            </div>

            <ul className="flex gap-1.5 flex-wrap mt-10">
              <li>
                <button
                  onClick={() => {
                    const element = document.querySelector(primaryButtonHref)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="block cursor-pointer text-white bg-[#0988f0] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                  style={{
                    background: "#156d95",
                  }}
                >
                  {primaryButtonText}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const element = document.querySelector(secondaryButtonHref)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="block cursor-pointer text-[#202020] border border-[#202020] rounded-full px-[18px] py-[15px] text-base leading-4 whitespace-nowrap transition-all duration-150 ease-[cubic-bezier(0.455,0.03,0.515,0.955)] hover:rounded-2xl"
                >
                  {secondaryButtonText}
                </button>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.8,
              ease: [0.645, 0.045, 0.355, 1],
              delay: 0.2,
            }}
            className="col-span-12 lg:col-span-6 bg-white rounded-[40px] flex justify-center items-center aspect-square overflow-hidden"
          >
            <div className="w-full h-full">
              <HeroSection />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}


