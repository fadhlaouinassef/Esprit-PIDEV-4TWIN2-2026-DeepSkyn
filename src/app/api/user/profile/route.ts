import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserWithRelations, updateUser } from '@/services/user.service';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                role: true,
                created_at: true,
                nom: true,
                prenom: true,
                sexe: true,
                age: true,
                skin_type: true,
                image: true,
                verified: true,
                password: true,
                otp_code: true,
                otp_expiry: true,
                badges: {
                    select: {
                        id: true,
                        titre: true,
                        niveau: true,
                        description: true,
                        date: true,
                    },
                    orderBy: { date: 'desc' },
                    take: 1,
                },
                subscriptions: {
                    select: {
                        id: true,
                        user_id: true,
                        plan: true,
                        date_debut: true,
                        date_fin: true,
                    },
                },
                skinAnalyses: {
                    select: {
                        id: true,
                        user_id: true,
                        score_eau: true,
                        age_peau: true,
                        date_creation: true,
                        score: true,
                        description: true,
                        images: {
                            select: {
                                id: true,
                                analyse_id: true,
                                image_url: true,
                            },
                        },
                    },
                    orderBy: { date_creation: 'desc' },
                    take: 1,
                },
            },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove password and sensitive info
        const { password, otp_code, otp_expiry, ...safeUser } = dbUser;

        return NextResponse.json({
            ...safeUser,
            hasPassword: !!password && password.length > 0
        }, { status: 200 });
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
        const { nom, prenom, age, sexe, skin_type, image } = body;

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updatedUser = await updateUser(dbUser.id, {
            nom,
            prenom,
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
