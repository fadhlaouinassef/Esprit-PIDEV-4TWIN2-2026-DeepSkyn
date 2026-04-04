
import { NextRequest, NextResponse } from 'next/server';
import { resendOtp } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await resendOtp(parseInt(userId));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Resend OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend code' },
      { status: 400 }
    );
  }
}
