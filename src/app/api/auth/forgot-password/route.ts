import { NextRequest, NextResponse } from 'next/server';
import { forgotPassword } from '@/services/auth.service';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email est requis' }, { status: 400 });
        }

        const result = await forgotPassword(email);
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Forgot password API error:', error);
        return NextResponse.json(
            { error: error.message || 'Échec de l\'envoi du code' },
            { status: 400 }
        );
    }
}
