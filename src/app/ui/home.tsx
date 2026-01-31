import { PortfolioNavbar } from "@/app/components/home_page/PortfolioNavbar"
import { ProductTeaserCard } from "@/app/components/home_page/ProductTeaserCard"
import { BankingScaleHero } from "@/app/components/home_page/BankingScaleHero"
import { CaseStudiesCarousel } from "@/app/components/home_page/CaseStudiesCarousel"
import { IntegrationCarousel } from "@/app/components/home_page/IntegrationCarousel"
import { PricingSection } from "@/app/components/home_page/PricingSection"
import { FAQSection } from "@/app/components/home_page/FAQSection"
import { Footer } from "@/app/components/home_page/Footer"

export default function HomePage() {
  return (
    <>
      <PortfolioNavbar />
      <section id="products">
        <ProductTeaserCard />
      </section>
      <BankingScaleHero />
      <section id="testimonials">
        <CaseStudiesCarousel />
      </section>
      <IntegrationCarousel />
      <PricingSection />
      <section id="faq">
        <FAQSection />
      </section>
      <Footer />
    </>
  )
}
