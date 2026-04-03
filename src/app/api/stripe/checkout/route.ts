import { NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, userId } = body as { plan?: PlanKey; userId?: string };

    // Plan validation
    if (!plan || !PLANS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan selected" }, 
        { status: 400 }
      );
    }

    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json(
        { error: "A valid authenticated user is required for subscription" },
        { status: 401 }
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
    const selectedPlan = PLANS[plan];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", 
      payment_method_types: ["card"],
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            unit_amount: selectedPlan.amountCents,
            product_data: { 
              name: selectedPlan.label,
              description: `DeepSkyn ${selectedPlan.label} - Premium skin analysis access`
            },
            recurring: {
              interval: selectedPlan.billingCycle === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/user/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/user/billing`,
      metadata: {
        userId,
        planKey: plan,
        planLabel: selectedPlan.label,
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
