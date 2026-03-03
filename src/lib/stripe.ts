import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

// Types des plans disponibles
export type PlanKey = "basic_monthly" | "pro_monthly" | "pro_yearly";

// Configuration des plans
export const PLANS: Record<PlanKey, { 
  label: string; 
  amountCents: number; 
  currency: string;
  billingCycle: "monthly" | "yearly";
}> = {
  basic_monthly: { 
    label: "Basic Monthly", 
    amountCents: 999, // $9.99
    currency: "usd",
    billingCycle: "monthly"
  },
  pro_monthly: { 
    label: "Pro Monthly", 
    amountCents: 1999, // $19.99
    currency: "usd",
    billingCycle: "monthly"
  },
  pro_yearly: { 
    label: "Pro Yearly", 
    amountCents: 19900, // $199.00
    currency: "usd",
    billingCycle: "yearly"
  },
};
