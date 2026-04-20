import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

type FeedbackPayload = {
  rating?: number;
  message?: string;
  publish?: boolean;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { nom: true, prenom: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as FeedbackPayload;
    const rating = Number(body.rating);
    const message = String(body.message || "").trim();
    const publish = Boolean(body.publish);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    if (message.length > 400) {
      return NextResponse.json({ error: "Message must be 400 characters or less." }, { status: 400 });
    }

    const displayName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email.split("@")[0];

    const feedback = await prisma.feedback.create({
      data: {
        nom: displayName,
        message,
        note: rating,
        etat: publish ? "visible" : "invisible",
      },
      select: {
        id: true,
        nom: true,
        message: true,
        note: true,
        etat: true,
      },
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error) {
    console.error("[USER_FEEDBACK_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: { etat: "visible" },
      orderBy: { id: "desc" },
      take: 20,
      select: {
        id: true,
        nom: true,
        message: true,
        note: true,
      },
    });

    return NextResponse.json({ feedbacks }, { status: 200 });
  } catch (error) {
    console.error("[USER_FEEDBACK_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
