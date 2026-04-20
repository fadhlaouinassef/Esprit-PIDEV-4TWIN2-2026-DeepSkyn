import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { findUserByEmail } from '@/services/user.service';
import { getUserPromos, markPromoCodeAsUsed } from '@/services/promo.service';

const resolveUserId = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  if (session.user.id && Number.isFinite(Number(session.user.id))) {
    return Number(session.user.id);
  }

  if (!session.user.email) return null;
  const user = await findUserByEmail(session.user.email);
  return user?.id ?? null;
};

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promos = await getUserPromos(userId);
    return NextResponse.json({ promos }, { status: 200 });
  } catch (error) {
    console.error('[PromosAPI] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch promos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { promoCodeId?: number; action?: string };
    const promoCodeId = Number(body.promoCodeId);

    if (!Number.isFinite(promoCodeId)) {
      return NextResponse.json({ error: 'Missing promoCodeId' }, { status: 400 });
    }

    if (String(body.action || 'mark_used') !== 'mark_used') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const updated = await markPromoCodeAsUsed({ userId, promoCodeId });
    if (!updated) {
      return NextResponse.json({ error: 'Promo not found' }, { status: 404 });
    }

    return NextResponse.json({ promo: updated }, { status: 200 });
  } catch (error) {
    console.error('[PromosAPI] POST error:', error);
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 });
  }
}
