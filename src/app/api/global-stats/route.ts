import { NextRequest, NextResponse } from "next/server";
import { getGlobalStats } from "@/app/lib/global";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "2025");

    const stats = await getGlobalStats(year);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch global stats" },
      { status: 500 }
    );
  }
}
