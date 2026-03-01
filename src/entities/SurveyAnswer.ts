import prisma from '@/lib/prisma';

export class SurveyAnswer {
  id!: number;
  user_id!: number;
  question_id!: number;
  reponse!: string;
  quiz_id!: number;
}

// Fonctions utilitaires pour SurveyAnswer
export const createSurveyAnswer = async (data: {
  user_id: number;
  question_id: number;
  quiz_id: number;
  reponse: string;
}) => {
  return await prisma.surveyAnswer.create({ data });
};

export const findSurveyAnswerById = async (id: number) => {
  return await prisma.surveyAnswer.findUnique({ where: { id } });
};

export const findSurveyAnswersByUserId = async (user_id: number) => {
  return await prisma.surveyAnswer.findMany({ where: { user_id } });
};

export const findSurveyAnswersByQuestionId = async (question_id: number) => {
  return await prisma.surveyAnswer.findMany({ where: { question_id } });
};

export const findSurveyAnswersByQuizId = async (quiz_id: number) => {
  return await prisma.surveyAnswer.findMany({ where: { quiz_id } });
};

export const findAllSurveyAnswers = async () => {
  return await prisma.surveyAnswer.findMany();
};

export const updateSurveyAnswer = async (id: number, data: Partial<Omit<SurveyAnswer, 'id'>>) => {
  return await prisma.surveyAnswer.update({ where: { id }, data });
};

export const deleteSurveyAnswer = async (id: number) => {
  return await prisma.surveyAnswer.delete({ where: { id } });
};
