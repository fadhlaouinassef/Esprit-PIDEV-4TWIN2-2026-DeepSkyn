import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/services/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, otp } = body;

    // Validate input
    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP are required' },
        { status: 400 }
      );
    }

    const result = await verifyOtp(Number(userId), otp);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 400 }
    );
  }
}
