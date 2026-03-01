import prisma from '@/lib/prisma';

export class QuizQuestion {
  id!: number;
  quiz_id!: number;
  question!: string;
  type_reponse!: string;
}

// Fonctions utilitaires pour QuizQuestion
export const createQuizQuestion = async (data: {
  quiz_id: number;
  question: string;
  type_reponse: string;
}) => {
  return await prisma.quizQuestion.create({ data });
};

export const findQuizQuestionById = async (id: number) => {
  return await prisma.quizQuestion.findUnique({ where: { id } });
};

export const findQuizQuestionsByQuizId = async (quiz_id: number) => {
  return await prisma.quizQuestion.findMany({ where: { quiz_id } });
};

export const findAllQuizQuestions = async () => {
  return await prisma.quizQuestion.findMany();
};

export const updateQuizQuestion = async (id: number, data: Partial<Omit<QuizQuestion, 'id'>>) => {
  return await prisma.quizQuestion.update({ where: { id }, data });
};

export const deleteQuizQuestion = async (id: number) => {
  return await prisma.quizQuestion.delete({ where: { id } });
};
