import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { analyzeUserTrendWithTensorflow, type TrendInputPoint } from "@/modele/analysisTrendModel";
import { loadPretrainedTrendArtifact } from "@/modele/trendModelLoader";

type AnalysisRow = {
  id: number;
  score: number | string | null;
  hydration: number | string | null;
  clarity: number | string | null;
  calmness: number | string | null;
  created_at: Date | string;
};

type RoutineRow = {
  steps: Array<{ id: number }>;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const startOfUtcDay = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const dayKeyUTC = (value: Date): string => startOfUtcDay(value).toISOString().slice(0, 10);

const addDaysUTC = (value: Date, days: number): Date =>
  new Date(startOfUtcDay(value).getTime() + days * MS_PER_DAY);

const dayDiffUTC = (from: Date, to: Date): number =>
  Math.floor((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);

const buildDayRangeUTC = (start: Date, end: Date): string[] => {
  const out: string[] = [];
  const span = dayDiffUTC(start, end);
  if (span < 0) return out;

  for (let i = 0; i <= span; i += 1) {
    out.push(dayKeyUTC(addDaysUTC(start, i)));
  }

  return out;
};

const buildRoutineMessage = (
  locale: string,
  trendDirection: "improving" | "declining" | "stable",
  routineDelta: number,
  recentPct: number,
  previousPct: number
): string => {
  const isFr = locale.startsWith("fr");
  const isAr = locale.startsWith("ar");
  const trend =
    routineDelta >= 8 ? "up" :
    routineDelta <= -8 ? "down" :
    "stable";

  const deltaText = `${routineDelta >= 0 ? "+" : ""}${routineDelta.toFixed(1)}`;

  if (isFr) {
    if (trendDirection === "improving" && trend === "up") {
      return `La progression est probablement soutenue par une meilleure adherence routine (${deltaText} pts, ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
    }
    if (trendDirection === "declining" && trend === "down") {
      return `La chute est probablement liee a une baisse de regularite routine (${deltaText} pts, ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
    }
    if (trendDirection === "declining" && trend === "up") {
      return `Malgre une meilleure routine (${deltaText} pts), la chute semble surtout due aux indicateurs biologiques (hydratation/sebum/sensibilite).`;
    }
    if (trendDirection === "improving" && trend === "down") {
      return `La peau progresse mais la routine recule (${deltaText} pts); maintenir la regularite peut consolider cette progression.`;
    }
    return `Coherence routine recente: ${recentPct.toFixed(1)}% (periode precedente: ${previousPct.toFixed(1)}%, ecart ${deltaText} pts).`;
  }

  if (isAr) {
    if (trendDirection === "improving" && trend === "up") {
      return `التحسن مرتبط غالبا بارتفاع الالتزام بالروتين (${deltaText} نقطة، ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
    }
    if (trendDirection === "declining" && trend === "down") {
      return `التراجع مرتبط غالبا بانخفاض الالتزام بالروتين (${deltaText} نقطة، ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
    }
    if (trendDirection === "declining" && trend === "up") {
      return `رغم تحسن الالتزام بالروتين (${deltaText} نقطة)، يبدو ان التراجع مرتبط اكثر بمؤشرات البشرة الحيوية.`;
    }
    if (trendDirection === "improving" && trend === "down") {
      return `هناك تحسن في البشرة لكن الالتزام بالروتين انخفض (${deltaText} نقطة)، والثبات قد يدعم التحسن اكثر.`;
    }
    return `اتساق الروتين حديثا: ${recentPct.toFixed(1)}% (الفترة السابقة: ${previousPct.toFixed(1)}%، الفارق ${deltaText} نقطة).`;
  }

  if (trendDirection === "improving" && trend === "up") {
    return `The improvement is likely supported by better routine adherence (${deltaText} pts, ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
  }
  if (trendDirection === "declining" && trend === "down") {
    return `The decline is likely linked to lower routine consistency (${deltaText} pts, ${previousPct.toFixed(1)}% -> ${recentPct.toFixed(1)}%).`;
  }
  if (trendDirection === "declining" && trend === "up") {
    return `Despite better routine adherence (${deltaText} pts), the decline appears more related to biological skin metrics.`;
  }
  if (trendDirection === "improving" && trend === "down") {
    return `Skin is improving but routine consistency dropped (${deltaText} pts); consistency can help sustain gains.`;
  }
  return `Recent routine consistency: ${recentPct.toFixed(1)}% (previous period: ${previousPct.toFixed(1)}%, delta ${deltaText} pts).`;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userId = Number(session.user.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      if (!session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userRows = await prisma.$queryRawUnsafe<{ id: number }[]>(
        `SELECT id FROM "User" WHERE email = $1 LIMIT 1`,
        session.user.email
      );

      if (!userRows || userRows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userId = Number(userRows[0].id);
    }

    const locale = request.nextUrl.searchParams.get("locale") || "en";

    const analyses = await prisma.$queryRawUnsafe<AnalysisRow[]>(
      `
      SELECT id, score, hydration, clarity, calmness, created_at
      FROM "SkinScoreAnalysis"
      WHERE user_id = $1 AND trigger = 'final'
      ORDER BY created_at DESC
      `,
      userId
    );

    if (!analyses || analyses.length < 3) {
      return NextResponse.json({ insight: null }, { status: 200 });
    }

    const points: TrendInputPoint[] = analyses.map((analysis: AnalysisRow) => {
      const calmness = Number(analysis.calmness || 0);

      return {
        id: analysis.id,
        score: Number(analysis.score || 0),
        hydration: Number(analysis.hydration || 0),
        oilProduction: Math.round(100 - Number(analysis.clarity || 0)),
        sensitivity: calmness < 50 ? "High" : calmness < 75 ? "Medium" : "Low",
        date: new Date(analysis.created_at).toISOString(),
      };
    });

    const pretrainedArtifact = await loadPretrainedTrendArtifact();
    const insight = await analyzeUserTrendWithTensorflow(
      points,
      locale,
      pretrainedArtifact
        ? { pretrainedArtifact, disableTraining: true }
        : { cacheKey: `user:${userId}` }
    );

    if (!insight) {
      return NextResponse.json({ insight: null }, { status: 200 });
    }

    const routines = await prisma.routine.findMany({
      where: { user_id: userId },
      select: {
        steps: {
          select: { id: true },
        },
      },
    }) as RoutineRow[];

    const stepIds = routines.flatMap((routine: RoutineRow) => routine.steps.map((step: { id: number }) => step.id));

    let routineContext: {
      recentConsistency: number;
      previousConsistency: number;
      deltaConsistency: number;
      windowDays: number;
    } | null = null;

    if (stepIds.length > 0 && analyses.length >= 2) {
      const latestAt = new Date(analyses[0].created_at);
      const previousAt = new Date(analyses[1].created_at);

      const recentWindowDays = clamp(Math.abs(dayDiffUTC(previousAt, latestAt)) + 1, 3, 14);
      const recentEnd = startOfUtcDay(latestAt);
      const recentStart = addDaysUTC(recentEnd, -(recentWindowDays - 1));

      const previousEnd = addDaysUTC(recentStart, -1);
      const previousStart = addDaysUTC(previousEnd, -(recentWindowDays - 1));

      const recentDays = buildDayRangeUTC(recentStart, recentEnd);
      const previousDays = buildDayRangeUTC(previousStart, previousEnd);

      const [recentCompletions, previousCompletions] = await Promise.all([
        prisma.routineStepCompletion.findMany({
          where: {
            routine_step_id: { in: stepIds },
            day: { in: recentDays },
          },
          select: { routine_step_id: true, day: true },
          distinct: ["routine_step_id", "day"],
        }),
        prisma.routineStepCompletion.findMany({
          where: {
            routine_step_id: { in: stepIds },
            day: { in: previousDays },
          },
          select: { routine_step_id: true, day: true },
          distinct: ["routine_step_id", "day"],
        }),
      ]);

      const expectedRecent = Math.max(stepIds.length * Math.max(recentDays.length, 1), 1);
      const expectedPrevious = Math.max(stepIds.length * Math.max(previousDays.length, 1), 1);

      const recentConsistency = (recentCompletions.length / expectedRecent) * 100;
      const previousConsistency = (previousCompletions.length / expectedPrevious) * 100;
      const deltaConsistency = recentConsistency - previousConsistency;

      routineContext = {
        recentConsistency: Number(recentConsistency.toFixed(1)),
        previousConsistency: Number(previousConsistency.toFixed(1)),
        deltaConsistency: Number(deltaConsistency.toFixed(1)),
        windowDays: recentWindowDays,
      };

      const routineMessage = buildRoutineMessage(
        locale.toLowerCase(),
        insight.direction,
        routineContext.deltaConsistency,
        routineContext.recentConsistency,
        routineContext.previousConsistency
      );

      insight.why = `${insight.why} ${routineMessage}`.trim();
      if (insight.clarity?.plainWhy) {
        insight.clarity.plainWhy = `${insight.clarity.plainWhy} ${routineMessage}`.trim();
      }

      if (routineContext.deltaConsistency <= -8) {
        const routineRecommendation = locale.toLowerCase().startsWith("fr")
          ? "La regularite de routine a baisse: essayez de valider vos etapes chaque jour pendant 7 jours pour stabiliser la tendance."
          : locale.toLowerCase().startsWith("ar")
            ? "انخفض انتظام الروتين: حاولي الالتزام اليومي بالخطوات لمدة 7 ايام لتثبيت الاتجاه."
            : "Routine consistency dropped: complete your steps daily for 7 days to help stabilize your trend.";

        insight.recommendations = [routineRecommendation, ...insight.recommendations].slice(0, 4);
      }
    }

    return NextResponse.json({ insight, routineContext }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error generating user trend report:", error);
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate trend report", details },
      { status: 500 }
    );
  }
}
