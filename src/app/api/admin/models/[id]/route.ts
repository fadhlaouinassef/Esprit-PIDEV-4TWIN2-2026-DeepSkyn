import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteTrendModel, renameTrendModel } from "@/lib/trendModelRegistry";
import { resetPretrainedTrendArtifactCache } from "@/modele/trendModelLoader";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const isAdminRole = (role: unknown) => String(role || "").toUpperCase() === "ADMIN";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const ok = await renameTrendModel(id, name);
    if (!ok) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin models rename error:", error);
    return NextResponse.json({ error: "Failed to rename model" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    const { id } = await params;
    const result = await deleteTrendModel(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason || "Delete failed" }, { status: 404 });
    }

    resetPretrainedTrendArtifactCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin models delete error:", error);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
