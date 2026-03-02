import prisma from '@/lib/prisma';
import { EtatFeedback } from '../entities/Enums';

export const createFeedback = async (data: {
  user_id: number;
  contenu: string;
  rating?: number;
  etat?: EtatFeedback;
}) => {
  return await prisma.feedback.create({ data });
};

export const findFeedbackById = async (id: number) => {
  return await prisma.feedback.findUnique({
    where: { id },
    include: { user: true },
  });
};

export const findFeedbacksByUserId = async (userId: number) => {
  return await prisma.feedback.findMany({
    where: { user_id: userId },
    orderBy: { date: 'desc' },
  });
};

export const findVisibleFeedbacks = async () => {
  return await prisma.feedback.findMany({
    where: { etat: EtatFeedback.visible },
    include: { user: true },
    orderBy: { date: 'desc' },
  });
};

export const findAllFeedbacks = async () => {
  return await prisma.feedback.findMany({
    include: { user: true },
    orderBy: { date: 'desc' },
  });
};

export const updateFeedback = async (
  id: number,
  data: { contenu?: string; rating?: number; etat?: EtatFeedback }
) => {
  return await prisma.feedback.update({ where: { id }, data });
};

export const deleteFeedback = async (id: number) => {
  return await prisma.feedback.delete({ where: { id } });
};
