import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromCheckoutSession } from "@/lib/subscription-sync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = body?.sessionId as string | undefined;

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Invalid Stripe session id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (!session || session.mode !== "subscription") {
      return NextResponse.json({ error: "Checkout session is not a subscription session" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment is not completed yet", paymentStatus: session.payment_status },
        { status: 409 }
      );
    }

    const result = await syncSubscriptionFromCheckoutSession(session);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Failed to sync subscription" }, { status: 400 });
    }

    return NextResponse.json({
      status: "success",
      action: result.action,
      userId: result.userId,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Stripe confirm-session error:", errorMessage);
    return NextResponse.json(
      { error: errorMessage || "Failed to confirm subscription session" },
      { status: 500 }
    );
  }
}
