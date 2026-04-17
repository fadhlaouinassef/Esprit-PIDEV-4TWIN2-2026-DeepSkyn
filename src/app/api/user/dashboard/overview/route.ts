import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

type ChartMetric = {
  label: string;
  delta: string;
  positive: boolean;
  bars: number[];
};

type RoutineWithSteps = {
  id: number;
  type: string;
  steps: Array<{ id: number }>;
};

type AiRecommendationsPayload = {
  immediate: string[];
  weekly: string[];
  avoid: string[];
  source: 'analysis' | 'fallback';
};

type JourneyMilestone = {
  id: string;
  title: string;
  date: Date;
  image: string;
  current?: boolean;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const toBars = (values: number[], targetLength = 6): number[] => {
  if (values.length === 0) return [34, 29, 31, 21, 27, 15];

  const normalized = values.map((v) => clamp(Math.round(v)));
  if (normalized.length >= targetLength) {
    return normalized.slice(normalized.length - targetLength);
  }

  const padValue = normalized[0];
  const padCount = targetLength - normalized.length;
  return [...Array(padCount).fill(padValue), ...normalized];
};

const formatSignedPercent = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return '0%';
};

const computePercentDelta = (first: number, last: number): number => {
  if (!Number.isFinite(first) || first === 0) {
    return last - first;
  }

  return ((last - first) / Math.abs(first)) * 100;
};

const normalizeDate = (d: Date) => d.toISOString().slice(0, 10);

const toDayStringUTC = (date: Date) => date.toISOString().slice(0, 10);

const isRoutineDone = (routine: RoutineWithSteps, completedStepIds: Set<number>) => {
  if (routine.steps.length === 0) return false;
  return routine.steps.every((step) => completedStepIds.has(step.id));
};

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0);
};

