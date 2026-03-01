import prisma from '@/lib/prisma';
import { Quiz, QuizQuestion, SurveyAnswer } from '@prisma/client';

/**
 * --- Questionnaire / Quiz CRUD ---
 */

/**
 * Create a new questionnaire (Quiz)
 */
export const createQuiz = async (data: { titre: string; type: string; description?: string }) => {
  return await prisma.quiz.create({
    data: {
      titre: data.titre,
      type: data.type,
      description: data.description,
    },
  });
};

/**
 * Get all questionnaires with their questions
 */
export const findAllQuizzes = async () => {
  return await prisma.quiz.findMany({
    include: {
      questions: true,
    },
  });
};

/**
 * Get a specific questionnaire by ID with its questions
 */
export const findQuizById = async (id: number) => {
  return await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  });
};

/**
 * Update a questionnaire
 */
export const updateQuiz = async (id: number, data: { titre?: string; type?: string; description?: string }) => {
  return await prisma.quiz.update({
    where: { id },
    data,
  });
};

/**
 * Delete a questionnaire (Cascade deletion of questions is handled by Prisma)
 */
export const deleteQuiz = async (id: number) => {
  return await prisma.quiz.delete({
    where: { id },
  });
};

/**
 * --- Questionnaire Questions CRUD ---
 */

/**
 * Create a new question for a questionnaire
 */
export const createQuestion = async (data: {
  quiz_id: number;
  question: string;
  type_reponse: string;
  options?: string;
}) => {
  const result = await prisma.quizQuestion.create({
    data: {
      quiz_id: data.quiz_id,
      question: data.question,
      type_reponse: data.type_reponse,
      reponse_options: data.options || null,
    },
  });
  return result;
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  id: number,
  data: { question?: string; type_reponse?: string; reponse_options?: string }
) => {
  return await prisma.quizQuestion.update({
    where: { id },
    data: {
      question: data.question,
      type_reponse: data.type_reponse,
      reponse_options: data.reponse_options
    },
  });
};

/**
 * Delete a question
 */
export const deleteQuestion = async (id: number) => {
  return await prisma.quizQuestion.delete({
    where: { id },
  });
};

/**
 * --- User Answers Logic ---
 */

/**
 * Save a single user answer
 */
export const saveUserAnswer = async (data: {
  user_id: number;
  quiz_id: number;
  question_id: number;
  reponse: string;
}) => {
  return await prisma.surveyAnswer.create({
    data,
  });
};

/**
 * Save multiple user answers at once
 */
export const saveMultipleUserAnswers = async (
  answers: {
    user_id: number;
    quiz_id: number;
    question_id: number;
    reponse: string;
  }[]
) => {
  return await prisma.surveyAnswer.createMany({
    data: answers,
  });
};

/**
 * Get all answers for a specific user and questionnaire
 */
export const findUserAnswersByQuiz = async (user_id: number, quiz_id: number) => {
  return await prisma.surveyAnswer.findMany({
    where: {
      user_id,
      quiz_id,
    },
    include: {
      question: true,
    },
  });
};
