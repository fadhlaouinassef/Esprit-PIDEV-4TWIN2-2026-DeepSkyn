import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPremiumAccessStatus } from '@/lib/premium-access';
import { SkinType } from '@prisma/client';

type RoutineStep = {
  step: number;
  name: string;
  instruction: string;
  frequency: 'daily';
};

type WeeklyStep = {
  day: string;
  focus: string;
  instruction: string;
};

type RoutinePayload = {
  title: string;
  skinType: SkinType;
  morning: RoutineStep[];
  evening: RoutineStep[];
  weekly: WeeklyStep[];
  warnings: string[];
  durationWeeks: 4;
};

type SaveRoutineBody = {
  userId?: number;
  analysis?: string;
  analysisHash?: string;
  score?: number;
  routine?: RoutinePayload;
  quizAnswers?: unknown[];
  upsert?: boolean;
  source?: string;
  idempotencyKey?: string;
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const safeParseBody = async (request: NextRequest): Promise<SaveRoutineBody> => {
  try {
    const raw = await request.text();
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    const body = parsed?.body && typeof parsed.body === 'object' ? parsed.body : parsed;
    return body && typeof body === 'object' ? (body as SaveRoutineBody) : {};
  } catch {
    return {};
  }
};

const isValidRoutine = (routine: unknown): routine is RoutinePayload => {
  if (!routine || typeof routine !== 'object') return false;

  const candidate = routine as RoutinePayload;
  const validSkinTypes = new Set<SkinType>(['OILY', 'DRY', 'COMBINATION', 'SENSITIVE', 'NORMAL']);

  const isStepArray = (value: unknown) =>
    Array.isArray(value) &&
    value.every((item, index) => {
      const step = item as RoutineStep;
      return (
        Number(step?.step) === index + 1 &&
        typeof step?.name === 'string' &&
        step.name.trim().length > 0 &&
        typeof step?.instruction === 'string' &&
        step.instruction.trim().length > 0 &&
        String(step?.frequency).toLowerCase() === 'daily'
      );
    });

  const isWeeklyArray = (value: unknown) =>
    Array.isArray(value) &&
    value.every((item) => {
      const weekly = item as WeeklyStep;
      return (
        typeof weekly?.day === 'string' &&
        weekly.day.trim().length > 0 &&
        typeof weekly?.focus === 'string' &&
        weekly.focus.trim().length > 0 &&
        typeof weekly?.instruction === 'string' &&
        weekly.instruction.trim().length > 0
      );
    });

  return (
    typeof candidate.title === 'string' &&
    candidate.title.trim().length > 0 &&
    validSkinTypes.has(String(candidate.skinType || '').toUpperCase() as SkinType) &&
    isStepArray(candidate.morning) &&
    isStepArray(candidate.evening) &&
    isWeeklyArray(candidate.weekly) &&
    Array.isArray(candidate.warnings) &&
    candidate.warnings.every((w) => typeof w === 'string') &&
    Number(candidate.durationWeeks) === 4
  );
};

const fnvHash = (input: string) => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
};

