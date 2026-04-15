"use client"

import * as React from "react"
import { CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

type PlanLevel = "starter" | "pro" | "enterprise"

interface PricingFeature {
  id:
    | "basicRoutine"
    | "threeProducts"
    | "onlineConsultation"
    | "usageGuide"
    | "completeRoutine"
    | "sixProducts"
    | "monthlyFollowUp"
    | "priorityShipping"
    | "customFormulas"
    | "unlimitedProducts"
    | "dermatologist247"
    | "homeSpa"
    | "aiAnalysis"
    | "mobileApp"
  included: PlanLevel | "all"
}

interface PricingPlan {
  id: "essential" | "premium" | "luxury"
  level: PlanLevel
  price: {
    monthly: number
    yearly: number
  }
  popular?: boolean
}

const features: PricingFeature[] = [
  { id: "basicRoutine", included: "starter" },
  { id: "threeProducts", included: "starter" },
  { id: "onlineConsultation", included: "starter" },
  { id: "usageGuide", included: "starter" },
  { id: "completeRoutine", included: "pro" },
  { id: "sixProducts", included: "pro" },
  { id: "monthlyFollowUp", included: "pro" },
  { id: "priorityShipping", included: "pro" },
  { id: "customFormulas", included: "enterprise" },
  { id: "unlimitedProducts", included: "enterprise" },
  { id: "dermatologist247", included: "enterprise" },
  { id: "homeSpa", included: "enterprise" },
  { id: "aiAnalysis", included: "all" },
  { id: "mobileApp", included: "all" },
]

const plans: PricingPlan[] = [
  {
    id: "essential",
    price: { monthly: 39, yearly: 390 },
    level: "starter",
  },
  {
    id: "premium",
    price: { monthly: 89, yearly: 890 },
    level: "pro",
    popular: true,
  },
  {
    id: "luxury",
    price: { monthly: 199, yearly: 1990 },
    level: "enterprise",
  },
]

function shouldShowCheck(included: PricingFeature["included"], level: PlanLevel): boolean {
  if (included === "all") return true
  if (included === "enterprise" && level === "enterprise") return true
  if (included === "pro" && (level === "pro" || level === "enterprise")) return true
  if (included === "starter") return true
  return false
}

export function PricingSection() {
  const [isYearly, setIsYearly] = React.useState(false)
  const [selectedPlan, setSelectedPlan] = React.useState<PlanLevel>("pro")
  const t = useTranslations()

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-figtree text-[40px] font-normal leading-tight mb-4" style={{ fontFamily: "Satoshi" }}>
            {t('home.pricing.title')}
          </h2>
          <p className="font-figtree text-lg text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "Satoshi" }}>
            {t('home.pricing.subtitle')}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-2 bg-secondary rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2 rounded-full text-lg transition-all",
                !isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              style={{ fontFamily: "Satoshi" }}
            >
              {t('home.pricing.monthly')}
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2 rounded-full text-lg transition-all",
                isYearly ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              style={{ fontFamily: "Satoshi" }}
            >
              {t('home.pricing.yearly')}
              <span className="ml-2 text-sm text-[#156d95]">{t('home.pricing.savePercent', { percent: 17 })}</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.level)}
              className={cn(
                "relative p-8 rounded-2xl text-left transition-all border-2",
                selectedPlan === plan.level
                  ? "border-[#156d95] bg-[#156d95]/5"
                  : "border-border hover:border-[#156d95]/50",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#156d95] text-white px-4 py-1 rounded-full text-sm" style={{ fontFamily: "Satoshi" }}>
                  {t('home.pricing.mostPopular')}
                </span>
              )}
              <div className="mb-6">
                <h3 className="font-figtree text-2xl font-medium mb-2">{t(`home.pricing.plans.${plan.id}`)}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-figtree text-4xl font-medium">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="font-figtree text-lg text-muted-foreground">/{isYearly ? t('home.pricing.perYear') : t('home.pricing.perMonth')}</span>
                </div>
              </div>
              <div
                className={cn(
                  "w-full py-3 px-6 rounded-full text-lg transition-all text-center",
                  selectedPlan === plan.level ? "bg-[#156d95] text-white" : "bg-secondary text-foreground",
                )}
                style={{ fontFamily: "Satoshi" }}
              >
                {selectedPlan === plan.level ? t('home.pricing.selected') : t('home.pricing.selectPlan')}
              </div>
            </button>
          ))}
        </div>

        {/* Features Table */}
        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <div className="min-w-[768px]">
              {/* Table Header */}
              <div className="flex items-center p-6 bg-secondary border-b border-border">
                <div className="flex-1">
                  <h3 className="text-xl font-medium" style={{ fontFamily: "Satoshi" }}>{t('home.pricing.features')}</h3>
                </div>
                <div className="flex items-center gap-8">
                  {plans.map((plan) => (
                    <div key={plan.level} className="w-24 text-center font-figtree text-lg font-medium">
                      {t(`home.pricing.plans.${plan.id}`)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Rows */}
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  className={cn(
                    "flex items-center p-6 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-secondary/30",
                    feature.included === selectedPlan && "bg-[#156d95]/5",
                  )}
                >
                  <div className="flex-1">
                    <span className="font-figtree text-lg">{t(`home.pricing.featuresList.${feature.id}`)}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    {plans.map((plan) => (
                      <div key={plan.level} className="w-24 flex justify-center">
                        {shouldShowCheck(feature.included, plan.level) ? (
                          <div className="w-6 h-6 rounded-full bg-[#156d95] flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <button 
            onClick={() => {
              const element = document.querySelector('#contact')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="bg-[#156d95] text-white px-[18px] py-[15px] rounded-full text-lg hover:rounded-2xl transition-all"
            style={{ fontFamily: "Satoshi" }}>
            {t('home.pricing.getStartedWith', { plan: t(`home.pricing.plans.${plans.find((p) => p.level === selectedPlan)?.id || 'premium'}`) })}
          </button>
        </div>
      </div>
    </section>
  )
}


