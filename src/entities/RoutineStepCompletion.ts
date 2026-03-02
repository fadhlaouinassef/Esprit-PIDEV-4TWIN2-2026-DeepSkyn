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
  await prisma.$executeRaw`
    INSERT INTO "RoutineStepCompletion" ("routine_step_id", "day")
    VALUES (${data.routine_step_id}, ${data.day})
    ON CONFLICT ("routine_step_id", "day") DO NOTHING;
  `;

  const rows = await prisma.$queryRaw<RoutineStepCompletionRow[]>`
    SELECT "id", "routine_step_id", "day", "created_at"
    FROM "RoutineStepCompletion"
    WHERE "routine_step_id" = ${data.routine_step_id} AND "day" = ${data.day}
    LIMIT 1;
  `;

  return rows[0] ?? null;
};

export const deleteRoutineStepCompletion = async (data: {
  routine_step_id: number;
  day: string;
}) => {
  return await prisma.$executeRaw`
    DELETE FROM "RoutineStepCompletion"
    WHERE "routine_step_id" = ${data.routine_step_id} AND "day" = ${data.day};
  `;
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
  const rows = await prisma.$queryRaw<RoutineStepCompletionRow[]>`
    SELECT "id", "routine_step_id", "day", "created_at"
    FROM "RoutineStepCompletion"
    WHERE "routine_step_id" = ${data.routine_step_id} AND "day" = ${data.day}
    LIMIT 1;
  `;
  return rows[0] ?? null;
};
