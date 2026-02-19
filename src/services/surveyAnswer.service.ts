import { prisma } from '../../prisma/prisma.config';

export const createSurveyAnswer = async (data: {
  user_id: number;
  question_id: number;
  reponse: string;
}) => {
  return await prisma.surveyAnswer.create({ data });
};

export const findSurveyAnswerById = async (id: number) => {
  return await prisma.surveyAnswer.findUnique({ where: { id } });
};

export const findSurveyAnswersByUserId = async (userId: number) => {
  return await prisma.surveyAnswer.findMany({
    where: { user_id: userId },
    include: { question: true },
  });
};

export const findSurveyAnswersByQuestionId = async (questionId: number) => {
  return await prisma.surveyAnswer.findMany({
    where: { question_id: questionId },
  });
};

export const findAllSurveyAnswers = async () => {
  return await prisma.surveyAnswer.findMany({
    include: { user: true, question: true },
  });
};

export const updateSurveyAnswer = async (
  id: number,
  data: { reponse?: string }
) => {
  return await prisma.surveyAnswer.update({ where: { id }, data });
};

export const deleteSurveyAnswer = async (id: number) => {
  return await prisma.surveyAnswer.delete({ where: { id } });
};
