import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { findRoutinesByUserId } from '@/entities/Routine';
import { findCompletionsForStepsAndDays } from '@/entities/RoutineStepCompletion';

const toDayStringUTC = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'morning';

    if (!['morning', 'night', 'weekly'].includes(type)) {
      return NextResponse.json({ error: 'Invalid routine type' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const routines = (await findRoutinesByUserId(dbUser.id)).filter((r) => r.type === type);

    const stepIds = routines.flatMap((r) => r.steps.map((s) => s.id));

    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      days.push(toDayStringUTC(d));
    }

    if (stepIds.length === 0) {
      return NextResponse.json(
        {
          type,
          percentage: 0,
          streak: 0,
          days: days.map((day) => ({ day, completed: false })),
        },
        { status: 200 }
      );
    }

    const completions = await findCompletionsForStepsAndDays({
      routine_step_ids: stepIds,
      days,
    });

    // Index completions by day and step
    const completedByDay = new Map<string, Set<number>>();
    for (const c of completions) {
      if (!completedByDay.has(c.day)) completedByDay.set(c.day, new Set());
      completedByDay.get(c.day)!.add(c.routine_step_id);
    }

    const dayResults = days.map((day) => {
      const completedSteps = completedByDay.get(day) || new Set<number>();
      const isDayCompleted = routines.some((r) => {
        const routineSteps = r.steps;
        if (routineSteps.length === 0) return false;
        return routineSteps.every((s) => completedSteps.has(s.id));
      });
      return { day, completed: isDayCompleted };
    });

    const completedDays = dayResults.filter((d) => d.completed).length;
    const percentage = Math.round((completedDays / 7) * 100);

    // Streak: consecutive completed days from today backwards
    let streak = 0;
    for (let i = dayResults.length - 1; i >= 0; i--) {
      if (dayResults[i].completed) streak++;
      else break;
    }

    return NextResponse.json(
      {
        type,
        percentage,
        streak,
        days: dayResults,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('GET consistency error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details }, { status: 500 });
  }
}
