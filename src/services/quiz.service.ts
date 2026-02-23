import { prisma } from '../../prisma/prisma.config';

export const createQuiz = async (data: {
  titre: string;
  description?: string;
}) => {
  return await prisma.quiz.create({ data });
};

export const findQuizById = async (id: number) => {
  return await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true },
  });
};

export const findAllQuizzes = async () => {
  return await prisma.quiz.findMany({
    include: { questions: true },
  });
};

export const updateQuiz = async (
  id: number,
  data: { titre?: string; description?: string }
) => {
  return await prisma.quiz.update({ where: { id }, data });
};

export const deleteQuiz = async (id: number) => {
  return await prisma.quiz.delete({ where: { id } });
};
