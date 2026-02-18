import { NextRequest, NextResponse } from 'next/server';
import { signup } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nom, sexe, age } = body;

    // Validate input
    if (!email || !password || !nom) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const result = await signup({ email, password, nom, sexe, age });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    );
  }
}
