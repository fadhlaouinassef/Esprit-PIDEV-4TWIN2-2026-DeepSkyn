import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { evaluateAndAwardBadgesForUser } from '@/services/badge.service';

export async function GET(request: Request) {
  try {
    // Optional hardening for external cron callers.
    // const { searchParams } = new URL(request.url);
    // const secret = searchParams.get('secret');
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const users = await prisma.user.findMany({
      where: { activated: true },
      select: { id: true },
    });

    let processed = 0;
    for (const user of users) {
      await evaluateAndAwardBadgesForUser({
        userId: user.id,
        trigger: 'cron',
      });
      processed += 1;
    }

    return NextResponse.json({
      success: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Badge Recalculation Cron Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
