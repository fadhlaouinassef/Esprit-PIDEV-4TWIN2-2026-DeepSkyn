import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { saveUserAnswer } from '@/services/quiz.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = body?.body && typeof body.body === 'object' ? body.body : body;

    const userId = Number(payload.userId);
    const questionId = Number(payload.questionId ?? payload.lastQuestionId);
    const answer = String(payload.answer ?? payload.lastAnswer ?? '');

    const hasAnswerToSave = !Number.isNaN(questionId) && answer.trim().length > 0;
    if (!hasAnswerToSave) {
      return NextResponse.json(
        {
          skipped: true,
          reason: 'No answer to save yet.',
        },
        { status: 200 }
      );
    }

    if (Number.isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid payload. userId is required when saving an answer.',
        },
        { status: 400 }
      );
    }

    let quizId = payload.quizId ? Number(payload.quizId) : undefined;
    if (quizId !== undefined && Number.isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quizId' }, { status: 400 });
    }

    if (quizId === undefined) {
      const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
        select: { quiz_id: true },
      });

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }

      quizId = question.quiz_id;
    }

    const saved = await saveUserAnswer({
      user_id: userId,
      question_id: questionId,
      reponse: answer,
      quiz_id: quizId,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error: unknown) {
    console.error('Save quiz answer error:', error);
    return NextResponse.json({ error: 'Failed to save quiz answer' }, { status: 500 });
  }
}
