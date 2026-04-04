import { NiveauBadge } from '@prisma/client';
import prisma from '@/lib/prisma';
import { findRoutinesByUserId } from '@/entities/Routine';
import { findCompletionsForStepsAndDays } from '@/entities/RoutineStepCompletion';

const toDayStringUTC = (date: Date) => date.toISOString().slice(0, 10);

type TriggerType = 'login' | 'routine_step' | 'analysis_final' | 'cron';

type FinalAnalysisRow = {
  score: number;
  hydration: number;
  protection: number;
  created_at: Date;
};

export type BadgeRuleMetrics = {
  completedDays7: number;
  streakDays: number;
  loginCountToday: number;
  finalAnalysisCount30d: number;
  finalAnalysisCountAll: number;
  netScoreImproveLast3: number;
  netScoreImproveAll: number;
  avgHydrationLast5: number;
  avgProtectionLast5: number;
  activeDays30: number;
};

export type RuleResult = {
  badgeLevel: NiveauBadge;
  title: string;
  description: string;
  earned: boolean;
};

const GOLD_MIN_NET_IMPROVEMENT = Number(process.env.BADGE_GOLD_MIN_NET_IMPROVEMENT ?? 8);
const PLATINUM_MIN_STREAK = Number(process.env.BADGE_PLATINUM_MIN_STREAK ?? 14);
const PLATINUM_MIN_HYDRATION = Number(process.env.BADGE_PLATINUM_MIN_HYDRATION ?? 70);
const PLATINUM_MIN_PROTECTION = Number(process.env.BADGE_PLATINUM_MIN_PROTECTION ?? 65);
const RUBY_MIN_STREAK = Number(process.env.BADGE_RUBY_MIN_STREAK ?? 30);
const RUBY_MIN_FINAL_ANALYSES = Number(process.env.BADGE_RUBY_MIN_FINAL_ANALYSES ?? 6);
const RUBY_MIN_NET_IMPROVEMENT = Number(process.env.BADGE_RUBY_MIN_NET_IMPROVEMENT ?? 15);
const RUBY_MIN_ACTIVE_DAYS_30 = Number(process.env.BADGE_RUBY_MIN_ACTIVE_DAYS_30 ?? 24);

export const computeBronzeRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.BRONZE,
  title: 'Bronze Habit Starter',
  description: 'Complete at least 3 days out of 7. Bonus path: 2 logins in one day.',
  earned: metrics.completedDays7 >= 3 || metrics.loginCountToday >= 2,
});

export const computeSilverRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.SILVER,
  title: 'Silver Consistency',
  description: 'Reach a 7-day streak and have at least one recent final analysis.',
  earned: metrics.streakDays >= 7 && metrics.finalAnalysisCount30d >= 1,
});

export const computeGoldRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.GOLD,
  title: 'Gold Skin Progress',
  description: 'Improve your skin score consistently across recent final analyses.',
  earned: metrics.netScoreImproveLast3 >= GOLD_MIN_NET_IMPROVEMENT,
});

export const computePlatinumRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.PLATINUM,
  title: 'Platinum Precision',
  description: 'Long streak with stable hydration and protection quality.',
  earned:
    metrics.streakDays >= PLATINUM_MIN_STREAK &&
    metrics.avgHydrationLast5 >= PLATINUM_MIN_HYDRATION &&
    metrics.avgProtectionLast5 >= PLATINUM_MIN_PROTECTION,
});

export const computeRubyMasterRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.RUBY_MASTER,
  title: 'Ruby Master',
  description: 'Elite consistency and long-term measurable skin progress.',
  earned:
    metrics.streakDays >= RUBY_MIN_STREAK &&
    metrics.finalAnalysisCountAll >= RUBY_MIN_FINAL_ANALYSES &&
    metrics.netScoreImproveAll >= RUBY_MIN_NET_IMPROVEMENT &&
    metrics.activeDays30 >= RUBY_MIN_ACTIVE_DAYS_30,
});

export const evaluateBadgeRules = (metrics: BadgeRuleMetrics): RuleResult[] => [
  computeBronzeRule(metrics),
  computeSilverRule(metrics),
  computeGoldRule(metrics),
  computePlatinumRule(metrics),
  computeRubyMasterRule(metrics),
];

export const trackLoginActivity = async (
  userId: number,
  source: 'credentials' | 'google' | 'oauth' = 'credentials',
  at: Date = new Date()
) => {
  const dayKey = toDayStringUTC(at);
  await prisma.$executeRaw`
    INSERT INTO "LoginActivity" ("user_id", "source", "day_key", "created_at")
    VALUES (${userId}, ${source}, ${dayKey}, ${at});
  `;
};

const getRecentFinalAnalyses = async (userId: number): Promise<FinalAnalysisRow[]> => {
  return await prisma.$queryRaw<FinalAnalysisRow[]>`
    SELECT
      "score",
      "hydration",
      "protection",
      "created_at"
    FROM "SkinScoreAnalysis"
    WHERE "user_id" = ${userId} AND "trigger" = 'final'
    ORDER BY "created_at" DESC;
  `;
};