export async function POST(request: NextRequest) {
  try {
    const body = await safeParseBody(request);

    const userId = Number(body.userId || 0);
    const analysis = String(body.analysis || '').trim();
    const score = clamp(Math.round(Number(body.score || 0)), 0, 100);
    const source = String(body.source || 'n8n-routine-generator');

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const access = await getPremiumAccessStatus(userId);
    if (!access.isPremium) {
      return NextResponse.json(
        {
          error: 'Automatic routine creation is available for premium users only.',
          code: 'PREMIUM_REQUIRED_FOR_AUTO_ROUTINE',
        },
        { status: 403 }
      );
    }

    if (!analysis) {
      return NextResponse.json({ error: 'analysis is required.' }, { status: 400 });
    }

    if (!isValidRoutine(body.routine)) {
      return NextResponse.json({ error: 'routine payload is invalid.' }, { status: 400 });
    }

    const routine = {
      ...body.routine,
      skinType: String(body.routine.skinType).toUpperCase() as SkinType,
    };

    const analysisHash = String(body.analysisHash || fnvHash(`${userId}|${analysis}`));
    const idempotencyKey = String(body.idempotencyKey || `${userId}:${analysisHash}`);

    const autoMarker = `AUTO_ROUTINE:${idempotencyKey}`;
    const warningsLabel = routine.warnings.length ? routine.warnings.join(' | ') : 'none';

    const routineBuckets: Array<{
      type: 'morning' | 'night' | 'weekly';
      objectif: string;
      envie: string;
      steps: Array<{ ordre: number; action: string }>;
    }> = [
      {
        type: 'morning',
        objectif: `${routine.title} - Morning`,
        envie: `${autoMarker} | source=${source} | skinType=${routine.skinType} | score=${score} | durationWeeks=${routine.durationWeeks} | warnings=${warningsLabel}`,
        steps: routine.morning.map((s) => ({
          ordre: s.step,
          action: `${s.name}: ${s.instruction}`,
        })),
      },
      {
        type: 'night',
        objectif: `${routine.title} - Evening`,
        envie: `${autoMarker} | source=${source} | skinType=${routine.skinType} | score=${score} | durationWeeks=${routine.durationWeeks} | warnings=${warningsLabel}`,
        steps: routine.evening.map((s) => ({
          ordre: s.step,
          action: `${s.name}: ${s.instruction}`,
        })),
      },
      {
        type: 'weekly',
        objectif: `${routine.title} - Weekly Plan`,
        envie: `${autoMarker} | source=${source} | skinType=${routine.skinType} | score=${score} | durationWeeks=${routine.durationWeeks}`,
        steps: routine.weekly.map((w, index) => ({
          ordre: index + 1,
          action: `${w.day} - ${w.focus}: ${w.instruction}`,
        })),
      },
    ];

    const upsertSummary = await prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let updatedCount = 0;
      const routineIds: number[] = [];

      for (const bucket of routineBuckets) {
        if (!bucket.steps.length) continue;

        const existing = await tx.routine.findFirst({
          where: {
            user_id: userId,
            type: bucket.type,
            envie: {
              contains: autoMarker,
            },
          },
          select: { id: true },
        });

        const routineRow = existing
          ? await tx.routine.update({
              where: { id: existing.id },
              data: {
                objectif: bucket.objectif,
                envie: bucket.envie,
              },
              select: { id: true },
            })
          : await tx.routine.create({
              data: {
                user_id: userId,
                type: bucket.type,
                objectif: bucket.objectif,
                envie: bucket.envie,
              },
              select: { id: true },
            });

        if (existing) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }

        routineIds.push(routineRow.id);

        await tx.routineStep.deleteMany({ where: { routine_id: routineRow.id } });

        await tx.routineStep.createMany({
          data: bucket.steps.map((step) => ({
            routine_id: routineRow.id,
            ordre: step.ordre,
            action: step.action,
          })),
        });
      }

      return {
        createdCount,
        updatedCount,
        routineIds,
      };
    });

    let action: 'create' | 'update' = 'create';
    if (upsertSummary.updatedCount > 0) {
      action = upsertSummary.createdCount > 0 ? 'update' : 'update';
    }

    return NextResponse.json(
      {
        success: true,
        action,
        id: upsertSummary.routineIds[0] || 0,
        userId,
        analysisHash,
        idempotencyKey,
        createdCount: upsertSummary.createdCount,
        updatedCount: upsertSummary.updatedCount,
        routineIds: upsertSummary.routineIds,
      },
      { status: action === 'create' ? 201 : 200 }
    );
  } catch (error: unknown) {
    console.error('Save routine error:', error);
    return NextResponse.json({ error: 'Failed to save routine.' }, { status: 500 });
  }
}
