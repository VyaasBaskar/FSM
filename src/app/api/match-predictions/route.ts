import { NextRequest, NextResponse } from "next/server";
import { getMatchPredictions, getEventTeams } from "@/app/lib/event";
import { isEventRecent } from "@/app/lib/eventUtils";
import { getGlobalStats } from "@/app/lib/global";

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

    // Get teams and build FSM map
    const teams = await getEventTeams(fullEventCode, true);
    const FSMs: { [key: string]: number } = {};
    teams.forEach((team) => {
      FSMs[team.key] = Number(team.fsm);
    });

    // If not enough matches played, use global stats
    const playedMatches = teams.filter((t) => Number(t.fsm) > 0).length;
    if (playedMatches < 15) {
      const globalStats = await getGlobalStats();
      globalStats.forEach(({ teamKey, bestFSM }) => {
        FSMs[teamKey] = Number(bestFSM);
      });
    }

    const matchPredictions = await getMatchPredictions(fullEventCode, FSMs);

    const isRecent = await isEventRecent(fullEventCode);
    const cacheMaxAge = isRecent ? 120 : 3600;

    return NextResponse.json(matchPredictions, {
      headers: {
        "Cache-Control": `public, max-age=${cacheMaxAge}, s-maxage=${
          cacheMaxAge * 2
        }, stale-while-revalidate=${cacheMaxAge * 10}`,
      },
    });
  } catch (error) {
    console.error("Error fetching match predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch match predictions" },
      { status: 500 }
    );
  }
}
