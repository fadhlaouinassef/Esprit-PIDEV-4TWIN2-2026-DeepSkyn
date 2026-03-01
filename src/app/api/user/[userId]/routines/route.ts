import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { findRoutinesByUserId, createRoutine } from '@/entities/Routine';
import { findCompletionsForStepsAndDays } from '@/entities/RoutineStepCompletion';
import prisma from '@/lib/prisma';

const toDayStringUTC = (date: Date) => date.toISOString().slice(0, 10);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userId);

    // Verify user can only access their own routines
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser || dbUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const routines = await findRoutinesByUserId(userId);

    const day = toDayStringUTC(new Date());
    const stepIds: number[] = routines.flatMap((r) => r.steps.map((s) => s.id));

    const completions = await findCompletionsForStepsAndDays({
      routine_step_ids: stepIds,
      days: [day],
    });

    const completionMap = new Map<number, string>();
    for (const c of completions) {
      completionMap.set(c.routine_step_id, c.created_at.toISOString());
    }

    const routinesWithCompletion = routines.map((r) => ({
      ...r,
      steps: r.steps.map((s) => ({
        ...s,
        completed: completionMap.has(s.id),
        completedAt: completionMap.get(s.id),
      })),
    }));

    return NextResponse.json({ routines: routinesWithCompletion }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET Routines error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.userId);

    // Verify user can only create their own routines
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser || dbUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, envie, objectif } = body;

    if (!type || !['morning', 'night', 'weekly'].includes(type)) {
      return NextResponse.json({ error: 'Invalid routine type' }, { status: 400 });
    }

    const routine = await createRoutine({
      user_id: userId,
      type,
      envie,
      objectif,
    });

    return NextResponse.json({ routine }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST Routine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
