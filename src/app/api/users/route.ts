import { NextRequest, NextResponse } from 'next/server';
import { findAllUsers } from '@/services/user.service';

export async function GET(request: NextRequest) {
  try {
    const users = await findAllUsers();

    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      role: user.role,
      verified: user.verified,
      created_at: user.created_at,
      age: user.age,
      sexe: user.sexe,
      skin_type: user.skin_type,
      image: user.image,
    }));

    return NextResponse.json(safeUsers, { status: 200 });
  } catch (error: any) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
