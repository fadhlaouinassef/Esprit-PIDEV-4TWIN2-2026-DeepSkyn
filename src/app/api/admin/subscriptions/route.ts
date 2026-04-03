import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type BillingCycle = 'monthly' | 'yearly';

const isMissingAmountFieldError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Unknown argument `amount`');
};

function detectBillingCycle(rawPlan: string, dateDebut: Date, dateFin: Date): BillingCycle {
  const lowered = rawPlan.toLowerCase();
  if (/(year|annual|annuel|yearly)/i.test(lowered)) return 'yearly';
  if (/(month|monthly|mensuel)/i.test(lowered)) return 'monthly';

  const diffMs = dateFin.getTime() - dateDebut.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 45 ? 'yearly' : 'monthly';
}

function defaultAmountForCycle(cycle: BillingCycle): number {
  return cycle === 'yearly' ? 200 : 20;
}

function getPaymentStatus(dateFin: Date): 'Paid' | 'Expiring' | 'Expired' {
  const now = new Date();
  if (dateFin < now) return 'Expired';
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (dateFin <= oneWeekLater) return 'Expiring';
  return 'Paid';
}

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { date_debut: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const data = subscriptions.map((sub) => {
      const billingCycle = detectBillingCycle(sub.plan, sub.date_debut, sub.date_fin);
      const amount = sub.amount ?? defaultAmountForCycle(billingCycle);
      const paymentStatus = getPaymentStatus(sub.date_fin);
      const monthlyAmount = billingCycle === 'yearly' ? amount / 12 : amount;

      // Build display name + initials
      const nom = sub.user.nom ?? '';
      const prenom = sub.user.prenom ?? '';
      const fullName =
        nom || prenom ? `${prenom} ${nom}`.trim() : sub.user.email.split('@')[0];
      const initials =
        (prenom.charAt(0) + nom.charAt(0)).toUpperCase() ||
        sub.user.email.slice(0, 2).toUpperCase();

      return {
        id: sub.id,
        userId: sub.user.id,
        userName: fullName,
        email: sub.user.email,
        image: sub.user.image ?? null,
        initials,
        plan: sub.plan,
        date_debut: sub.date_debut.toISOString(),
        date_fin: sub.date_fin.toISOString(),
        paymentStatus,
        amount,
        billingCycle,
        monthlyAmount,
      };
    });

    // Backfill missing amount values in DB for legacy rows.
    const rowsToBackfill = subscriptions.filter((sub) => sub.amount == null);
    if (rowsToBackfill.length > 0) {
      await Promise.all(
        rowsToBackfill.map(async (sub) => {
          const cycle = detectBillingCycle(sub.plan, sub.date_debut, sub.date_fin);
          const fallbackAmount = defaultAmountForCycle(cycle);

          try {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: { amount: fallbackAmount },
            });
          } catch (error: unknown) {
            if (!isMissingAmountFieldError(error)) {
              throw error;
            }

            await prisma.$executeRawUnsafe(
              'UPDATE "Subscription" SET "amount" = $1 WHERE "id" = $2',
              fallbackAmount,
              sub.id
            );
          }
        })
      );
    }

    return NextResponse.json({ subscriptions: data });
  } catch (error) {
    console.error('[admin/subscriptions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
