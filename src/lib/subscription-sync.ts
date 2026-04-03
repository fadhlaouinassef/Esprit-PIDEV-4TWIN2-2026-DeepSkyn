import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

type SyncResult = {
  ok: boolean;
  reason?: string;
  action?: "created" | "updated";
  userId?: number;
};

const isMissingAmountFieldError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Unknown argument `amount`");
};

const persistAmountWithSqlFallback = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  subscriptionId: number,
  amount: number
): Promise<void> => {
  await tx.$executeRawUnsafe(
    'UPDATE "Subscription" SET "amount" = $1 WHERE "id" = $2',
    amount,
    subscriptionId
  );
};

const planFromInterval = (interval?: string | null): PlanKey | null => {
  if (interval === "year") return "premium_yearly";
  if (interval === "month") return "premium_monthly";
  return null;
};

const planFromLabel = (label?: string | null): PlanKey | null => {
  if (!label) return null;
  const lowered = label.toLowerCase();
  return lowered.includes("year") ? "premium_yearly" : "premium_monthly";
};

const resolvePlanKey = (
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription | null
): PlanKey | null => {
  const metadataPlan = (session.metadata?.planKey || session.metadata?.plan) as PlanKey | undefined;
  if (metadataPlan && PLANS[metadataPlan]) return metadataPlan;

  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval;
  const intervalPlan = planFromInterval(interval);
  if (intervalPlan) return intervalPlan;

  return planFromLabel(session.metadata?.planLabel);
};

const getAmountFromSession = (session: Stripe.Checkout.Session, planKey: PlanKey): number => {
  if (typeof session.amount_total === "number" && session.amount_total > 0) {
    const divisor = session.currency?.toLowerCase() === "tnd" ? 1000 : 100;
    return session.amount_total / divisor;
  }

  return PLANS[planKey].amountCents / 100;
};

const buildDateRange = (
  billingCycle: "monthly" | "yearly",
  subscription: Stripe.Subscription | null
): { dateDebut: Date; dateFin: Date } => {
  if (subscription?.current_period_start && subscription?.current_period_end) {
    return {
      dateDebut: new Date(subscription.current_period_start * 1000),
      dateFin: new Date(subscription.current_period_end * 1000),
    };
  }

  const dateDebut = new Date();
  const dateFin = new Date(dateDebut);
  if (billingCycle === "yearly") {
    dateFin.setFullYear(dateFin.getFullYear() + 1);
  } else {
    dateFin.setMonth(dateFin.getMonth() + 1);
  }

  return { dateDebut, dateFin };
};

export async function syncSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<SyncResult> {
  const rawUserId = session.metadata?.userId || session.client_reference_id;
  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, reason: "Missing or invalid user id in checkout session metadata." };
  }

  let stripeSubscription: Stripe.Subscription | null = null;
  if (typeof session.subscription === "string" && session.subscription) {
    stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
  } else if (session.subscription && typeof session.subscription !== "string") {
    stripeSubscription = session.subscription as Stripe.Subscription;
  }

  const planKey = resolvePlanKey(session, stripeSubscription);
  if (!planKey) {
    return { ok: false, reason: "Could not resolve plan key from Stripe checkout session." };
  }

  const interval = stripeSubscription?.items?.data?.[0]?.price?.recurring?.interval;
  const billingCycle = interval === "year" ? "yearly" : interval === "month" ? "monthly" : PLANS[planKey].billingCycle;
  const { dateDebut, dateFin } = buildDateRange(billingCycle, stripeSubscription);
  const amount = getAmountFromSession(session, planKey);
  const label = billingCycle === "yearly" ? "Premium Yearly" : "Premium Monthly";

  const action = await prisma.$transaction(async (tx) => {
    const activeSubscription = await tx.subscription.findFirst({
      where: {
        user_id: userId,
        date_fin: { gte: new Date() },
      },
      orderBy: { date_fin: "desc" },
    });

    if (activeSubscription) {
      try {
        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            plan: label,
            date_debut: dateDebut,
            date_fin: dateFin,
            amount,
          },
        });
      } catch (error: unknown) {
        if (!isMissingAmountFieldError(error)) {
          throw error;
        }

        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            plan: label,
            date_debut: dateDebut,
            date_fin: dateFin,
          },
        });

        await persistAmountWithSqlFallback(tx, activeSubscription.id, amount);
      }
    } else {
      try {
        await tx.subscription.create({
          data: {
            user_id: userId,
            plan: label,
            date_debut: dateDebut,
            date_fin: dateFin,
            amount,
          },
        });
      } catch (error: unknown) {
        if (!isMissingAmountFieldError(error)) {
          throw error;
        }

        const createdSubscription = await tx.subscription.create({
          data: {
            user_id: userId,
            plan: label,
            date_debut: dateDebut,
            date_fin: dateFin,
          },
        });

        await persistAmountWithSqlFallback(tx, createdSubscription.id, amount);
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: { role: "PREMIUM_USER" },
    });

    return activeSubscription ? "updated" : "created";
  });

  return { ok: true, action, userId };
}
