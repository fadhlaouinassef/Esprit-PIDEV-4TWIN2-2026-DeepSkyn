import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { saveUserAnswer } from '@/services/quiz.service';
import { computeAndStoreSkinScoreAnalysis } from '@/services/skinScoreAnalysis.service';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json(
        {
          skipped: true,
          reason: 'Empty request body.',
        },
        { status: 200 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const bodyRecord = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
    const nestedBody = bodyRecord.body;
    const payload = (nestedBody && typeof nestedBody === 'object') ? (nestedBody as Record<string, unknown>) : bodyRecord;

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

    const existing = await prisma.surveyAnswer.findFirst({
      where: {
        user_id: userId,
        question_id: questionId,
        quiz_id: quizId,
      },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.surveyAnswer.update({
          where: { id: existing.id },
          data: { reponse: answer },
        })
      : await saveUserAnswer({
          user_id: userId,
          question_id: questionId,
          reponse: answer,
          quiz_id: quizId,
        });

    let scoreSnapshot: unknown = null;
    try {
      scoreSnapshot = await computeAndStoreSkinScoreAnalysis({
        userId,
        quizId,
        trigger: 'progress',
        saveLegacySkinAnalyse: false,
      });
    } catch (analysisError) {
      console.warn('Progressive skin analysis skipped:', analysisError);
    }

    return NextResponse.json({
      answer: saved,
      analysis: scoreSnapshot,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Save quiz answer error:', error);
    return NextResponse.json({ error: 'Failed to save quiz answer' }, { status: 500 });
  }
}
