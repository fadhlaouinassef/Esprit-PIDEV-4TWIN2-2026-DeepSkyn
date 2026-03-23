import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { computeAndStoreSkinScoreAnalysis } from '@/services/skinScoreAnalysis.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      userId?: number;
      quizId?: number;
    };

    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, age: true, skin_type: true },
    });

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserId = Number(body.userId) || sessionUser.id;
    if (targetUserId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = body.quizId && Number.isFinite(Number(body.quizId)) ? Number(body.quizId) : undefined;

    const result = await computeAndStoreSkinScoreAnalysis({
      userId: targetUserId,
      quizId,
      trigger: 'final',
      saveLegacySkinAnalyse: true,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Skin score analysis error:', error);
    return NextResponse.json({ error: 'Failed to compute skin score analysis.' }, { status: 500 });
  }
}
