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

    let questions = await prisma.quizQuestion.findMany({
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

    // Fallback if DB is empty to provide a complete 10-question experience
    if (questions.length === 0) {
      return NextResponse.json({
        questions: [
          { id: 101, quizId: 1, text: "What is your main skin concern?", type: "CHOICE", options: ["Acne", "Aging", "Dryness", "Sensitivity"] },
          { id: 102, quizId: 1, text: "What is your skin type?", type: "CHOICE", options: ["Oily", "Dry", "Combination", "Normal"] },
          { id: 103, quizId: 1, text: "Do you use sunscreen daily?", type: "CHOICE", options: ["Yes", "No", "Sometimes"] },
          { id: 104, quizId: 1, text: "How often do you exfoliate?", type: "CHOICE", options: ["Daily", "Weekly", "Monthly", "Never"] },
          { id: 105, quizId: 1, text: "Do you have any known allergies to skincare ingredients?", type: "TEXT", options: [] },
          { id: 106, quizId: 1, text: "How many liters of water do you drink daily?", type: "CHOICE", options: ["Less than 1L", "1-2L", "More than 2L"] },
          { id: 107, quizId: 1, text: "Rate your current stress level (1-10)", type: "CHOICE", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
          { id: 108, quizId: 1, text: "Do you smoke or spend time in highly polluted areas?", type: "CHOICE", options: ["Yes", "No"] },
          { id: 109, quizId: 1, text: "Describe your current evening routine.", type: "TEXT", options: [] },
          { id: 110, quizId: 1, text: "What are your goals for your skin?", type: "TEXT", options: [] }
        ]
      });
    }

    const formatted = questions.map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.question,
      type: q.type_reponse,
      options: q.reponse_options ? JSON.parse(q.reponse_options) : [],
    }));

    return NextResponse.json({ questions: formatted }, { status: 200 });
  } catch (error: unknown) {
    console.error('Get quiz questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz questions' }, { status: 500 });
  }
}
