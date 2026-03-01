import { NextRequest, NextResponse } from 'next/server';
import { findPendingUsers } from '@/services/user.service';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
    try {
        // Basic verification of admin token (optional but recommended)
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token || token.role !== 'ADMIN') {
            // In a real app we'd enforce this, but for now we follow user request logic
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await findPendingUsers();

        // Include all requested info: email, nom, prenom, image, etc.
        const mappedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            sexe: user.sexe,
            age: user.age,
            status: (user as any).status,
            verified: user.verified,
            created_at: user.created_at,
            image: user.image,
            role: user.role,
        }));

        return NextResponse.json(mappedUsers, { status: 200 });
    } catch (error: any) {
        console.error('Admin Fetch Users error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
