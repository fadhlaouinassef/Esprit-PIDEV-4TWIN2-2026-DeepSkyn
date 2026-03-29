import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user by email
    const userRows = await prisma.$queryRawUnsafe<{ id: number, age: number | null }[]>(
      `SELECT id, age FROM "User" WHERE email = $1 LIMIT 1`,
      session.user.email
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id: userId, age: userAgeValue } = userRows[0];
    const actualAge = userAgeValue || 28; // fallback to 28 if not set

    console.log('[analyses] Fetching for user:', session.user.email, '-> id:', userId);

    // Correct logic: Show only finished analyses (trigger = 'final') to avoid showing progress snapshots.
    const analyses = await prisma.$queryRawUnsafe<any[]>(`
      SELECT *
      FROM "SkinScoreAnalysis"
      WHERE user_id = $1 AND trigger = 'final'
      ORDER BY created_at DESC
    `, userId);

    console.log('[analyses] Found', analyses.length, 'total records for user');

    if (!analyses || analyses.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Calculate progressive status by comparing scores
    const formattedAnalyses = analyses.map((analysis: any, index: number) => {
      let status = 'Stable';
      // Compare with previous analysis (next in the DESC sorted array)
      if (index < analyses.length - 1) {
        const prevScore = Number(analyses[index + 1].score);
        const currScore = Number(analysis.score);
        if (currScore > prevScore + 2) status = 'Improved';
        else if (currScore < prevScore - 2) status = 'Worse';
      }

      const parseJson = (val: any) => {
        if (!val) return null;
        if (typeof val === 'object') return val;
        try { return JSON.parse(val); } catch { return null; }
      };

      const recommendations = parseJson(analysis.recommendations) || {};
      const routine = parseJson(analysis.routine) || { morning: [], evening: [] };
      const concerns = parseJson(analysis.concerns) || [];

      return {
        id: String(analysis.id),
        date: new Date(analysis.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        }) + ' at ' + new Date(analysis.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
        }),
        fullDate: analysis.created_at, // useful for sorting or hidden fields
        score: Math.round(Number(analysis.score)),
        skinType: analysis.skin_type || 'Unknown',
        status,
        hydration: Math.round(Number(analysis.hydration || 0)),
        oilProduction: Math.round(100 - Number(analysis.clarity || 0)),
        sensitivity: Number(analysis.calmness || 0) < 50 ? 'High' : Number(analysis.calmness || 0) < 75 ? 'Medium' : 'Low',
        concerns: Array.isArray(concerns) ? concerns : [],
        skinAge: analysis.age_peau,
        actualAge: actualAge,
        riskFactor: Number(analysis.protection || 0) < 60 ? 'High' : 'Low',
        recommendations,
        routine,
        summary: analysis.summary || '',
        trigger: analysis.trigger,
      };
    });

    return NextResponse.json(formattedAnalyses, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching user analyses:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses', details: error?.message }, { status: 500 });
  }
}
