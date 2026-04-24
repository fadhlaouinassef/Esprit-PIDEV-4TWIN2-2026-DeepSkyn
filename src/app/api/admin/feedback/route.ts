import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { id: "desc" },
      take: 200,
      select: {
        id: true,
        nom: true,
        message: true,
        note: true,
        etat: true,
      },
    });

    return NextResponse.json({ feedbacks }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN_FEEDBACK_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
