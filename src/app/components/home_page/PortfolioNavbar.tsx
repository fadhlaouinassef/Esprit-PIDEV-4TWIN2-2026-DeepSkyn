"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { LoadingLink } from "../LoadingLink"
import LanguageSwitcher from "../LanguageSwitcher"
import { OPEN_DEEPSKYN_EXPERIENCE_MAP_EVENT } from "./DeepSkynExperienceMap"
import { OPEN_SKIN_QUIZ_EVENT } from "./SkinQuizSection"
import { useTranslations } from "next-intl"

type NavLink = {
  id: "products" | "routines" | "testimonials" | "faq" | "journey" | "game";
  href: string;
};

// @component: PortfolioNavbar
export const PortfolioNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTranslations()

  const navigationLinks: NavLink[] = [
    { id: "products", href: "#products" },
    { id: "routines", href: "#healthy-steps" },
    { id: "testimonials", href: "#testimonials" },
    { id: "faq", href: "#faq" },
    { id: "game", href: "#skin-game" },
    { id: "journey", href: "#healthy-steps" },
  ]

  const openExperienceMap = () => {
    window.dispatchEvent(new Event(OPEN_DEEPSKYN_EXPERIENCE_MAP_EVENT))
    closeMobileMenu()
  }

  const openSkinQuiz = () => {
    window.dispatchEvent(new Event(OPEN_SKIN_QUIZ_EVENT))
    closeMobileMenu()
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }
  const handleLinkClick = (href: string) => {
    closeMobileMenu()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
      })
    }
  }

  // @return
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="shrink-0">
            <button
              onClick={() => handleLinkClick("#home")}
              className="text-2xl font-bold text-foreground hover:text-primary transition-colors duration-200"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              <span
                style={{
                  fontFamily: "Satoshi",
                  fontWeight: "800",
                }}
              >
                DeepSkyn
              </span>
            </button>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === "journey") {
                      openExperienceMap()
                      return
                    }
                    handleLinkClick(link.href)
                  }}
                  className="text-foreground hover:text-primary px-3 py-2 text-base font-medium transition-colors duration-200 relative group"
                  style={{
                    fontFamily: "Satoshi",
                    fontWeight: "500",
                  }}
                >
                  <span>{t(`home.nav.${link.id}`)}</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <LanguageSwitcher />
            <button
              onClick={openSkinQuiz}
              className="rounded-full border border-[#156d95]/35 px-4 py-2 text-sm font-semibold text-[#156d95] transition hover:bg-[#e6f4fb]"
              style={{ fontFamily: "Satoshi" }}
            >
              Skin Test
            </button>
            <button
              onClick={openExperienceMap}
              className="rounded-full border border-[#156d95]/35 px-4 py-2 text-sm font-semibold text-[#156d95] transition hover:bg-[#e6f4fb]"
              style={{
                fontFamily: "Satoshi",
              }}
              aria-label={t('home.nav.openMapAria')}
            >
              {t('home.nav.mapButton')}
            </button>
            <LoadingLink
              href="/signin"
              className="bg-[#156d95] text-white px-4.5 rounded-full text-base font-semibold hover:bg-[#156d95]/90 transition-all duration-200 hover:rounded-2xl shadow-sm hover:shadow-md whitespace-nowrap leading-4 py-3.75 inline-block"
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              <span
                style={{
                  fontFamily: "Satoshi",
                  fontWeight: "500",
                }}
              >
                {t('common.login')}
              </span>
            </LoadingLink>
          </div>

          <div className="md:hidden flex items-center space-x-3">
            <LanguageSwitcher />
            <button
              onClick={toggleMobileMenu}
              className="text-foreground hover:text-primary p-2 rounded-md transition-colors duration-200"
              aria-label={t('home.nav.toggleMobileMenu')}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className="md:hidden bg-background/95 backdrop-blur-md border-t border-border"
          >
            <div className="px-6 py-6 space-y-4">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === "journey") {
                      openExperienceMap()
                      return
                    }
                    handleLinkClick(link.href)
                  }}
                  className="block w-full text-left text-foreground hover:text-primary py-3 text-lg font-medium transition-colors duration-200"
                  style={{
                    fontFamily: "Satoshi, sans-serif",
                    fontWeight: "400",
                  }}
                >
                  <span>{t(`home.nav.${link.id}`)}</span>
                </button>
              ))}
              <button
                onClick={openSkinQuiz}
                className="block w-full rounded-xl border border-[#156d95]/30 px-4 py-3 text-left text-base font-medium text-[#156d95] transition-colors hover:bg-[#e6f4fb]"
                style={{ fontFamily: "Satoshi, sans-serif", fontWeight: "500" }}
              >
                Skin Test
              </button>
              <button
                onClick={openExperienceMap}
                className="block w-full rounded-xl border border-[#156d95]/30 px-4 py-3 text-left text-base font-medium text-[#156d95] transition-colors hover:bg-[#e6f4fb]"
                style={{
                  fontFamily: "Satoshi, sans-serif",
                  fontWeight: "500",
                }}
                aria-label={t('home.nav.openMapAria')}
              >
                {t('home.nav.mapButton')}
              </button>
              <div className="pt-4 border-t border-border">
                <LoadingLink
                  href="/signin"
                  className="w-full bg-[#156d95] text-white px-4.5 py-3.75 rounded-full text-base font-semibold hover:bg-[#156d95]/90 transition-all duration-200 block text-center"
                  style={{
                    fontFamily: "Satoshi, sans-serif",
                  }}
                >
                  <span>{t('common.login')}</span>
                </LoadingLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
