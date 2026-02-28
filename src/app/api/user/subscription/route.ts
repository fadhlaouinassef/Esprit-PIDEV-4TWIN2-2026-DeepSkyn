import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/../prisma/prisma.config';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Récupérer l'abonnement le plus récent pour cet utilisateur
        const subscription = await prisma.subscription.findFirst({
            where: { user_id: Number(userId) },
            orderBy: { date_fin: 'desc' },
        });

        if (!subscription) {
            return NextResponse.json({
                status: 'none',
                message: 'Aucun abonnement trouvé'
            });
        }

        return NextResponse.json({
            status: 'success',
            subscription: {
                plan: subscription.plan,
                date_debut: subscription.date_debut,
                date_fin: subscription.date_fin,
            }
        });
    } catch (error: any) {
        console.error('Fetch subscription error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'abonnement' },
            { status: 500 }
        );
    }
}
