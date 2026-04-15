'use client'

import { motion } from "framer-motion"
import { PortfolioNavbar } from "@/app/components/home_page/PortfolioNavbar"
import { ProductTeaserCard } from "@/app/components/home_page/ProductTeaserCard"
import { BankingScaleHero } from "@/app/components/home_page/BankingScaleHero"
import { CaseStudiesCarousel } from "@/app/components/home_page/CaseStudiesCarousel"
import { IntegrationCarousel } from "@/app/components/home_page/IntegrationCarousel"
import { PricingSection } from "@/app/components/home_page/PricingSection"
import { FAQSection } from "@/app/components/home_page/FAQSection"
import { Footer } from "@/app/components/home_page/Footer"
import HealthyStepsSection from "@/app/components/home_page/HealthyStepsSection"
import DeepSkynExperienceMap from "@/app/components/home_page/DeepSkynExperienceMap"



const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  return (
    <motion.div
      id="home"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <DeepSkynExperienceMap key="deepskyn-onboarding-main" />

      <motion.div variants={fadeInUp} key="navbar-container">
        <PortfolioNavbar />
      </motion.div>
            
      <motion.section id="products" variants={fadeInUp}>
        <ProductTeaserCard />
      </motion.section>
      
      <motion.div variants={fadeInUp}>
        <BankingScaleHero />
      </motion.div>
      
      <motion.section id="testimonials" variants={fadeInUp}>
        <CaseStudiesCarousel />
      </motion.section>
      
      <motion.div variants={fadeInUp}>
        <IntegrationCarousel />
      </motion.div>

      <motion.section id="healthy-steps" variants={fadeInUp}>
      <HealthyStepsSection />
      </motion.section>

      
      <motion.div variants={fadeInUp}>
        <PricingSection />
      </motion.div>
      
      <motion.section id="faq" variants={fadeInUp}>
        <FAQSection />
      </motion.section>
      
      <motion.div variants={fadeInUp}>
        <Footer />
      </motion.div>
    </motion.div>
    
  )
}
