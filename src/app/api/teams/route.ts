import { NextRequest, NextResponse } from "next/server";
import { getTeams } from "@/app/lib/global";
import { fetchAll25Teams } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || "2025");

    let teams;
    if (year === 2025) {
      teams = await fetchAll25Teams();
      if (teams.length === 0) {
        teams = await getTeams(year);
      }
    } else {
      teams = await getTeams(year);
    }

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
