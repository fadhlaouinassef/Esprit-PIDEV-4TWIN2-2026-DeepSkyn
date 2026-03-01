import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { findRoutineById, updateRoutine, deleteRoutine } from '@/entities/Routine';
import prisma from '@/lib/prisma';

export async function GET(
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

    return NextResponse.json({ routine }, { status: 200 });
  } catch (error: unknown) {
    console.error('GET Routine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function PUT(
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
    const { type, envie, objectif } = body;

    const updatedRoutine = await updateRoutine(routineId, {
      type,
      envie,
      objectif,
    });

    return NextResponse.json({ routine: updatedRoutine }, { status: 200 });
  } catch (error: unknown) {
    console.error('PUT Routine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(
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

    await deleteRoutine(routineId);

    return NextResponse.json({ message: 'Routine deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('DELETE Routine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}
