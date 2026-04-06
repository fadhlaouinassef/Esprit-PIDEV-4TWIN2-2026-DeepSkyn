import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!adminUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { text } = await req.json();
        const { id } = await params;
        const complaintId = parseInt(id);

        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId }
        });

        if (!complaint) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        const isClosed = text.includes("🚨 TICKET CLOSED");

        const message = await prisma.complaintMessage.create({
            data: {
                complaint_id: complaintId,
                sender_role: 'ADMIN',
                text
            }
        });

        if (isClosed && (complaint as any).status !== 'REJECT') {
            await prisma.complaint.update({
                where: { id: complaintId },
                data: { status: 'REJECT' }
            });
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error("[ADMIN_COMPLAINTS_MESSAGE_POST_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
