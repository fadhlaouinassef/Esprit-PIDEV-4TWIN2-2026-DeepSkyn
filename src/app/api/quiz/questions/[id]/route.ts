import { NextRequest, NextResponse } from 'next/server';
import { updateQuestion, deleteQuestion } from '@/services/quiz.service';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        const { question: questionText, type_reponse, options } = await request.json();
        const question = await updateQuestion(id, {
            question: questionText,
            type_reponse,
            reponse_options: options
        });
        return NextResponse.json(question, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        await deleteQuestion(id);
        return NextResponse.json({ message: 'Question deleted' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
    }
}
