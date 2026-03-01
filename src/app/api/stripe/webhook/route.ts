import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  
  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    );
  }

  // Gestion des événements Stripe
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log("✅ Payment successful:", {
          id: session.id,
          email: session.customer_email,
          plan: session.metadata?.plan,
          userId: session.metadata?.userId,
        });

        // Enregistrement dans la base de données
        if (session.metadata?.userId && session.metadata?.userId !== "guest") {
          const userId = parseInt(session.metadata.userId);
          const plan = session.metadata.plan || "unknown";
          const billingCycle = session.metadata.billingCycle as "monthly" | "yearly";

          // Calculer la date de fin en fonction du cycle de facturation
          const dateDebut = new Date();
          const dateFin = new Date();
          
          if (billingCycle === "yearly") {
            dateFin.setFullYear(dateFin.getFullYear() + 1);
          } else {
            dateFin.setMonth(dateFin.getMonth() + 1);
          }

          try {
            // Créer l'enregistrement Subscription
            await prisma.subscription.create({
              data: {
                user_id: userId,
                plan: plan,
                date_debut: dateDebut,
                date_fin: dateFin,
              },
            });

            // Mettre à jour le rôle de l'utilisateur en PREMIUM_USER
            await prisma.user.update({
              where: { id: userId },
              data: { role: "PREMIUM_USER" },
            });

            console.log("✅ Database updated:", {
              userId,
              plan,
              dateDebut: dateDebut.toISOString(),
              dateFin: dateFin.toISOString(),
              role: "PREMIUM_USER",
            });
          } catch (dbError) {
            console.error("❌ Database error:", dbError);
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("⏰ Checkout session expired:", session.id);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💳 Payment intent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
