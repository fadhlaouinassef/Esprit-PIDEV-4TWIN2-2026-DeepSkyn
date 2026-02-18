import { NextRequest, NextResponse } from 'next/server';
import { signin } from '@/services/auth.service';

export async function GET(request: NextRequest) {
  // Handle GET requests by redirecting to signin page
  // This is used when NextAuth redirects with errors
  return NextResponse.redirect(new URL('/signin', request.url));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await signin({ email, password });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Signin API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sign in' },
      { status: 401 }
    );
  }
}
