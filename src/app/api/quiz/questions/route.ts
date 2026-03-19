import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizIdParam = searchParams.get('quizId');
    const quizId = quizIdParam ? parseInt(quizIdParam, 10) : undefined;

    if (quizIdParam && Number.isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid quizId' }, { status: 400 });
    }

    const questions = await prisma.quizQuestion.findMany({
      where: quizId ? { quiz_id: quizId } : undefined,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        quiz_id: true,
        question: true,
        type_reponse: true,
        reponse_options: true,
      },
    });

    const formatted = questions.map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.question,
      type: q.type_reponse,
      options: q.reponse_options ? JSON.parse(q.reponse_options) : [],
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: unknown) {
    console.error('Get quiz questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 });
  }
}
