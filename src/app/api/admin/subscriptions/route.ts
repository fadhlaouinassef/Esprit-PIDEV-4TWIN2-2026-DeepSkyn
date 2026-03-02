import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Normalize plan name: strip _yearly / _monthly suffixes, capitalize
// e.g. "pro_yearly" → "Pro",  "PREMIUM_MONTHLY" → "Premium"
function normalizePlan(raw: string): string {
  return raw
    .replace(/[_-](yearly|monthly|annual|annuel|mensuel)/gi, '')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Plan pricing map (keys are normalized uppercased names)
const PLAN_AMOUNTS: Record<string, number> = {
  BASIC: 19.99,
  PRO: 49.99,
  PREMIUM: 79.99,
};

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
      const plan = normalizePlan(sub.plan);
      const planKey = plan.toUpperCase();
      const amount = PLAN_AMOUNTS[planKey] ?? 0;
      const paymentStatus = getPaymentStatus(sub.date_fin);

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
        plan,                                    // normalized name
        date_debut: sub.date_debut.toISOString(),
        date_fin: sub.date_fin.toISOString(),
        paymentStatus,
        amount,
      };
    });

    return NextResponse.json({ subscriptions: data });
  } catch (error) {
    console.error('[admin/subscriptions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
