import { NextRequest, NextResponse } from 'next/server';
import { findAllUsers, createUser } from '@/services/user.service';
import bcrypt from 'bcryptjs';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, password, role, verified, age, sexe, skin_type } = body;

    if (!email || !password || !nom) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      password: hashedPassword,
      nom,
      role: role || 'USER',
      verified: verified ?? false,
      age: age ?? undefined,
      sexe: sexe ?? undefined,
      skin_type: skin_type ?? undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role,
        verified: user.verified,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
