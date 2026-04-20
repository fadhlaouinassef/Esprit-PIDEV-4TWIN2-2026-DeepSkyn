"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

type BillingCycle = "monthly" | "yearly"

interface PricingPlan {
  id: "free" | "premiumMonthly" | "premiumYearly"
  name: string
  price: number
  period: "month" | "year"
  popular?: boolean
  savingsText?: string
  originalPrice?: number
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
  },
  {
    id: "premiumMonthly",
    name: "Premium Monthly",
    price: 20,
    period: "month",
  },
  {
    id: "premiumYearly",
    name: "Premium Yearly",
    price: 160,
    period: "year",
    popular: true,
    savingsText: "Save 40 DT",
    originalPrice: 200,
  },
]

const comparisonFeatures = [
  {
    feature: "AI Skin Analysis",
    free: "Basic",
    premium: "Advanced",
  },
  {
    feature: "Facial Image Upload",
    free: "1 image",
    premium: "Up to 5 images",
  },
  {
    feature: "Skin Profile",
    free: "Basic results",
    premium: "Detailed AI profile",
  },
  {
    feature: "Skin Health Score",
    free: "Basic",
    premium: "Detailed",
  },
  {
    feature: "Real Age vs Skin Age",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Skincare Routine",
    free: "Basic routine",
    premium: "AM/PM personalized routine",
  },
  {
    feature: "Routine Customization",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Ingredient Conflict Alerts",
    free: "—",
    premium: "Included",
  },
  {
    feature: "Skin Evolution Tracking",
    free: "—",
    premium: "Included",
  },
  {
    feature: "AI Dermatology Coach",
    free: "—",
    premium: "Personalized guidance",
  },
]

export function PricingSection() {
  const t = useTranslations()

  const [billingCycle, setBillingCycle] =
    React.useState<BillingCycle>("monthly")

  const [selectedPlan, setSelectedPlan] = React.useState<
    "free" | "premiumMonthly" | "premiumYearly"
  >("premiumMonthly")

  return (
    <section className="py-16 bg-background">
      <div className="mx-auto max-w-5xl px-4">
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-medium mb-2">
            {t("home.pricing.title")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("home.pricing.subtitle")}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-secondary rounded-full p-1">
            <button
              onClick={() => {
                setBillingCycle("monthly")
                setSelectedPlan("premiumMonthly")
              }}
              className={cn(
                "px-5 py-1.5 text-sm rounded-full transition",
                billingCycle === "monthly"
                  ? "bg-white shadow text-black"
                  : "text-muted-foreground"
              )}
            >
              Monthly
            </button>

            <button
              onClick={() => {
                setBillingCycle("yearly")
                setSelectedPlan("premiumYearly")
              }}
              className={cn(
                "px-5 py-1.5 text-sm rounded-full transition",
                billingCycle === "yearly"
                  ? "bg-white shadow text-black"
                  : "text-muted-foreground"
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-[#156d95]">-40DT</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "relative p-5 rounded-xl border text-left transition",
                selectedPlan === plan.id
                  ? "border-[#156d95] bg-[#156d95]/5"
                  : "border-border hover:border-[#156d95]/40"
              )}
            >
              {/* Badge */}
              {plan.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-[#156d95] text-white px-3 py-0.5 rounded-full">
                  Most popular
                </span>
              )}

              {/* Title */}
              <h3 className="text-lg font-medium mb-2">{plan.name}</h3>

              {/* Price */}
              <div className="flex items-end gap-2 mb-3">
                {plan.originalPrice && (
                  <span className="text-xs text-gray-400 line-through">
                    {plan.originalPrice}DT
                  </span>
                )}

                <span className="text-2xl font-semibold">
                  {plan.price}DT
                </span>

                <span className="text-xs text-muted-foreground mb-[2px]">
                  /{plan.period}
                </span>
              </div>

              {/* Save text */}
              {plan.savingsText && (
                <p className="text-xs text-green-600 mb-3">
                  {plan.savingsText}
                </p>
              )}

              {/* Button */}
              <div
                className={cn(
                  "text-center text-sm py-2 rounded-full transition",
                  selectedPlan === plan.id
                    ? "bg-[#156d95] text-white"
                    : "bg-secondary"
                )}
              >
                {selectedPlan === plan.id ? "Selected" : "Select"}
              </div>
            </button>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-10">
          <div className="text-center mb-4">
            <h3 className="text-xl font-medium">Compare Plans</h3>
            <p className="text-sm text-muted-foreground mt-1">
              See what you get with Free and Premium
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-3 bg-secondary/60 border-b border-border">
              <div className="p-4 text-sm font-medium">Features</div>
              <div className="p-4 text-sm font-medium text-center">Free</div>
              <div className="p-4 text-sm font-medium text-center text-[#156d95]">
                Premium
              </div>
            </div>

            {comparisonFeatures.map((item, index) => (
              <div
                key={item.feature}
                className={cn(
                  "grid grid-cols-3 border-b border-border last:border-b-0",
                  index % 2 === 0 ? "bg-background" : "bg-secondary/20"
                )}
              >
                <div className="p-4 text-sm">{item.feature}</div>
                <div className="p-4 text-sm text-center text-muted-foreground">
                  {item.free}
                </div>
                <div className="p-4 text-sm text-center font-medium text-[#156d95]">
                  {item.premium}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button className="bg-[#156d95] text-white px-5 py-2 rounded-full text-sm hover:opacity-90">
            {t("home.pricing.getStartedWith", {
              plan:
                plans.find((p) => p.id === selectedPlan)?.name ||
                "Premium",
            })}
          </button>
        </div>
      </div>
    </section>
  )
}