import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureSubscriptionAmountColumn } from '@/lib/subscription-schema';

const isMissingAmountFieldError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('Unknown argument `amount`');
};


export async function GET(request: NextRequest) {
    try {
        await ensureSubscriptionAmountColumn();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Récupérer l'abonnement le plus récent pour cet utilisateur
        const subscription = await prisma.subscription.findFirst({
            where: { user_id: Number(userId) },
            orderBy: { date_fin: 'desc' },
            select: {
                id: true,
                plan: true,
                date_debut: true,
                date_fin: true,
                amount: true,
            },
        });

        if (!subscription) {
            return NextResponse.json({
                status: 'none',
                message: 'No subscription found'
            });
        }

        // --- Self-Healing Logic for Null Amounts ---
        if (subscription.amount == null) {
            const planPrice = subscription.plan.toLowerCase().includes('yearly') ? 200 : 20;
            // Update the record in the background to fix the database
            try {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { amount: planPrice }
                });
            } catch (error: unknown) {
                if (!isMissingAmountFieldError(error)) {
                    throw error;
                }

                await prisma.$executeRawUnsafe(
                    'UPDATE "Subscription" SET "amount" = $1 WHERE "id" = $2',
                    planPrice,
                    subscription.id
                );
            }
            // Update the local object for the final response
            subscription.amount = planPrice;
        }
        // -------------------------------------------


        return NextResponse.json({
            status: 'success',
            subscription: {
                plan: subscription.plan,
                date_debut: subscription.date_debut,
                date_fin: subscription.date_fin,
                amount: subscription.amount ?? null,
            }
        });

    } catch (error: unknown) {
        console.error('Fetch subscription error:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de l\'abonnement' },
            { status: 500 }
        );
    }
}
