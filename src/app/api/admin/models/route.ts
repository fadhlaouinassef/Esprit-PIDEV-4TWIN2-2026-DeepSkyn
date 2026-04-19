import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getCurrentLegacyDatasetInfo,
  listTrendModels,
  materializeLegacyModelIntoRegistry,
} from "@/lib/trendModelRegistry";

export const runtime = "nodejs";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const isAdminRole = (role: unknown) => String(role || "").toUpperCase() === "ADMIN";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !isAdminRole(session.user.role)) {
      return unauthorized();
    }

    await materializeLegacyModelIntoRegistry();

    const [registryData, legacyDataset] = await Promise.all([
      listTrendModels(),
      getCurrentLegacyDatasetInfo(),
    ]);

    return NextResponse.json({
      ...registryData,
      currentDatasetSize: legacyDataset?.trainSeries ?? null,
      legacyDataset,
    });
  } catch (error) {
    console.error("Admin models GET error:", error);
    return NextResponse.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
