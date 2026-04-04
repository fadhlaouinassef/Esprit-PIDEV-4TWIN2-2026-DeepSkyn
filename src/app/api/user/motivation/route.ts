import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getMotivationSummary } from '@/services/badge.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  console.log('[MotivationAPI] Session:', session ? `User ID ${session.user.id}` : 'NULL');

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getMotivationSummary(Number(session.user.id));
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[MotivationAPI] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
