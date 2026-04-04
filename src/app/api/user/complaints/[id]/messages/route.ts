import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const { text } = await req.json();
        const { id } = await params;
        const complaintId = parseInt(id);

        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: { user: true }
        });

        if (!complaint || complaint.user_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fix for lint error: cast complaint as any to access status safely if TS is stale
        if ((complaint as any).status === 'REJECT') {
            return NextResponse.json({ error: "This ticket is closed." }, { status: 400 });
        }

        // Bad word filtering check
        let cleanText = text;
        let wasFiltered = false;
        try {
            const checkRes = await fetch(`https://www.purgomalum.com/service/json?text=${encodeURIComponent(text)}`);
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                const filtered = String(checkData.result);
                if (filtered.trim() !== text.trim()) {
                    wasFiltered = true;
                    cleanText = filtered.replace(/\*/g, '🚫');
                } else {
                    cleanText = filtered;
                }
            }
        } catch (e) {
            console.warn("PurgoMalum check failed for reply.", e);
        }

        const message = await prisma.complaintMessage.create({
            data: {
                complaint_id: complaintId,
                sender_role: 'USER',
                text: cleanText
            }
        });

        const results = [message];

        // Add warning message if filtered
        if (wasFiltered) {
            // Check if there are already warnings
            const warningCount = await prisma.complaintMessage.count({
                where: {
                    complaint_id: complaintId,
                    sender_role: 'ADMIN',
                    text: { contains: "⚠️" }
                }
            });

            if (warningCount >= 1) {
                // Second violation (or more) - auto close ticket
                await prisma.complaint.update({
                    where: { id: complaintId },
                    data: { status: 'REJECT' }
                });

                const finalClosure = await prisma.complaintMessage.create({
                    data: {
                        complaint_id: complaintId,
                        sender_role: 'ADMIN',
                        text: "🚨 TICKET CLOSED: Your account has repeatedly violated our community standards by using prohibited language. This ticket is now permanently closed."
                    }
                });
                results.push(finalClosure);
            } else {
                // First violation - send warning
                const warning = await prisma.complaintMessage.create({
                    data: {
                        complaint_id: complaintId,
                        sender_role: 'ADMIN',
                        text: "⚠️ System Warning: Your message contained prohibited content. Continued use of such language will result in ticket closure."
                    }
                });
                results.push(warning);
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("[COMPLAINT_MSG_POST_ERROR]", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
