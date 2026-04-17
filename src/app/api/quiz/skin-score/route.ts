import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { getAnalysisAccessStatus } from '@/lib/premium-access';
import { computeAndStoreSkinScoreAnalysis } from '@/services/skinScoreAnalysis.service';
import { evaluateAndAwardBadgesForUser } from '@/services/badge.service';
import { createNotification } from '@/services/notification.service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!sessionUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const access = await getAnalysisAccessStatus(sessionUser.id);

    return NextResponse.json({
      isPremium: access.isPremium,
      role: access.role,
      hasActiveSubscription: access.hasActiveSubscription,
      canCreateAnalysis: access.canCreateAnalysis,
      lastAnalysisAt: access.lastAnalysisAt,
      nextAvailableAt: access.nextAvailableAt,
      remainingMs: access.remainingMs,
      limits: {
        maxSurveyImages: access.isPremium ? 5 : 1,
        autoRoutineEnabled: access.isPremium,
        productRecommendationsEnabled: access.isPremium,
      },
    });
  } catch (error: unknown) {
    console.error('Skin score access check error:', error);
    return NextResponse.json({ error: 'Failed to fetch analysis access status.' }, { status: 500 });
  }
}

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
      finalRecommendationsOverride?: unknown;
      finalRoutineOverride?: unknown;
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

    const access = await getAnalysisAccessStatus(targetUserId);
    if (!access.canCreateAnalysis) {
      return NextResponse.json(
        {
          error: 'Daily analysis limit reached for free users. Please try again later.',
          code: 'ANALYSIS_LIMIT_REACHED',
          isPremium: access.isPremium,
          role: access.role,
          lastAnalysisAt: access.lastAnalysisAt,
          nextAvailableAt: access.nextAvailableAt,
          remainingMs: access.remainingMs,
        },
        { status: 429 }
      );
    }

    const quizId = body.quizId && Number.isFinite(Number(body.quizId)) ? Number(body.quizId) : undefined;

    const result = await computeAndStoreSkinScoreAnalysis({
      userId: targetUserId,
      quizId,
      trigger: 'final',
      saveLegacySkinAnalyse: true,
      finalSummaryOverride: String(body.finalSummaryOverride || ''),
      finalScoreOverride: Number(body.finalScoreOverride),
      finalRecommendationsOverride: body.finalRecommendationsOverride,
      finalRoutineOverride: body.finalRoutineOverride,
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

    if (!access.isPremium) {
      result.recommendations = {
        immediate: [],
        weekly: [],
        avoid: [],
        detailedImmediate: [],
        detailedWeekly: [],
        detailedAvoid: [],
      };
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('Skin score analysis error:', error);
    return NextResponse.json({ error: 'Failed to compute skin score analysis.' }, { status: 500 });
  }
}
