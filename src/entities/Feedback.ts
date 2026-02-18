import { EtatFeedback } from './Enums';
import { prisma } from '../../prisma/prisma.config';

export class Feedback {
  id!: number;
  nom!: string;
  message!: string;
  note!: number;
  etat!: EtatFeedback;
}

// Fonctions utilitaires pour Feedback
export const createFeedback = async (data: {
  nom: string;
  message: string;
  note: number;
}) => {
  return await prisma.feedback.create({ data });
};

export const findFeedbackById = async (id: number) => {
  return await prisma.feedback.findUnique({ where: { id } });
};

export const findVisibleFeedbacks = async () => {
  return await prisma.feedback.findMany({ 
    where: { etat: 'visible' },
    orderBy: { note: 'desc' }
  });
};

export const findAllFeedbacks = async () => {
  return await prisma.feedback.findMany();
};

export const updateFeedback = async (id: number, data: Partial<Omit<Feedback, 'id'>>) => {
  return await prisma.feedback.update({ where: { id }, data });
};

export const updateFeedbackEtat = async (id: number, etat: EtatFeedback) => {
  return await prisma.feedback.update({ where: { id }, data: { etat } });
};

export const deleteFeedback = async (id: number) => {
  return await prisma.feedback.delete({ where: { id } });
};
