import { NextRequest, NextResponse } from 'next/server';
import { markUserAsVerified, findUserById } from '@/services/user.service';
import { sendWelcomeEmail } from '@/services/email.service';

// PATCH /api/users/[id]/verify
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

    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.verified) {
      return NextResponse.json({ error: 'User is already verified' }, { status: 400 });
    }

    const updated = await markUserAsVerified(id);

    // Envoyer un email de bienvenue à l'utilisateur
    try {
      await sendWelcomeEmail(updated.email, updated.nom || 'User');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // On ne bloque pas la vérification si l'email échoue
    }

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error('Verify user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify user' },
      { status: 500 }
    );
  }
}
