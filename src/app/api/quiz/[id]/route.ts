import { NextRequest, NextResponse } from 'next/server';
import { findQuizById, updateQuiz, deleteQuiz } from '@/services/quiz.service';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        const quiz = await findQuizById(id);
        if (!quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }
        return NextResponse.json(quiz, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        const { titre, type, description } = await request.json();
        const quiz = await updateQuiz(id, { titre, type, description });
        return NextResponse.json(quiz, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        await deleteQuiz(id);
        return NextResponse.json({ message: 'Quiz deleted' }, { status: 200 });
    } catch (error: any) {
        console.error('Delete quiz API error:', error);
        return NextResponse.json({ error: 'Failed to delete quiz', details: error.message }, { status: 500 });
    }
}
