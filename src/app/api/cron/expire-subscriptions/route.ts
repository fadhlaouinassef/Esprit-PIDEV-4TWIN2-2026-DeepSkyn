import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";

/**
 * Cron task to expire subscriptions.
 * Should be called periodically (e.g., daily).
 * 
 * Logic: Finds all PREMIUM_USERs whose latest subscription has ended,
 * and reverts their role back to USER.
 */
export async function GET(request: Request) {
  try {
    // Optional: Secret check to prevent unauthorized hits
    // const { searchParams } = new URL(request.url);
    // const secret = searchParams.get('secret');
    // if (secret !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const now = new Date();

    // 1. Find all users with PREMIUM_USER role
    const premiumUsers = await prisma.user.findMany({
      where: {
        role: 'PREMIUM_USER',
      },
      include: {
        subscriptions: {
          orderBy: {
            date_fin: 'desc',
          },
          take: 1,
        },
      },
    });

    const expiredUsersCount = 0;
    const updates = [];

    for (const user of premiumUsers) {
      const latestSub = user.subscriptions[0];

      // If no subscription record found or the latest sub has expired
      if (!latestSub || latestSub.date_fin < now) {
        console.log(`Downgrading user ${user.id} (${user.email}) to Normal USER.`);
        
        updates.push(
          prisma.user.update({
            where: { id: user.id },
            data: { role: 'USER' },
          })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${premiumUsers.length} premium users. Downgraded ${updates.length} expired subscriptions.`,
      timestamp: now.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Subscription Expiration Cron Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
