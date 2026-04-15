import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { findRoutineById, updateRoutine } from '@/entities/Routine';
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
      select: { id: true },
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
      select: { id: true },
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
    const routineId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(routineId)) {
      return NextResponse.json({ error: 'Invalid routine id' }, { status: 400 });
    }

    // Lightweight ownership pre-check: avoid loading routine steps for a delete path.
    const routineOwner = await prisma.routine.findUnique({
      where: { id: routineId },
      select: { user_id: true },
    });

    if (!routineOwner) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const sessionUserId = Number(session.user.id);
    const ownerUserId = Number(routineOwner.user_id);

    if (!Number.isFinite(sessionUserId) || sessionUserId !== ownerUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Manual child cleanup can be faster than relying only on cascading constraints for large routines.
    const stepIdsRows = await prisma.routineStep.findMany({
      where: { routine_id: routineId },
      select: { id: true },
    });
    const stepIds = stepIdsRows.map((row) => row.id);

    let ingredientIds: number[] = [];
    if (stepIds.length > 0) {
      const ingredientRows = await prisma.ingredient.findMany({
        where: { routine_step_id: { in: stepIds } },
        select: { id: true },
      });
      ingredientIds = ingredientRows.map((row) => row.id);
    }

    const tx = [];

    if (ingredientIds.length > 0) {
      tx.push(
        prisma.ingredientConflict.deleteMany({
          where: { ingredient_id: { in: ingredientIds } },
        })
      );
    }

    if (stepIds.length > 0) {
      tx.push(
        prisma.routineStepCompletion.deleteMany({
          where: { routine_step_id: { in: stepIds } },
        })
      );
      tx.push(
        prisma.ingredient.deleteMany({
          where: { routine_step_id: { in: stepIds } },
        })
      );
      tx.push(
        prisma.routineStep.deleteMany({
          where: { routine_id: routineId },
        })
      );
    }

    tx.push(prisma.routine.delete({ where: { id: routineId } }));

    await prisma.$transaction(tx);

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
