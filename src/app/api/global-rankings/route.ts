import { NextRequest, NextResponse } from "next/server";
import {
  getGlobalDataWithLocation,
  setGlobalWithLocation,
} from "@/app/lib/supabase";

// GET: Fetch cached global rankings with locations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rankingId = searchParams.get("rankingId");

    if (!rankingId) {
      return NextResponse.json(
        { error: "rankingId is required" },
        { status: 400 }
      );
    }

    const data = await getGlobalDataWithLocation(parseInt(rankingId));
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching global rankings:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}

// POST: Store global rankings with locations
export async function POST(request: NextRequest) {
  try {
    const { rankingId, stats } = await request.json();

    if (!rankingId || !stats) {
      return NextResponse.json(
        { error: "rankingId and stats are required" },
        { status: 400 }
      );
    }

    await setGlobalWithLocation(rankingId, stats);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing global rankings:", error);
    return NextResponse.json(
      { error: "Failed to store rankings" },
      { status: 500 }
    );
  }
}
