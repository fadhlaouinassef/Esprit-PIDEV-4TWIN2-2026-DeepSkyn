import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { id } = await params;
        const complaintId = parseInt(id);

        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId }
        });

        if (!complaint || complaint.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.complaint.delete({
            where: { id: complaintId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COMPLAINT_DELETE_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
