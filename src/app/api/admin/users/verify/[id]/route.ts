import { NextRequest, NextResponse } from 'next/server';
import { updateUserStatus } from '@/services/user.service';
import { createNotification } from '@/services/notification.service';
import prisma from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function PATCH(
    request: NextRequest,
    context: any
) {
    try {
        const { status } = await request.json();

        // Next.js 15 requires awaiting params. Next.js 14 doesn't. 
        // Using Promise.resolve().then() or await on values works for both.
        const params = await context.params;
        const idStr = params?.id;
        const id = parseInt(idStr);

        console.log(`[API] Processing VERIFY for User ID: ${id} | Status: ${status}`);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid User ID', receivedId: idStr }, { status: 400 });
        }

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status type', receivedStatus: status }, { status: 400 });
        }

        const rowCount = await updateUserStatus(id, status);

        if (status === 'ACCEPTED' && rowCount > 0) {
            const user = await prisma.user.findUnique({ where: { id } });
            if (user) {
                await createNotification({
                    userId: id,
                    image: user.image || "/avatar.png",
                    title: `${user.nom || 'User'} Verified by Admin`,
                    subTitle: "Identity confirmed by Admin",
                    type: 'verify',
                    message: 'Verified by Admin',
                });
            }
        }

        return NextResponse.json({ success: true, affected: rowCount }, { status: 200 });
    } catch (error: any) {
        console.error('SERVER SIDE ERROR - Admin Verify User:', error);
        return NextResponse.json(
            {
                error: (error as any).message || 'Failed to update user',
                stack: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
            },
            { status: 500 }
        );
    }
}
