import { NiveauBadge, Prisma } from '@prisma/client';
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
  combo24h: boolean;
  reboundBadge: boolean;
  secretBadge: boolean;
  lastAnalysisScore: number;
  skinType: string | null;
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

export const computeComboRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.BRONZE,
  title: 'Combo 24h',
  description: 'Complete both morning and night routines on the same day.',
  earned: metrics.combo24h,
});

export const computeReboundRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.SILVER,
  title: 'Badge de Rebond',
  description: 'Returned after a break and stayed consistent for 2 days.',
  earned: metrics.reboundBadge,
});

export const computeSecretRule = (metrics: BadgeRuleMetrics): RuleResult => ({
  badgeLevel: NiveauBadge.GOLD,
  title: 'Badge Secret: Skin Glow',
  description: 'Maintained a high skin score across multiple analyses.',
  earned: metrics.secretBadge,
});

export const evaluateBadgeRules = (metrics: BadgeRuleMetrics): RuleResult[] => [
  computeBronzeRule(metrics),
  computeSilverRule(metrics),
  computeGoldRule(metrics),
  computePlatinumRule(metrics),
  computeRubyMasterRule(metrics),
  computeComboRule(metrics),
  computeReboundRule(metrics),
  computeSecretRule(metrics),
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
  try {
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
  } catch (error) {
    console.warn('[BadgeService:getLoginStats] LoginActivity unavailable, defaulting to 0.', error);
    return {
      loginCountToday: 0,
      activeDays30: 0,
    };
  }
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

const getSpecialMetrics = async (userId: number, now: Date, analyses: FinalAnalysisRow[]) => {
  const dayKey = toDayStringUTC(now);
  
  // Combo 24h: Completed morning AND night routine today
  const routines = await findRoutinesByUserId(userId);
  const morningRoutine = routines.find(r => r.type === 'morning');
  const nightRoutine = routines.find(r => r.type === 'night');
  
  let combo24h = false;
  if (morningRoutine && nightRoutine) {
    const morningSteps = morningRoutine.steps.map(s => s.id);
    const nightSteps = nightRoutine.steps.map(s => s.id);
    const allSteps = morningSteps.concat(nightSteps);
    
    if (allSteps.length > 0) {
      const completions = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT "routine_step_id" FROM "RoutineStepCompletion" 
        WHERE "day" = ${dayKey} 
        AND "routine_step_id" IN (${Prisma.join(allSteps)})
      `);
      
      const completedIds = new Set(completions.map(c => c.routine_step_id));
      const morningDone = morningSteps.length > 0 && morningSteps.every(id => completedIds.has(id));
      const nightDone = nightSteps.length > 0 && nightSteps.every(id => completedIds.has(id));
      combo24h = morningDone && nightDone;
    }
  }

  // Rebound: Inactive for > 3 days, then active for 2 days including today
  let lastLogins: any[] = [];
  try {
    lastLogins = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT ON ("day_key") "day_key", "created_at"
        FROM "LoginActivity"
        WHERE "user_id" = ${userId}
        ORDER BY "day_key" DESC, "created_at" DESC
        LIMIT 10
    `;
  } catch (error) {
    console.warn('[BadgeService:getSpecialMetrics] LoginActivity unavailable, skipping rebound check.', error);
  }

  let reboundBadge = false;
  if (lastLogins.length >= 2) {
    const dates = lastLogins.map((l: any) => new Date(l.day_key));
    // Check gap between last active period and current
    for (let i = 0; i < dates.length - 1; i++) {
        const gap = (dates[i].getTime() - dates[i+1].getTime()) / (1000 * 3600 * 24);
        if (gap > 3) {
            // Found a gap, now check if there are at least 2 active days since that gap
            if (i <= 1) reboundBadge = true; 
            break;
        }
    }
  }

  // Secret: Score > 80 on 3 consecutive analyses
  const secretBadge = analyses.length >= 3 && analyses.slice(0, 3).every(a => a.score >= 80);

  // User skin type for messages
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { skin_type: true } });

  return { combo24h, reboundBadge, secretBadge, skinType: user?.skin_type ?? null };
};

