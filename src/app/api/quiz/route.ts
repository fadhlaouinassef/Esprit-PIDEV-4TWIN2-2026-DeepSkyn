import { NextRequest, NextResponse } from 'next/server';
import { findAllQuizzes, createQuiz } from '@/services/quiz.service';

export async function GET() {
    try {
        const quizzes = await findAllQuizzes();
        return NextResponse.json(quizzes, { status: 200 });
    } catch (error: any) {
        console.error('Get quizzes error:', error);
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { titre, type, description } = await request.json();
        const quiz = await createQuiz({ titre, type, description });
        return NextResponse.json(quiz, { status: 201 });
    } catch (error: any) {
        console.error('Create quiz error:', error);
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }
}
