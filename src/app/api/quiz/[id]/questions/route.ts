import { NextRequest, NextResponse } from 'next/server';
import { createQuestion } from '@/services/quiz.service';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const quiz_id = parseInt(idStr);
        const body = await request.json();
        const { question, type_reponse, options } = body;

        console.log(`[API] Creating question for quiz ${quiz_id}:`, { question, type_reponse });

        if (isNaN(quiz_id)) {
            return NextResponse.json({ error: 'Invalid Quiz ID' }, { status: 400 });
        }

        const result = await createQuestion({ quiz_id, question, type_reponse, options });
        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Create question error:', error);
        return NextResponse.json({ error: 'Failed to create question', details: error.message }, { status: 500 });
    }
}
