import { prisma } from '../../prisma/prisma.config';

export const createRoutine = async (data: {
  user_id: number;
  nom: string;
  description?: string;
}) => {
  return await prisma.routine.create({ data });
};

export const findRoutineById = async (id: number) => {
  return await prisma.routine.findUnique({
    where: { id },
    include: { steps: true },
  });
};

export const findRoutinesByUserId = async (userId: number) => {
  return await prisma.routine.findMany({
    where: { user_id: userId },
    include: { steps: true },
  });
};

export const findAllRoutines = async () => {
  return await prisma.routine.findMany({
    include: { steps: true },
  });
};

export const updateRoutine = async (
  id: number,
  data: { nom?: string; description?: string }
) => {
  return await prisma.routine.update({ where: { id }, data });
};

export const deleteRoutine = async (id: number) => {
  return await prisma.routine.delete({ where: { id } });
};
