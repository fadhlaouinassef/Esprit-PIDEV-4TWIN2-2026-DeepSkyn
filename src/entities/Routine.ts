import prisma from '@/lib/prisma';

export class Routine {
  id!: number;
  user_id!: number;
  type!: string;
  envie?: string;
  objectif?: string;
}

// Fonctions utilitaires pour Routine
export const createRoutine = async (data: {
  user_id: number;
  type: string;
  envie?: string;
  objectif?: string;
}) => {
  return await prisma.routine.create({ data });
};

export const findRoutineById = async (id: number) => {
  return await prisma.routine.findUnique({ 
    where: { id },
    include: { steps: true }
  });
};

export const findRoutinesByUserId = async (user_id: number) => {
  return await prisma.routine.findMany({ 
    where: { user_id },
    include: { steps: true }
  });
};

export const findAllRoutines = async () => {
  return await prisma.routine.findMany({ include: { steps: true } });
};

export const updateRoutine = async (id: number, data: Partial<Omit<Routine, 'id'>>) => {
  return await prisma.routine.update({ where: { id }, data });
};

export const deleteRoutine = async (id: number) => {
  return await prisma.routine.delete({ where: { id } });
};
