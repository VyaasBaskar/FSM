import { NextRequest, NextResponse } from "next/server";
import { isEventRecent } from "@/app/lib/eventUtils";

export const revalidate = 120;

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

    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/event/${fullEventCode}/rankings`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ rankings: [] });
    }

    const data = await res.json();

    const isRecent = await isEventRecent(fullEventCode);
    const cacheMaxAge = isRecent ? 120 : 3600;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, max-age=${cacheMaxAge}, s-maxage=${
          cacheMaxAge * 2
        }, stale-while-revalidate=${cacheMaxAge * 10}`,
      },
    });
  } catch (error) {
    console.error("Error fetching event rankings:", error);
    return NextResponse.json({ rankings: [] });
  }
}
