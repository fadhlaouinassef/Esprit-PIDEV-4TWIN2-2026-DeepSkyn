import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { findRoutineById } from '@/entities/Routine';
import { createRoutineStep } from '@/entities/RoutineStep';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const routineId = parseInt(resolvedParams.id);
    const routine = await findRoutineById(routineId);

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Verify ownership
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!dbUser || dbUser.id !== routine.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { ordre, action } = body;

    if (!ordre || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const step = await createRoutineStep({
      routine_id: routineId,
      ordre,
      action,
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST Step error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}
