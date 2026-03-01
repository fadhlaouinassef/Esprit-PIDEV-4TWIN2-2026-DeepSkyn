import prisma from '@/lib/prisma';

export class RoutineStep {
  id!: number;
  routine_id!: number;
  ordre!: number;
  action!: string;
}

// Fonctions utilitaires pour RoutineStep
export const createRoutineStep = async (data: {
  routine_id: number;
  ordre: number;
  action: string;
}) => {
  return await prisma.routineStep.create({ data });
};

export const findRoutineStepById = async (id: number) => {
  return await prisma.routineStep.findUnique({ 
    where: { id },
    include: { ingredients: true }
  });
};

export const findRoutineStepsByRoutineId = async (routine_id: number) => {
  return await prisma.routineStep.findMany({ 
    where: { routine_id },
    include: { ingredients: true },
    orderBy: { ordre: 'asc' }
  });
};

export const findAllRoutineSteps = async () => {
  return await prisma.routineStep.findMany({ include: { ingredients: true } });
};

export const updateRoutineStep = async (id: number, data: Partial<Omit<RoutineStep, 'id'>>) => {
  return await prisma.routineStep.update({ where: { id }, data });
};

export const deleteRoutineStep = async (id: number) => {
  return await prisma.routineStep.delete({ where: { id } });
};
