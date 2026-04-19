import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listTrendTrainingJobs, startTrendTrainingJob } from "@/lib/trendModelJobs";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const isAdminRole = (role: unknown) => String(role || "").toUpperCase() === "ADMIN";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    return NextResponse.json({ jobs: listTrendTrainingJobs() });
  } catch (error) {
    console.error("Admin models train GET error:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    const body = await request.json().catch(() => ({}));
    const modelName = typeof body?.modelName === "string" ? body.modelName : undefined;
    const mode = body?.mode === "retrain" ? "retrain" : "new";
    const targetModelId = typeof body?.targetModelId === "string" ? body.targetModelId : undefined;

    if (mode === "retrain" && !targetModelId) {
      return NextResponse.json({ error: "targetModelId is required for retrain mode" }, { status: 400 });
    }

    const job = startTrendTrainingJob({
      modelName,
      mode,
      targetModelId,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("Admin models train POST error:", error);
    return NextResponse.json({ error: "Failed to start training" }, { status: 500 });
  }
}
