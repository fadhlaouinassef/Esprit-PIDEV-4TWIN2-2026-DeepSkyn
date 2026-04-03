import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Available subscription plans
export type PlanKey = "premium_monthly" | "premium_yearly";

// Plan configuration
export const PLANS: Record<PlanKey, {
  label: string;
  amountCents: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
}> = {
  premium_monthly: {
    label: "Premium Monthly",
    amountCents: 2000, // 20.00 USD (Stripe uses cents)
    currency: "usd",
    billingCycle: "monthly"
  },
  premium_yearly: {
    label: "Premium Yearly",
    amountCents: 20000, // 200.00 USD
    currency: "usd",
    billingCycle: "yearly"
  },
};



