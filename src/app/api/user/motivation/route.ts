import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getMotivationSummary } from '@/services/badge.service';
import { findUserByEmail } from '@/services/user.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log('[MotivationAPI] Session:', session ? `User ID ${session.user?.id ?? 'N/A'}` : 'NULL');

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let userId = session.user.id ? Number(session.user.id) : NaN;

    if (!Number.isFinite(userId) && session.user.email) {
      const dbUser = await findUserByEmail(session.user.email);
      userId = dbUser?.id ?? NaN;
    }

    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getMotivationSummary(userId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[MotivationAPI] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
