import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTrendTrainingJob } from "@/lib/trendModelJobs";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const isAdminRole = (role: unknown) => String(role || "").toUpperCase() === "ADMIN";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    const { jobId } = await params;
    const job = getTrendTrainingJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Admin models jobs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
