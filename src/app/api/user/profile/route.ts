import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserWithRelations, updateUser } from '@/services/user.service';
import { prisma } from '../../../../../prisma/prisma.config';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                badges: true,
                subscriptions: true,
                skinAnalyses: {
                    orderBy: { date_creation: 'desc' },
                    take: 5,
                },
            },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove password and sensitive info
        const { password, otp_code, otp_expiry, ...safeUser } = dbUser;

        return NextResponse.json(safeUser, { status: 200 });
    } catch (error: any) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nom, age, sexe, skin_type, image } = body;

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser = await updateUser(dbUser.id, {
            nom,
            age: age ? parseInt(age) : undefined,
            sexe,
            skin_type,
            image,
        });

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                nom: updatedUser.nom,
                email: updatedUser.email,
                image: updatedUser.image,
            },
        });
    } catch (error: any) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
