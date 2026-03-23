import prisma from '@/lib/prisma';
import { SkinType } from '@prisma/client';

type DimensionScores = {
  hydration: number;
  barrier: number;
  calmness: number;
  clarity: number;
  protection: number;
  lifestyle: number;
};

type AnalysisSnapshot = {
  score: number;
  scoreEau: number;
  agePeau: number;
  skinType: SkinType;
  dimensions: DimensionScores;
  strengths: string[];
  concerns: string[];
  recommendations: {
    immediate: string[];
    weekly: string[];
    avoid: string[];
  };
  routine: {
    morning: string[];
    evening: string[];
  };
  confidence: number;
  analysis: string;
  answersCount: number;
};

type ComputeOptions = {
  userId: number;
  quizId?: number;
  trigger?: string;
  saveLegacySkinAnalyse?: boolean;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

const YES_WORDS = ['yes', 'oui', 'souvent', 'always', 'daily', 'chaque jour', 'every day', 'regulier', 'often'];
const NO_WORDS = ['no', 'non', 'jamais', 'rarement', 'rarely', 'never'];
const SOMETIMES_WORDS = ['parfois', 'sometimes', 'occasionally', 'occasionnellement'];

const OILY_WORDS = ['oily', 'gras', 'huileux', 'shiny', 'brillant'];
const DRY_WORDS = ['dry', 'seche', 'sec', 'tiraille', 'flaky', 'deshydrate'];
const SENSITIVE_WORDS = ['sensitive', 'sensible', 'rougeur', 'irrit', 'reactive'];
const COMBINATION_WORDS = ['combination', 'mixte', 'zone t', 't-zone'];
const NORMAL_WORDS = ['normal', 'equilibree', 'balanced'];

const ISSUE_WORDS = {
  acne: ['acne', 'pimples', 'boutons', 'blackheads', 'imperfections'],
  redness: ['redness', 'rougeur', 'irritation', 'inflammation'],
  spots: ['spots', 'pigment', 'taches', 'dark spot', 'melasma'],
  wrinkles: ['wrinkle', 'rides', 'fine lines', 'ridules'],
  dehydration: ['dehydrate', 'deshydrate', 'tight', 'tiraille'],
  dullness: ['dull', 'terne', 'fatigue', 'fatigued'],
};

const inferSkinType = (
  counts: Record<SkinType, number>,
  fallback?: SkinType | null,
  scores?: DimensionScores
): SkinType => {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topType, topCount] = sorted[0] as [SkinType, number];

  if (topCount > 0) return topType;
  if (fallback) return fallback;

  if (scores) {
    if (scores.hydration < 50) return SkinType.DRY;
    if (scores.calmness < 50) return SkinType.SENSITIVE;
    if (scores.clarity < 55 && scores.barrier >= 60) return SkinType.OILY;
  }

  return SkinType.NORMAL;
};

const levelLabel = (score: number) => {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'moderate';
  return 'needs improvement';
};

const buildSummary = (snapshot: AnalysisSnapshot): string => {
  const typeLabel: Record<SkinType, string> = {
    OILY: 'oily',
    DRY: 'dry',
    SENSITIVE: 'sensitive',
    NORMAL: 'normal',
    COMBINATION: 'combination',
  };

  return [
    `Overall score: ${snapshot.score}/100 (${levelLabel(snapshot.score)}).`,
    `Likely skin profile: ${typeLabel[snapshot.skinType]} skin | Estimated skin age: ${snapshot.agePeau} | Hydration: ${snapshot.scoreEau}/100.`,
    `Strengths: ${snapshot.strengths.join(', ')}.`,
    `Priority concerns: ${snapshot.concerns.join(', ')}.`,
    `Immediate actions: ${snapshot.recommendations.immediate.join(' ; ')}.`,
    `Weekly plan: ${snapshot.recommendations.weekly.join(' ; ')}.`,
    `Avoid: ${snapshot.recommendations.avoid.join(' ; ')}.`,
    `Morning routine: ${snapshot.routine.morning.join(' -> ')}.`,
    `Evening routine: ${snapshot.routine.evening.join(' -> ')}.`,
    `Analysis confidence: ${snapshot.confidence}% (based on ${snapshot.answersCount} answers).`,
  ].join('\n');
};

