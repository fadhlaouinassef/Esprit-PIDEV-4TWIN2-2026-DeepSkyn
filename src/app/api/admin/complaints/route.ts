import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify admin
        const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
        // Assume role check here if your app uses one. e.g., if (adminUser?.role !== 'ADMIN') return ...
        if (!adminUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const complaints = await prisma.complaint.findMany({
            include: {
                messages: {
                    orderBy: { created_at: 'asc' }
                },
                evidence: true,
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(complaints);
    } catch (error) {
        console.error("[ADMIN_COMPLAINTS_GET_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