const getLoginStats = async (userId: number, now: Date) => {
  const dayKey = toDayStringUTC(now);
  const dayRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "LoginActivity"
    WHERE "user_id" = ${userId} AND "day_key" = ${dayKey};
  `;

  const activeRows = await prisma.$queryRaw<{ days: bigint }[]>`
    SELECT COUNT(DISTINCT "day_key")::bigint AS days
    FROM "LoginActivity"
    WHERE "user_id" = ${userId}
      AND "created_at" >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)};
  `;

  return {
    loginCountToday: Number(dayRows[0]?.count ?? 0),
    activeDays30: Number(activeRows[0]?.days ?? 0),
  };
};

const buildLastNDays = (n: number, fromDate = new Date()) => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(fromDate);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(toDayStringUTC(d));
  }
  return days;
};

const getRoutineStats = async (userId: number, now: Date) => {
  const routines = await findRoutinesByUserId(userId);
  const routineTypes = ['morning', 'night', 'weekly'] as const;

  const days7 = buildLastNDays(7, now);
  const days30 = buildLastNDays(30, now);

  const stepIds = routines.flatMap((r) => r.steps.map((s) => s.id));
  if (stepIds.length === 0) {
    return { completedDays7: 0, streakDays: 0 };
  }

  const completions = await findCompletionsForStepsAndDays({
    routine_step_ids: stepIds,
    days: Array.from(new Set([...days7, ...days30])),
  });

  const completedByDay = new Map<string, Set<number>>();
  for (const c of completions) {
    if (!completedByDay.has(c.day)) completedByDay.set(c.day, new Set());
    completedByDay.get(c.day)!.add(c.routine_step_id);
  }

  const computeForType = (type: (typeof routineTypes)[number], days: string[]) => {
    const typedRoutines = routines.filter((r) => r.type === type);
    if (typedRoutines.length === 0) return { completed: 0, streak: 0 };

    const dayCompletion = days.map((day) => {
      const set = completedByDay.get(day) || new Set<number>();
      return typedRoutines.some((r) => r.steps.length > 0 && r.steps.every((s) => set.has(s.id)));
    });

    let streak = 0;
    for (let i = dayCompletion.length - 1; i >= 0; i -= 1) {
      if (dayCompletion[i]) streak += 1;
      else break;
    }

    return {
      completed: dayCompletion.filter(Boolean).length,
      streak,
    };
  };

  const perType7 = routineTypes.map((type) => computeForType(type, days7));
  const perType30 = routineTypes.map((type) => computeForType(type, days30));

  return {
    completedDays7: Math.max(...perType7.map((r) => r.completed), 0),
    streakDays: Math.max(...perType30.map((r) => r.streak), 0),
  };
};

const avg = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const toMetrics = async (userId: number, now: Date): Promise<BadgeRuleMetrics> => {
  const [routineStats, loginStats, analyses] = await Promise.all([
    getRoutineStats(userId, now),
    getLoginStats(userId, now),
    getRecentFinalAnalyses(userId),
  ]);

  const scores = analyses.map((a) => Number(a.score || 0)).filter((s) => Number.isFinite(s));
  const recent3 = scores.slice(0, 3);
  const netScoreImproveLast3 = recent3.length >= 3 ? recent3[0] - recent3[2] : 0;
  const netScoreImproveAll = scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0;

  const nowMs = now.getTime();
  const finalAnalysisCount30d = analyses.filter(
    (a) => nowMs - new Date(a.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000
  ).length;

  const recent5 = analyses.slice(0, 5);
  const avgHydrationLast5 = avg(recent5.map((a) => Number(a.hydration || 0)));
  const avgProtectionLast5 = avg(recent5.map((a) => Number(a.protection || 0)));

  return {
    completedDays7: routineStats.completedDays7,
    streakDays: routineStats.streakDays,
    loginCountToday: loginStats.loginCountToday,
    finalAnalysisCount30d,
    finalAnalysisCountAll: analyses.length,
    netScoreImproveLast3,
    netScoreImproveAll,
    avgHydrationLast5,
    avgProtectionLast5,
    activeDays30: loginStats.activeDays30,
  };
};

const awardBadgeIfMissing = async (data: {
  userId: number;
  title: string;
  description: string;
  level: NiveauBadge;
  at: Date;
}) => {
  await prisma.$executeRaw`
    INSERT INTO "Badge" ("user_id", "titre", "description", "niveau", "date")
    VALUES (${data.userId}, ${data.title}, ${data.description}, ${data.level}, ${data.at})
    ON CONFLICT ("user_id", "niveau", "titre") DO NOTHING;
  `;
};

export const evaluateAndAwardBadgesForUser = async (params: {
  userId: number;
  trigger: TriggerType;
  now?: Date;
}) => {
  const now = params.now ?? new Date();
  const metrics = await toMetrics(params.userId, now);
  const evaluations = evaluateBadgeRules(metrics);

  const earned = evaluations.filter((rule) => rule.earned);
  for (const rule of earned) {
    await awardBadgeIfMissing({
      userId: params.userId,
      title: rule.title,
      description: rule.description,
      level: rule.badgeLevel,
      at: now,
    });
  }

  return {
    trigger: params.trigger,
    metrics,
    evaluations,
    awardedLevels: earned.map((r) => r.badgeLevel),
  };
};

export const findBadgeById = async (id: number) => prisma.badge.findUnique({ where: { id } });

export const findBadgesByUserId = async (userId: number) =>
  prisma.badge.findMany({ where: { user_id: userId }, orderBy: { date: 'desc' } });

export const findAllBadges = async () => prisma.badge.findMany();

export const deleteBadge = async (id: number) => prisma.badge.delete({ where: { id } });