const computeFromAnswers = (
  answers: Array<{ reponse: string; question: { question: string } }>,
  age: number | null,
  existingSkinType: SkinType | null
): AnalysisSnapshot => {
  const scores: DimensionScores = {
    hydration: 62,
    barrier: 62,
    calmness: 62,
    clarity: 62,
    protection: 62,
    lifestyle: 62,
  };

  const skinTypeCounts: Record<SkinType, number> = {
    OILY: 0,
    DRY: 0,
    SENSITIVE: 0,
    NORMAL: 0,
    COMBINATION: 0,
  };

  const concernCounter = new Map<string, number>();

  for (const answer of answers) {
    const questionText = normalizeText(answer.question.question || '');
    const answerText = normalizeText(answer.reponse || '');

    if (!answerText) continue;

    if (includesAny(answerText, OILY_WORDS)) skinTypeCounts.OILY += 1;
    if (includesAny(answerText, DRY_WORDS)) skinTypeCounts.DRY += 1;
    if (includesAny(answerText, SENSITIVE_WORDS)) skinTypeCounts.SENSITIVE += 1;
    if (includesAny(answerText, COMBINATION_WORDS)) skinTypeCounts.COMBINATION += 1;
    if (includesAny(answerText, NORMAL_WORDS)) skinTypeCounts.NORMAL += 1;

    const yes = includesAny(answerText, YES_WORDS);
    const no = includesAny(answerText, NO_WORDS);
    const sometimes = includesAny(answerText, SOMETIMES_WORDS);

    const questionWeight = /(main|important|principal|priority)/.test(questionText) ? 1.4 : 1;

    if (/(spf|sunscreen|ecran solaire|soleil|uv)/.test(questionText)) {
      if (yes) scores.protection += 18 * questionWeight;
      if (sometimes) scores.protection += 4 * questionWeight;
      if (no) scores.protection -= 20 * questionWeight;
    }

    if (/(water|eau|hydrat|moistur)/.test(questionText)) {
      if (yes) scores.hydration += 12 * questionWeight;
      if (sometimes) scores.hydration += 3 * questionWeight;
      if (no) scores.hydration -= 12 * questionWeight;
    }

    if (/(sleep|sommeil|stress|sport|exercise|lifestyle|hygiene)/.test(questionText)) {
      if (yes) scores.lifestyle += 10 * questionWeight;
      if (sometimes) scores.lifestyle += 3 * questionWeight;
      if (no) scores.lifestyle -= 10 * questionWeight;
    }

    if (/(routine|cleanser|nettoyant|serum|moisturizer|creme|retinol|niacinamide|vitamin c)/.test(answerText)) {
      scores.barrier += 6;
      scores.clarity += 5;
    }

    if (includesAny(answerText, ISSUE_WORDS.acne)) {
      scores.clarity -= 11;
      concernCounter.set('Acne/imperfections', (concernCounter.get('Acne/imperfections') || 0) + 2);
    }
    if (includesAny(answerText, ISSUE_WORDS.redness)) {
      scores.calmness -= 10;
      scores.barrier -= 8;
      concernCounter.set('Redness/sensitivity', (concernCounter.get('Redness/sensitivity') || 0) + 2);
    }
    if (includesAny(answerText, ISSUE_WORDS.spots)) {
      scores.protection -= 8;
      scores.clarity -= 6;
      concernCounter.set('Pigmentation/dark spots', (concernCounter.get('Pigmentation/dark spots') || 0) + 2);
    }
    if (includesAny(answerText, ISSUE_WORDS.wrinkles)) {
      scores.barrier -= 8;
      concernCounter.set('Wrinkles/aging prevention', (concernCounter.get('Wrinkles/aging prevention') || 0) + 2);
    }
    if (includesAny(answerText, ISSUE_WORDS.dehydration)) {
      scores.hydration -= 10;
      scores.barrier -= 6;
      concernCounter.set('Dehydration', (concernCounter.get('Dehydration') || 0) + 2);
    }
    if (includesAny(answerText, ISSUE_WORDS.dullness)) {
      scores.clarity -= 7;
      concernCounter.set('Dull/tired complexion', (concernCounter.get('Dull/tired complexion') || 0) + 1);
    }

    if (/(smoke|tabac|pollution|sunburn|coup de soleil)/.test(answerText)) {
      scores.protection -= 8;
      scores.lifestyle -= 6;
    }
  }

  (Object.keys(scores) as Array<keyof DimensionScores>).forEach((key) => {
    scores[key] = clamp(scores[key]);
  });

  const score = Math.round(
    (scores.hydration + scores.barrier + scores.calmness + scores.clarity + scores.protection + scores.lifestyle) / 6
  );

  const scoreEau = Math.round(scores.hydration);
  const ageBase = age ?? 28;
  const agePeau = Math.max(14, Math.min(75, ageBase + Math.round((72 - score) / 5)));
  const skinType = inferSkinType(skinTypeCounts, existingSkinType, scores);

  const strengths = [
    { label: 'Hydration', value: scores.hydration },
    { label: 'Skin barrier', value: scores.barrier },
    { label: 'Skin calmness', value: scores.calmness },
    { label: 'Complexion clarity', value: scores.clarity },
    { label: 'UV protection', value: scores.protection },
    { label: 'Lifestyle consistency', value: scores.lifestyle },
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((item) => `${item.label} (${Math.round(item.value)}/100)`);

  const concerns = [
    { label: 'Low hydration', value: scores.hydration },
    { label: 'Weak skin barrier', value: scores.barrier },
    { label: 'Skin sensitivity', value: scores.calmness },
    { label: 'Texture/blemishes', value: scores.clarity },
    { label: 'Insufficient UV protection', value: scores.protection },
    { label: 'Lifestyle factors to improve', value: scores.lifestyle },
  ]
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((item) => `${item.label} (${Math.round(item.value)}/100)`);

  const explicitConcerns = [...concernCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label]) => label);

  const mergedConcerns = Array.from(new Set([...explicitConcerns, ...concerns])).slice(0, 4);

  const recommendations = {
    immediate: [
      scores.hydration < 60 ? 'Add a moisturizer with ceramides and hyaluronic acid.' : 'Maintain stable daily hydration.',
      scores.protection < 65 ? 'Apply SPF50 every morning and reapply outdoors.' : 'Keep consistent UV protection habits.',
      scores.calmness < 60 ? 'Reduce irritating actives for 2 weeks and prioritize soothing formulas.' : 'Keep a gentle routine without over-exfoliation.',
    ],
    weekly: [
      'Track your skin weekly with photos in similar lighting.',
      scores.clarity < 60 ? 'Introduce gentle exfoliation 1-2 times per week.' : 'Maintain gentle exfoliation once per week.',
      'Monitor skin reactivity 24h after each new product.',
    ],
    avoid: [
      'Avoid harsh cleansers and abrasive scrubs.',
      'Avoid combining multiple strong actives in the same evening routine.',
      'Avoid prolonged UV exposure without protection.',
    ],
  };

  const routine = {
    morning: [
      'Gentle cleanser',
      scores.clarity < 60 ? 'Niacinamide serum' : 'Antioxidant serum',
      'Barrier-support moisturizer',
      'SPF50',
    ],
    evening: [
      'Double cleanse if needed',
      scores.calmness < 60 ? 'Soothing serum (panthenol/allantoin)' : 'Targeted active (gentle retinoid or AHA/BHA based on tolerance)',
      'Barrier cream (ceramides)',
    ],
  };

  const confidence = clamp(Math.round(35 + answers.length * 6), 35, 95);

  const snapshot: AnalysisSnapshot = {
    score,
    scoreEau,
    agePeau,
    skinType,
    dimensions: scores,
    strengths,
    concerns: mergedConcerns,
    recommendations,
    routine,
    confidence,
    analysis: '',
    answersCount: answers.length,
  };

  snapshot.analysis = buildSummary(snapshot);
  return snapshot;
};