const toMetrics = async (userId: number, now: Date): Promise<BadgeRuleMetrics> => {
  console.log(`[BadgeService:toMetrics] Started for user ${userId}`);
  const [routineStats, loginStats, analyses] = await Promise.all([
    getRoutineStats(userId, now),
    getLoginStats(userId, now),
    getRecentFinalAnalyses(userId),
  ]);
  console.log(`[BadgeService:toMetrics] Stats loaded for user ${userId}`);

  const { combo24h, reboundBadge, secretBadge, skinType } = await getSpecialMetrics(userId, now, analyses);

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
    combo24h,
    reboundBadge,
    secretBadge,
    lastAnalysisScore: scores[0] ?? 0,
    skinType
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
    console.log(`[BadgeService] User ${params.userId} earned badge: ${rule.title} triggered by ${params.trigger}`);
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

export const getMotivationSummary = async (userId: number) => {
  console.log(`[BadgeService:getMotivationSummary] Start for user ${userId}`);
  const now = new Date();
  const metrics = await toMetrics(userId, now);
  console.log(`[BadgeService:getMotivationSummary] Metrics done for user ${userId}`);
  const history = await findBadgesByUserId(userId);
  
  // Determine current badge (highest level)
  const levelsOrder = [NiveauBadge.BRONZE, NiveauBadge.SILVER, NiveauBadge.GOLD, NiveauBadge.PLATINUM, NiveauBadge.RUBY_MASTER];
  const currentBadge = history.sort((a, b) => levelsOrder.indexOf(b.niveau) - levelsOrder.indexOf(a.niveau))[0];
  
  const currentIndex = currentBadge ? levelsOrder.indexOf(currentBadge.niveau) : -1;
  const nextLevel = levelsOrder[currentIndex + 1] ?? null;
  
  let progressToNext = 0;
  let activeRequirements: { text: string; met: boolean }[] = [];

  const nextLevelStr = String(nextLevel || '');
  
  if (nextLevelStr === 'BRONZE') {
    const r1 = metrics.completedDays7 >= 3;
    const r2 = metrics.combo24h; // Equivalent to logging 2 times and doing both routines
    progressToNext = Math.min((metrics.completedDays7 / 3) * 100, 100);
    activeRequirements = [
        { text: `Compléter vos routines sur 3 jours (Actuel: ${metrics.completedDays7}/3)`, met: r1 },
        { text: `Effectuer un Combo 24h (Matin & Soir)`, met: r2 }
    ];
  } else if (nextLevelStr === 'SILVER') {
    const r1 = metrics.streakDays >= 7;
    const r2 = metrics.finalAnalysisCount30d >= 1;
    progressToNext = Math.min(((r1 ? 1 : 0) + (r2 ? 1 : 0)) / 2 * 100, 100);
    activeRequirements = [
        { text: `Atteindre une série de 7 jours (Série: ${metrics.streakDays}d)`, met: r1 },
        { text: `Effectuer une analyse de peau complète`, met: r2 }
    ];
  } else if (nextLevelStr === 'GOLD') {
    const r1 = metrics.netScoreImproveLast3 >= GOLD_MIN_NET_IMPROVEMENT;
    progressToNext = Math.min((metrics.netScoreImproveLast3 / Math.max(1, GOLD_MIN_NET_IMPROVEMENT)) * 100, 100);
    activeRequirements = [
        { text: `Améliorer votre score global de ${GOLD_MIN_NET_IMPROVEMENT} points`, met: r1 }
    ];
  } else if (nextLevelStr === 'PLATINUM') {
    const r1 = metrics.streakDays >= PLATINUM_MIN_STREAK;
    const r2 = metrics.avgHydrationLast5 >= PLATINUM_MIN_HYDRATION;
    progressToNext = Math.min(((metrics.streakDays / PLATINUM_MIN_STREAK) + (metrics.avgHydrationLast5 / PLATINUM_MIN_HYDRATION)) / 2 * 100, 100);
    activeRequirements = [
        { text: `Atteindre 14 jours de série`, met: r1 },
        { text: `Maintenir une hydratation stable (>80%)`, met: r2 }
    ];
  } else if (nextLevelStr === 'RUBY_MASTER') {
    const r1 = metrics.streakDays >= RUBY_MIN_STREAK;
    progressToNext = Math.min((metrics.streakDays / RUBY_MIN_STREAK) * 100, 100);
    activeRequirements = [
        { text: `Atteindre 30 jours de série (Maître)`, met: r1 }
    ];
  }

  // Motivation message
  let motivationMessage = "Keep up the great work for your skin health!";
  if (metrics.skinType === 'DRY') motivationMessage = "Hydration is key for your dry skin. Your consistency is paying off!";
  if (metrics.skinType === 'OILY') motivationMessage = "Great job managing oil levels. Stay consistent with your night routine!";
  if (metrics.streakDays > 5) motivationMessage = `Incredible ${metrics.streakDays} day streak! You are a skin hero.`;
  if (metrics.netScoreImproveLast3 > 5) motivationMessage = "Your skin is clearly improving! The data doesn't lie.";

  return {
    currentBadge,
    nextBadge: nextLevel ? { level: nextLevel, progress: Math.max(0, progressToNext) } : null,
    activeRequirements,
    metrics,
    history,
    motivationMessage,
    allRules: {
      "BRONZE": {
        title: 'Niveau Bronze',
        conditions: [
            { text: 'Compléter 3 routines dans la semaine', met: metrics.completedDays7 >= 3 },
            { text: 'Effectuer un Combo 24h', met: metrics.combo24h }
        ]
      },
      "SILVER": {
        title: 'Niveau Silver',
        conditions: [
            { text: 'Atteindre un streak de 7 jours', met: metrics.streakDays >= 7 },
            { text: 'Effectuer une analyse de peau complète', met: metrics.finalAnalysisCount30d >= 1 }
        ]
      },
      "GOLD": {
        title: 'Niveau Gold',
        conditions: [
            { text: `Amélioration de score de +${GOLD_MIN_NET_IMPROVEMENT}`, met: metrics.netScoreImproveLast3 >= GOLD_MIN_NET_IMPROVEMENT },
            { text: 'Série de 10 jours active', met: metrics.streakDays >= 10 }
        ]
      },
      "PLATINUM": {
        title: 'Niveau Platinum',
        conditions: [
            { text: 'Atteindre un streak de 14 jours', met: metrics.streakDays >= PLATINUM_MIN_STREAK },
            { text: 'Hydratation stable > 80%', met: metrics.avgHydrationLast5 >= PLATINUM_MIN_HYDRATION }
        ]
      },
      "RUBY_MASTER": {
        title: 'Niveau Ruby Master',
        conditions: [
            { text: 'Atteindre 30 jours de série', met: metrics.streakDays >= RUBY_MIN_STREAK },
            { text: 'Analyses régulières sur 6 mois', met: metrics.finalAnalysisCountAll >= RUBY_MIN_FINAL_ANALYSES }
        ]
      }
    }
  };
};

export const findBadgeById = async (id: number) => prisma.badge.findUnique({ where: { id } });

export const findBadgesByUserId = async (userId: number) =>
  prisma.badge.findMany({ where: { user_id: userId }, orderBy: { date: 'desc' } });

export const findAllBadges = async () => prisma.badge.findMany();

export const deleteBadge = async (id: number) => prisma.badge.delete({ where: { id } });
