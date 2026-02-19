import { prisma } from '../../prisma/prisma.config';

export class Quiz {
  id!: number;
  titre!: string;
  type!: string;
}

// Fonctions utilitaires pour Quiz
export const createQuiz = async (data: {
  titre: string;
  type: string;
}) => {
  return await prisma.quiz.create({ data });
};

export const findQuizById = async (id: number) => {
  return await prisma.quiz.findUnique({ 
    where: { id },
    include: { questions: true }
  });
};

export const findQuizByType = async (type: string) => {
  return await prisma.quiz.findMany({ 
    where: { type },
    include: { questions: true }
  });
};

export const findAllQuizzes = async () => {
  return await prisma.quiz.findMany({ include: { questions: true } });
};

export const updateQuiz = async (id: number, data: Partial<Omit<Quiz, 'id'>>) => {
  return await prisma.quiz.update({ where: { id }, data });
};

export const deleteQuiz = async (id: number) => {
  return await prisma.quiz.delete({ where: { id } });
};
