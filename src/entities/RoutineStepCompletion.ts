import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export class RoutineStepCompletion {
  id!: number;
  routine_step_id!: number;
  day!: string; // YYYY-MM-DD
  created_at!: Date;
}

type RoutineStepCompletionRow = {
  id: number;
  routine_step_id: number;
  day: string;
  created_at: Date;
};

export const upsertRoutineStepCompletion = async (data: {
  routine_step_id: number;
  day: string;
}) => {
  const existing = await prisma.routineStepCompletion.findFirst({
    where: {
      routine_step_id: data.routine_step_id,
      day: data.day,
    },
    select: {
      id: true,
      routine_step_id: true,
      day: true,
      created_at: true,
    },
  });

  if (existing) return existing;

  try {
    return await prisma.routineStepCompletion.create({
      data: {
        routine_step_id: data.routine_step_id,
        day: data.day,
      },
      select: {
        id: true,
        routine_step_id: true,
        day: true,
        created_at: true,
      },
    });
  } catch {
    // In race conditions, another request may create the row first.
    return await prisma.routineStepCompletion.findFirst({
      where: {
        routine_step_id: data.routine_step_id,
        day: data.day,
      },
      select: {
        id: true,
        routine_step_id: true,
        day: true,
        created_at: true,
      },
    });
  }
};

export const deleteRoutineStepCompletion = async (data: {
  routine_step_id: number;
  day: string;
}) => {
  return await prisma.routineStepCompletion.deleteMany({
    where: {
      routine_step_id: data.routine_step_id,
      day: data.day,
    },
  });
};

export const findCompletionsForStepsAndDays = async (data: {
  routine_step_ids: number[];
  days: string[];
}) => {
  if (data.routine_step_ids.length === 0 || data.days.length === 0) return [];

  return await prisma.$queryRaw<RoutineStepCompletionRow[]>(Prisma.sql`
    SELECT "id", "routine_step_id", "day", "created_at"
    FROM "RoutineStepCompletion"
    WHERE "routine_step_id" IN (${Prisma.join(data.routine_step_ids)})
      AND "day" IN (${Prisma.join(data.days)});
  `);
};

export const findCompletionForStepAndDay = async (data: {
  routine_step_id: number;
  day: string;
}) => {
  return await prisma.routineStepCompletion.findFirst({
    where: {
      routine_step_id: data.routine_step_id,
      day: data.day,
    },
    select: {
      id: true,
      routine_step_id: true,
      day: true,
      created_at: true,
    },
  });
};
