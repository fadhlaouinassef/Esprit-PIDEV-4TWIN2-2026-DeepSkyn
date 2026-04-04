import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { computeAndStoreSkinScoreAnalysis } from '@/services/skinScoreAnalysis.service';
import { evaluateAndAwardBadgesForUser } from '@/services/badge.service';
import { createNotification } from '@/services/notification.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      userId?: number;
      quizId?: number;
      finalSummaryOverride?: string;
      finalScoreOverride?: number;
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
      finalSummaryOverride: String(body.finalSummaryOverride || ''),
      finalScoreOverride: Number(body.finalScoreOverride),
    });

    await evaluateAndAwardBadgesForUser({
      userId: targetUserId,
      trigger: 'analysis_final',
    });

    // Create & Emit notification via service
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { nom: true, image: true }
    });

    await createNotification({
      userId: targetUserId,
      image: user?.image || "/avatar.png",
      title: `${user?.nom || 'User'} completed a skin analysis!`,
      subTitle: `Score: ${result.score}/100 - View details`,
      type: 'analyse',
      score: result.score,
      message: 'completed an analysis!',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Skin score analysis error:', error);
    return NextResponse.json({ error: 'Failed to compute skin score analysis.' }, { status: 500 });
  }
}
