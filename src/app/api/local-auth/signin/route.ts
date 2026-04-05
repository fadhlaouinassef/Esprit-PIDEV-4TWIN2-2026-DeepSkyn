import { NextRequest, NextResponse } from 'next/server';
import { signin } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signin({ email, password });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('Local signin API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
}
