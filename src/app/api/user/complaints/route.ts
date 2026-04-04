import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendAdminComplaintNotification } from "@/lib/mailService";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const complaints = await prisma.complaint.findMany({
            where: { user_id: user.id },
            include: {
                messages: true,
                evidence: true
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(complaints);
    } catch (error) {
        console.error("[COMPLAINTS_GET_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { category, content, evidence } = await req.json();

        // Check for bad words via external API (PurgoMalum)
        let cleanContent = content;
        let wasFiltered = false;
        try {
            const checkRes = await fetch(`https://www.purgomalum.com/service/json?text=${encodeURIComponent(content)}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                const filtered = String(checkData.result);
                if (filtered.trim() !== content.trim()) {
                    wasFiltered = true;
                    // Replace standard * with 🚫 for visual prohibition feel
                    cleanContent = filtered.replace(/\*/g, '🚫'); 
                } else {
                    cleanContent = filtered;
                }
            }
        } catch (e) {
            console.warn("PurgoMalum check failed, using original content.", e);
        }

        const complaint = await prisma.complaint.create({
            data: {
                user_id: user.id,
                category: category as any,
                content: cleanContent,
                status: 'PENDING',
                evidence: {
                    create: (evidence || []).map((url: string) => ({ url }))
                },
                messages: {
                    create: wasFiltered ? [
                        { sender_role: 'USER', text: cleanContent },
                        { sender_role: 'ADMIN', text: "⚠️ System Warning: Your message contained offensive language. Please follow our community guidelines to avoid account suspension." }
                    ] : [
                        { sender_role: 'USER', text: cleanContent }
                    ]
                }
            },
            include: {
                messages: true,
                evidence: true
            }
        });

        // Trigger email notification to admin asynchronously (don't block the response)
        sendAdminComplaintNotification({
            userName: user.nom ? `${user.nom} ${user.prenom || ''}` : user.email,
            userEmail: user.email,
            category: (complaint as any).category,
            content: (complaint as any).content,
            complaintId: complaint.id
        }).catch(err => console.error("Email notification error", err));

        return NextResponse.json(complaint);
    } catch (error) {
        console.error("[COMPLAINTS_POST_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
