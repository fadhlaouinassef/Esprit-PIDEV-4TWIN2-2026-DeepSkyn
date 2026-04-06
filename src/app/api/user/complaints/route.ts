import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendAdminComplaintNotification } from "@/lib/mailService";

// Bad word filter function (reusing logic from messages)
async function filterText(text: string) {
    try {
        const checkRes = await fetch(`https://www.purgomalum.com/service/json?text=${encodeURIComponent(text)}`);
        if (checkRes.ok) {
            const checkData = await checkRes.json();
            const filtered = String(checkData.result);
            return {
                cleanText: filtered.replace(/\*/g, '🚫'),
                wasFiltered: filtered.trim() !== text.trim()
            };
        }
    } catch (e) {
        console.warn("PurgoMalum check failed for complaint creation.", e);
    }
    return { cleanText: text, wasFiltered: false };
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const complaints = await prisma.complaint.findMany({
            where: { user_id: user.id },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' }
                },
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

        // Step 1: Filter the content
        const { cleanText, wasFiltered } = await filterText(content);

        // Step 2: Create the complaint
        // We create the complaint and its initial message together
        const complaint = await prisma.complaint.create({
            data: {
                user_id: user.id,
                category: category || 'OTHER',
                content: cleanText,
                messages: {
                    create: {
                        sender_role: 'USER',
                        text: cleanText
                    }
                },
                evidence: evidence ? {
                    create: evidence.map((url: string) => ({ url }))
                } : undefined
            },
            include: {
                messages: true,
                evidence: true
            }
        });

        // Step 3: Send Notification Email to Admin
        try {
            await sendAdminComplaintNotification({
                userName: `${user.nom || ''} ${user.prenom || ''}`.trim() || user.email,
                userEmail: user.email,
                category: complaint.category,
                content: cleanText,
                complaintId: complaint.id
            });
        } catch (mailError) {
            console.error("[MAIL_NOTIFICATION_ERROR]", mailError);
        }

        // Step 4: If filtered, add a warning message from system
        if (wasFiltered) {
            await prisma.complaintMessage.create({
                data: {
                    complaint_id: complaint.id,
                    sender_role: 'ADMIN',
                    text: "⚠️ System Warning: Your message contained prohibited content. Continued use of such language will result in ticket closure."
                }
            });

            // Refetch to include updated messages
            const updatedComplaint = await prisma.complaint.findUnique({
                where: { id: complaint.id },
                include: { messages: true, evidence: true }
            });
            return NextResponse.json(updatedComplaint);
        }

        return NextResponse.json(complaint);
    } catch (error) {
        console.error("[COMPLAINTS_POST_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
