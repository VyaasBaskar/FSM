import { NextRequest, NextResponse } from "next/server";
import { getEventTeams } from "@/app/lib/event";
import { isEventRecent } from "@/app/lib/eventUtils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const event = searchParams.get("event");

    if (!event) {
      return NextResponse.json(
        { error: "Event code is required" },
        { status: 400 }
      );
    }

    const teams = await getEventTeams(event);

    const isRecent = await isEventRecent(event);
    const cacheMaxAge = isRecent ? 120 : 3600;

    return NextResponse.json(teams, {
      headers: {
        "Cache-Control": `public, max-age=${cacheMaxAge}, s-maxage=${
          cacheMaxAge * 2
        }, stale-while-revalidate=${cacheMaxAge * 10}`,
      },
    });
  } catch (error) {
    console.error("Error fetching event teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch event teams" },
      { status: 500 }
    );
  }
}
