import { NextRequest, NextResponse } from 'next/server';
import { resetPassword } from '@/services/auth.service';

export async function POST(request: NextRequest) {
    try {
        const { userId, password } = await request.json();

        if (!userId || !password) {
            return NextResponse.json({ error: 'ID utilisateur et mot de passe sont requis' }, { status: 400 });
        }

        const result = await resetPassword(Number(userId), password);
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Reset password API error:', error);
        return NextResponse.json(
            { error: error.message || 'Échec de la réinitialisation du mot de passe' },
            { status: 400 }
        );
    }
}
