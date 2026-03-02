import { NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId } = body as { plan?: PlanKey; userId?: string };

    // Validation du plan
    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan selected" }, 
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const selectedPlan = PLANS[plan];

    // Création de la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // Paiement unique (peut être changé en "subscription" pour abonnements récurrents)
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            unit_amount: selectedPlan.amountCents,
            product_data: { 
              name: selectedPlan.label,
              description: `DeepSkyn ${selectedPlan.label} - Premium skin analysis access`
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/user/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/user/billing/cancel`,
      metadata: {
        plan,
        userId: userId || "guest",
        billingCycle: selectedPlan.billingCycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