const fallbackAiRecommendations: AiRecommendationsPayload = {
  immediate: ['Use SPF today to protect your barrier.'],
  weekly: ['Increase hydration intake and add a humectant serum.'],
  avoid: ['Avoid over-exfoliation this week for better texture recovery.'],
  source: 'fallback',
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        nom: true,
        prenom: true,
        image: true,
        skin_type: true,
        subscriptions: {
          where: { date_fin: { gte: new Date() } },
          orderBy: { date_fin: 'desc' },
          take: 1,
          select: { plan: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const start30Days = new Date(now);
    start30Days.setDate(start30Days.getDate() - 30);

    let analyses = await prisma.skinScoreAnalysis.findMany({
      where: {
        user_id: user.id,
        trigger: 'final',
        created_at: { gte: start30Days },
      },
      orderBy: { created_at: 'asc' },
      take: 12,
      select: {
        id: true,
        created_at: true,
        score: true,
        hydration: true,
        clarity: true,
        barrier: true,
      },
    });

    if (analyses.length < 2) {
      analyses = await prisma.skinScoreAnalysis.findMany({
        where: {
          user_id: user.id,
          trigger: 'final',
        },
        orderBy: { created_at: 'asc' },
        take: 12,
        select: {
          id: true,
          created_at: true,
          score: true,
          hydration: true,
          clarity: true,
          barrier: true,
        },
      });
    }

    const hydrationSeries = analyses.map((a) => Number(a.hydration || 0));
    const acneSeries = analyses.map((a) => clamp(100 - Number(a.clarity || 0)));
    const textureSeries = analyses.map((a) => Number(a.barrier || 0));

    const firstHydration = hydrationSeries[0] ?? 0;
    const lastHydration = hydrationSeries[hydrationSeries.length - 1] ?? firstHydration;
    const hydrationDelta = computePercentDelta(firstHydration, lastHydration);

    const firstAcne = acneSeries[0] ?? 0;
    const lastAcne = acneSeries[acneSeries.length - 1] ?? firstAcne;
    const acneDelta = computePercentDelta(firstAcne, lastAcne);

    const firstTexture = textureSeries[0] ?? 0;
    const lastTexture = textureSeries[textureSeries.length - 1] ?? firstTexture;
    const textureDeltaRaw = computePercentDelta(firstTexture, lastTexture);

    const textureDelta = Math.abs(textureDeltaRaw) < 2 ? 'Stable' : formatSignedPercent(textureDeltaRaw);
    const texturePositive = textureDelta === 'Stable' || textureDeltaRaw > 0;

    const chartItems: ChartMetric[] = [
      {
        label: 'Acne Level',
        delta: formatSignedPercent(acneDelta),
        positive: lastAcne <= firstAcne,
        bars: toBars(acneSeries),
      },
      {
        label: 'Hydration',
        delta: formatSignedPercent(hydrationDelta),
        positive: lastHydration >= firstHydration,
        bars: toBars(hydrationSeries),
      },
      {
        label: 'Texture',
        delta: textureDelta,
        positive: texturePositive,
        bars: toBars(textureSeries),
      },
    ];

    const latestAnalysis = analyses[analyses.length - 1] ?? null;

    const latestAnalysisWithRecommendations = await prisma.skinScoreAnalysis.findFirst({
      where: {
        user_id: user.id,
        trigger: 'final',
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        recommendations: true,
      },
    });

    const recommendationObject =
      latestAnalysisWithRecommendations?.recommendations &&
      typeof latestAnalysisWithRecommendations.recommendations === 'object'
        ? (latestAnalysisWithRecommendations.recommendations as Record<string, unknown>)
        : null;

    const aiRecommendations: AiRecommendationsPayload = recommendationObject
      ? {
          immediate: toStringList(recommendationObject.immediate),
          weekly: toStringList(recommendationObject.weekly),
          avoid: toStringList(recommendationObject.avoid),
          source: 'analysis',
        }
      : fallbackAiRecommendations;

    const hasAnyRecommendation =
      aiRecommendations.immediate.length > 0 ||
      aiRecommendations.weekly.length > 0 ||
      aiRecommendations.avoid.length > 0;

    const finalAiRecommendations = hasAnyRecommendation ? aiRecommendations : fallbackAiRecommendations;

    const progressDays = Array.from(
      new Set(analyses.map((a) => normalizeDate(a.created_at))).values()
    ).length;

    const answersCount = await prisma.surveyAnswer.count({
      where: { user_id: user.id },
    });

    const completedQuizCount = await prisma.surveyAnswer.groupBy({
      by: ['quiz_id'],
      where: { user_id: user.id },
      _count: { _all: true },
    });

    const routines = await prisma.routine.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        type: true,
        steps: {
          select: { id: true },
        },
      },
    });

    const stepIds = routines.flatMap((routine) => routine.steps.map((step) => step.id));
    const today = toDayStringUTC(now);

    const todayCompletions = stepIds.length
      ? await prisma.routineStepCompletion.findMany({
          where: {
            routine_step_id: { in: stepIds },
            day: today,
          },
          select: { routine_step_id: true },
        })
      : [];

    const completedTodaySet = new Set(todayCompletions.map((row) => row.routine_step_id));
    const morningRoutines = routines.filter((routine) => routine.type === 'morning');
    const nightRoutines = routines.filter((routine) => routine.type === 'night');

    const morningCompleted = morningRoutines.some((routine) => isRoutineDone(routine, completedTodaySet));
    const nightCompleted = nightRoutines.some((routine) => isRoutineDone(routine, completedTodaySet));

    const morningConfigured = morningRoutines.some((routine) => routine.steps.length > 0);
    const nightConfigured = nightRoutines.some((routine) => routine.steps.length > 0);

    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      last7Days.push(toDayStringUTC(d));
    }

    const weekCompletions = stepIds.length
      ? await prisma.routineStepCompletion.findMany({
          where: {
            routine_step_id: { in: stepIds },
            day: { in: last7Days },
          },
          select: {
            routine_step_id: true,
            day: true,
          },
        })
      : [];

    const completedByDay = new Map<string, Set<number>>();
    for (const completion of weekCompletions) {
      if (!completedByDay.has(completion.day)) completedByDay.set(completion.day, new Set());
      completedByDay.get(completion.day)?.add(completion.routine_step_id);
    }

    const routinized = routines.filter((routine) => routine.steps.length > 0);
    const consistencyCompletedDays = last7Days.filter((day) => {
      const daySet = completedByDay.get(day) || new Set<number>();
      return routinized.some((routine) => isRoutineDone(routine, daySet));
    }).length;

    const routineConsistency = routinized.length
      ? Math.round((consistencyCompletedDays / last7Days.length) * 100)
      : 0;

    const hydrationValue = latestAnalysis ? Number(latestAnalysis.hydration || 0) : null;
    const hydrationReminderLevel = hydrationValue === null
      ? 'normal'
      : hydrationValue < 60
      ? 'high'
      : hydrationValue < 75
      ? 'normal'
      : 'good';

    const hydrationReminderMessage = hydrationValue === null
      ? 'Hydration reminder'
      : hydrationValue < 60
      ? 'Hydration low today - drink water and moisturize'
      : hydrationValue < 75
      ? 'Hydration reminder - keep drinking water'
      : 'Hydration level is good today';

    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const scansThisMonth = await prisma.skinScoreAnalysis.count({
      where: {
        user_id: user.id,
        trigger: 'final',
        created_at: { gte: monthStart },
      },
    });

    const latestScans = await prisma.skinScoreAnalysis.findMany({
      where: {
        user_id: user.id,
        trigger: 'final',
      },
      orderBy: { created_at: 'desc' },
      take: 2,
      select: {
        id: true,
        created_at: true,
      },
    });

    let totalScansThisMonth = scansThisMonth;
    let lastScanAt: Date | null = latestScans[0]?.created_at || null;

    if (!lastScanAt) {
      const legacyLastScan = await prisma.skinAnalyse.findFirst({
        where: { user_id: user.id },
        orderBy: { date_creation: 'desc' },
        select: { date_creation: true },
      });

      const legacyMonthCount = await prisma.skinAnalyse.count({
        where: {
          user_id: user.id,
          date_creation: { gte: monthStart },
        },
      });

      totalScansThisMonth = legacyMonthCount;
      lastScanAt = legacyLastScan?.date_creation || null;
    }

    const firstUploadedSurveyImage = await prisma.imageSurvey.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        image: true,
        created_at: true,
        analyse_id: true,
      },
    });

    const latestUploadedSurveyImage = await prisma.imageSurvey.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        image: true,
        created_at: true,
        analyse_id: true,
      },
    });

    const milestones: JourneyMilestone[] = [];

    if (firstUploadedSurveyImage) {
      milestones.push({
        id: `first-${firstUploadedSurveyImage.id}`,
        title: 'First Uploaded Scan',
        date: firstUploadedSurveyImage.created_at,
        image: firstUploadedSurveyImage.image,
      });
    }

    if (latestUploadedSurveyImage) {
      const isSameUpload = firstUploadedSurveyImage?.id === latestUploadedSurveyImage.id;
      if (isSameUpload) {
        if (milestones.length > 0) {
          milestones[0] = {
            ...milestones[0],
            current: true,
          };
        }
      } else {
        milestones.push({
          id: `latest-${latestUploadedSurveyImage.id}`,
          title: 'Latest Uploaded Scan',
          date: latestUploadedSurveyImage.created_at,
          image: latestUploadedSurveyImage.image,
          current: true,
        });
      }
    }

    const hasUploadedSurveyImages = Boolean(firstUploadedSurveyImage || latestUploadedSurveyImage);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          fullName: `${user.prenom || ''} ${user.nom || ''}`.trim(),
          image: user.image,
          skinType: user.skin_type,
          plan: user.subscriptions[0]?.plan || 'FREE',
        },
        summary: {
          skinScore: latestAnalysis ? Math.round(Number(latestAnalysis.score || 0)) : null,
          hasAnalysis: Boolean(latestAnalysis),
          lastAnalysisAt: latestAnalysis?.created_at || null,
          periodDays: Math.max(progressDays, 30),
        },
        quiz: {
          answersCount,
          completedQuizCount: completedQuizCount.length,
        },
        progressOverview: {
          chartItems,
        },
        routineToday: {
          morning: {
            configured: morningConfigured,
            completed: morningCompleted,
          },
          night: {
            configured: nightConfigured,
            completed: nightCompleted,
          },
          consistency: {
            percentage: routineConsistency,
          },
          hydrationReminder: {
            level: hydrationReminderLevel,
            message: hydrationReminderMessage,
          },
        },
        recentScans: {
          totalThisMonth: totalScansThisMonth,
          lastScanAt,
          canCompare: latestScans.length >= 2,
          currentAnalysisId: latestScans[0]?.id || null,
          previousAnalysisId: latestScans[1]?.id || null,
        },
        aiRecommendations: {
          ...finalAiRecommendations,
          analysisId: latestAnalysisWithRecommendations?.id || null,
          generatedAt: latestAnalysisWithRecommendations?.created_at || null,
        },
        skinJourney: {
          hasUploadedSurveyImages,
          firstUploadedImage: firstUploadedSurveyImage
            ? {
                id: firstUploadedSurveyImage.id,
                image: firstUploadedSurveyImage.image,
                createdAt: firstUploadedSurveyImage.created_at,
                analysisId: firstUploadedSurveyImage.analyse_id,
              }
            : null,
          latestUploadedImage: latestUploadedSurveyImage
            ? {
                id: latestUploadedSurveyImage.id,
                image: latestUploadedSurveyImage.image,
                createdAt: latestUploadedSurveyImage.created_at,
                analysisId: latestUploadedSurveyImage.analyse_id,
              }
            : null,
          milestones,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard overview' }, { status: 500 });
  }
}