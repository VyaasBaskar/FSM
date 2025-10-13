import { NextRequest, NextResponse } from "next/server";
import { getNexusMatchSchedule } from "@/app/lib/event";
import { isEventRecent } from "@/app/lib/eventUtils";

export const dynamic = "force-dynamic";

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

    const fullEventCode = event.startsWith("2025") ? event : `2025${event}`;

    const nexusSchedule = await getNexusMatchSchedule(fullEventCode);

    const isRecent = await isEventRecent(fullEventCode);
    const cacheMaxAge = isRecent ? 30 : 600;

    return NextResponse.json(nexusSchedule, {
      headers: {
        "Cache-Control": `public, max-age=${cacheMaxAge}, s-maxage=${
          cacheMaxAge * 2
        }, stale-while-revalidate=${cacheMaxAge * 5}`,
        Vary: "Accept, Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("Error fetching nexus schedule:", error);
    return NextResponse.json(
      {},
      {
        headers: {
          "Cache-Control": "public, max-age=120, s-maxage=240",
        },
      }
    );
  }
}
