import prisma from '@/lib/prisma';
import { EtatFeedback } from '../entities/Enums';

export const createFeedback = async (data: {
  nom: string;
  message: string;
  note: number;
  etat?: EtatFeedback;
}) => {
  return await prisma.feedback.create({ data });
};

export const findFeedbackById = async (id: number) => {
  return await prisma.feedback.findUnique({ where: { id } });
};

export const findVisibleFeedbacks = async () => {
  return await prisma.feedback.findMany({
    where: { etat: EtatFeedback.VISIBLE },
  });
};

export const findAllFeedbacks = async () => {
  return await prisma.feedback.findMany();
};

export const updateFeedback = async (
  id: number,
  data: { nom?: string; message?: string; note?: number; etat?: EtatFeedback }
) => {
  return await prisma.feedback.update({ where: { id }, data });
};

export const deleteFeedback = async (id: number) => {
  return await prisma.feedback.delete({ where: { id } });
};
