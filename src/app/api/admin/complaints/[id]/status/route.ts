import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendUserStatusUpdateNotification } from "@/lib/mailService";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!adminUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { status } = await req.json();
        const { id } = await params;
        const complaintId = parseInt(id);

        const allowedStatuses = ['PENDING', 'ACCEPT', 'REJECT'];
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: complaintId },
            data: { status },
            include: { user: true }
        });

        if (updatedComplaint.user?.email) {
            await sendUserStatusUpdateNotification({
                userName: `${updatedComplaint.user.nom || ''} ${updatedComplaint.user.prenom || ''}`.trim() || 'User',
                userEmail: updatedComplaint.user.email,
                category: updatedComplaint.category,
                status: updatedComplaint.status,
                complaintId: updatedComplaint.id
            });
        }

        return NextResponse.json(updatedComplaint);
    } catch (error) {
        console.error("[ADMIN_COMPLAINTS_STATUS_PUT_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