export const computeAndStoreSkinScoreAnalysis = async ({
  userId,
  quizId,
  trigger = 'progress',
  saveLegacySkinAnalyse = false,
}: ComputeOptions) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, age: true, skin_type: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const answers = await prisma.surveyAnswer.findMany({
    where: {
      user_id: userId,
      ...(quizId ? { quiz_id: quizId } : {}),
    },
    include: {
      question: {
        select: {
          question: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  if (answers.length === 0) {
    throw new Error('No answers found for this user');
  }

  const snapshot = computeFromAnswers(answers, user.age ?? null, user.skin_type ?? null);

  const inserted = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `INSERT INTO "SkinScoreAnalysis" (
      "user_id", "quiz_id", "score", "score_eau", "age_peau", "skin_type",
      "hydration", "barrier", "calmness", "clarity", "protection", "lifestyle",
      "strengths", "concerns", "recommendations", "routine", "summary", "trigger"
    ) VALUES (
      $1, $2, $3, $4, $5, $6::"SkinType",
      $7, $8, $9, $10, $11, $12,
      $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18
    ) RETURNING "id";`,
    userId,
    quizId ?? null,
    snapshot.score,
    snapshot.scoreEau,
    snapshot.agePeau,
    snapshot.skinType,
    snapshot.dimensions.hydration,
    snapshot.dimensions.barrier,
    snapshot.dimensions.calmness,
    snapshot.dimensions.clarity,
    snapshot.dimensions.protection,
    snapshot.dimensions.lifestyle,
    JSON.stringify(snapshot.strengths),
    JSON.stringify(snapshot.concerns),
    JSON.stringify(snapshot.recommendations),
    JSON.stringify(snapshot.routine),
    snapshot.analysis,
    trigger
  );

  const created = inserted[0];

  if (user.skin_type !== snapshot.skinType) {
    await prisma.user.update({
      where: { id: userId },
      data: { skin_type: snapshot.skinType },
    });
  }

  let legacySkinAnalyseId: number | undefined;
  if (saveLegacySkinAnalyse) {
    const legacy = await prisma.skinAnalyse.create({
      data: {
        user_id: userId,
        score: snapshot.score,
        score_eau: snapshot.scoreEau,
        age_peau: snapshot.agePeau,
        description: snapshot.analysis,
      },
    });
    legacySkinAnalyseId = legacy.id;
  }

  return {
    analysisId: created.id,
    legacySkinAnalyseId,
    ...snapshot,
  };
};
