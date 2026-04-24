import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type FeedbackState = "visible" | "invisible";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || String(adminUser.role || "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const feedbackId = Number(id);
    if (!Number.isFinite(feedbackId)) {
      return NextResponse.json({ error: "Invalid feedback id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const etat = String(body?.etat || "").toLowerCase() as FeedbackState;

    if (etat !== "visible" && etat !== "invisible") {
      return NextResponse.json(
        { error: "etat must be visible or invisible" },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { etat },
      select: {
        id: true,
        etat: true,
      },
    });

    return NextResponse.json({ success: true, feedback: updatedFeedback }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN_FEEDBACK_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
