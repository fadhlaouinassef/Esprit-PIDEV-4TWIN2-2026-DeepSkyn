import { NextRequest, NextResponse } from 'next/server';
import { deleteUser, findUserById, updateUser, updateActivatedStatus } from '@/services/user.service';
import { sendAccountActivationEmail } from '@/services/email.service';

// DELETE /api/users/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();

    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If only toggling activation, use raw SQL to bypass any Prisma schema sync issue
    if (Object.keys(body).length === 1 && body.activated !== undefined) {
      const activated = Boolean(body.activated);
      await updateActivatedStatus(id, activated);
      // Send activation email only when account is being activated
      if (activated) {
        try {
          await sendAccountActivationEmail(user.email, user.nom || '', user.prenom);
        } catch (emailErr) {
          console.error('Failed to send activation email (non-blocking):', emailErr);
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Explicitly whitelist updatable fields to avoid Prisma unknown-field errors
    const allowedFields: Record<string, unknown> = {};
    if (body.nom !== undefined)       allowedFields.nom       = body.nom;
    if (body.email !== undefined)     allowedFields.email     = body.email;
    if (body.role !== undefined)      allowedFields.role      = body.role;
    if (body.verified !== undefined)  allowedFields.verified  = body.verified;
    if (body.activated !== undefined) allowedFields.activated = Boolean(body.activated);
    if (body.age !== undefined)       allowedFields.age       = body.age;
    if (body.sexe !== undefined)      allowedFields.sexe      = body.sexe;
    if (body.skin_type !== undefined) allowedFields.skin_type = body.skin_type;
    if (body.image !== undefined)     allowedFields.image     = body.image;

    const updated = await updateUser(id, allowedFields as Parameters<typeof updateUser>[1]);
    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

