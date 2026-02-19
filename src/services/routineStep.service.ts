import { prisma } from '../../prisma/prisma.config';

export const createRoutineStep = async (data: {
  routine_id: number;
  ordre: number;
  description: string;
  duree?: number;
}) => {
  return await prisma.routineStep.create({ data });
};

export const findRoutineStepById = async (id: number) => {
  return await prisma.routineStep.findUnique({ where: { id } });
};

export const findRoutineStepsByRoutineId = async (routineId: number) => {
  return await prisma.routineStep.findMany({
    where: { routine_id: routineId },
    orderBy: { ordre: 'asc' },
  });
};

export const findAllRoutineSteps = async () => {
  return await prisma.routineStep.findMany({
    orderBy: { ordre: 'asc' },
  });
};

export const updateRoutineStep = async (
  id: number,
  data: { ordre?: number; description?: string; duree?: number }
) => {
  return await prisma.routineStep.update({ where: { id }, data });
};

export const deleteRoutineStep = async (id: number) => {
  return await prisma.routineStep.delete({ where: { id } });
};
