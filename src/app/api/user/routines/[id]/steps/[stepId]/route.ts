import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { findRoutineById } from '@/entities/Routine';
import { findRoutineStepById, updateRoutineStep } from '@/entities/RoutineStep';
import { deleteRoutineStepCompletion, findCompletionForStepAndDay, upsertRoutineStepCompletion } from '@/entities/RoutineStepCompletion';
import prisma from '@/lib/prisma';
import { evaluateAndAwardBadgesForUser } from '@/services/badge.service';

const toDayStringUTC = (date: Date) => date.toISOString().slice(0, 10);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const routineId = parseInt(resolvedParams.id);
    const stepId = parseInt(resolvedParams.stepId);

    const routine = await findRoutineById(routineId);
    const step = await findRoutineStepById(stepId);

    if (!routine || !step) {
      return NextResponse.json({ error: 'Routine or step not found' }, { status: 404 });
    }

    if (step.routine_id !== routineId) {
      return NextResponse.json({ error: 'Step does not belong to this routine' }, { status: 400 });
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
    const { ordre, action, completed } = body as {
      ordre?: number;
      action?: string;
      completed?: boolean;
    };

    const day = toDayStringUTC(new Date());

    if (typeof completed === 'boolean') {
      if (completed) {
        // Constraint: Check if previous step is completed for the same day
        if (step.ordre > 1) {
          const allSteps = await prisma.routineStep.findMany({
            where: { routine_id: routineId },
            orderBy: { ordre: 'asc' }
          });
          
          const stepIndex = allSteps.findIndex(s => s.id === stepId);
          if (stepIndex > 0) {
            const prevStep = allSteps[stepIndex - 1];
            const prevCompletion = await findCompletionForStepAndDay({ 
              routine_step_id: prevStep.id, 
              day 
            });
            
            if (!prevCompletion) {
              return NextResponse.json({ 
                error: 'Sequential validation required', 
                details: 'Please complete the previous step first.' 
              }, { status: 400 });
            }
          }
        }
        await upsertRoutineStepCompletion({ routine_step_id: stepId, day });
      } else {
        try {
          await deleteRoutineStepCompletion({ routine_step_id: stepId, day });
        } catch {
          // ignore if already deleted
        }
      }

      try {
        await evaluateAndAwardBadgesForUser({
          userId: dbUser.id,
          trigger: 'routine_step',
        });
      } catch (badgeError) {
        // Badge refresh should never block step completion.
        console.error('Routine step badge evaluation warning:', badgeError);
      }
    }

    // Only update step fields when at least one editable field is provided.
    const stepUpdates = {
      ...(typeof ordre === 'number' ? { ordre } : {}),
      ...(typeof action === 'string' ? { action } : {}),
    };

    const hasStepUpdates = Object.keys(stepUpdates).length > 0;
    const updatedStep = hasStepUpdates
      ? await updateRoutineStep(stepId, stepUpdates)
      : step;

    const completion = await findCompletionForStepAndDay({ routine_step_id: stepId, day });

    return NextResponse.json(
      {
        step: {
          ...updatedStep,
          completed: Boolean(completion),
          completedAt: completion?.created_at?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('PUT Step error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const routineId = parseInt(resolvedParams.id);
    const stepId = parseInt(resolvedParams.stepId);

    const routine = await findRoutineById(routineId);
    const step = await findRoutineStepById(stepId);

    if (!routine || !step) {
      return NextResponse.json({ error: 'Routine or step not found' }, { status: 404 });
    }

    if (step.routine_id !== routineId) {
      return NextResponse.json({ error: 'Step does not belong to this routine' }, { status: 400 });
    }

    // Verify ownership
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!dbUser || dbUser.id !== routine.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.routineStep.delete({
      where: { id: stepId }
    });

    return NextResponse.json({ message: 'Step deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('DELETE Step error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal Server Error',
      details: errorMessage
    }, { status: 500 });
  }
}
