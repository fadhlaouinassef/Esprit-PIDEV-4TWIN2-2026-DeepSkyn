import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { resetPretrainedTrendArtifactCache } from "@/modele/trendModelLoader";
import { setActiveTrendModel } from "@/lib/trendModelRegistry";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const isAdminRole = (role: unknown) => String(role || "").toUpperCase() === "ADMIN";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    const body = await request.json();
    const id = String(body?.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Model id is required" }, { status: 400 });
    }

    const ok = await setActiveTrendModel(id);
    if (!ok) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    resetPretrainedTrendArtifactCache();

    return NextResponse.json({ success: true, activeModelId: id });
  } catch (error) {
    console.error("Admin models select error:", error);
    return NextResponse.json({ error: "Failed to select model" }, { status: 500 });
  }
}
