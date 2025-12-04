import { NextRequest, NextResponse } from "next/server";
import {
  getEventTeams,
  getEventQualMatches,
  getEventAlliances,
} from "../../lib/event";
import { calculateEventUnluckiness } from "../../lib/unlucky";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface UnluckyData {
  teamKey: string;
  unluckyPoints: number;
  eventCount: number;
}

interface TbaSimpleEvent {
  key: string;
  start_date?: string;
  event_type?: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchStart = parseInt(searchParams.get("batchStart") || "0");
    const batchSize = parseInt(searchParams.get("batchSize") || "100");
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    const yearNum = parseInt(year);
    const years = [2022, 2023, 2024, 2025];

    if (!years.includes(yearNum)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/events/${yearNum}/simple`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch events for year ${yearNum}` },
        { status: 500 }
      );
    }

    const allEvents = await res.json();
    const today = new Date();

    const events = (allEvents as TbaSimpleEvent[]).filter((event) => {
      if (!event.start_date || event.event_type === undefined) return false;
      const eventStart = new Date(event.start_date);
      return eventStart < today && [0, 1, 2, 3, 4].includes(event.event_type);
    });

    const batch = events.slice(batchStart, batchStart + batchSize);
    const teamUnluckyPoints: {
      [teamKey: string]: { points: number; events: number };
    } = {};

    await Promise.all(
      batch.map(async (event: TbaSimpleEvent) => {
        try {
          const eventCode = event.key;

          const [teams, matches, alliances] = await Promise.all([
            getEventTeams(eventCode, false).catch(() => []),
            getEventQualMatches(eventCode, true).catch(() => []),
            getEventAlliances(eventCode).catch(() => null),
          ]);

          if (teams.length === 0) {
            return;
          }

          const eventMetrics = await calculateEventUnluckiness(
            teams,
            matches,
            alliances
          );

          for (const teamKey in eventMetrics.unlucky) {
            const unluckyPoints = Math.max(
              -2.0,
              Math.min(eventMetrics.unlucky[teamKey], 3.0)
            );
            if (!teamUnluckyPoints[teamKey]) {
              teamUnluckyPoints[teamKey] = { points: 0, events: 0 };
            }
            teamUnluckyPoints[teamKey].points += unluckyPoints;
            teamUnluckyPoints[teamKey].events += 1;
          }
        } catch (error) {
          console.error(`Error processing event ${event.key}:`, error);
        }
      })
    );

    const result: UnluckyData[] = Object.entries(teamUnluckyPoints)
      .map(([teamKey, data]) => ({
        teamKey,
        unluckyPoints: data.points,
        eventCount: data.events,
      }))
      .sort((a, b) => b.unluckyPoints - a.unluckyPoints);

    return NextResponse.json({
      data: result,
      processed: batch.length,
      total: events.length,
      batchStart,
      hasMore: batchStart + batch.length < events.length,
    });
  } catch (error) {
    console.error("Error calculating unluckiness:", error);
    return NextResponse.json(
      { error: "Failed to calculate unluckiness" },
      { status: 500 }
    );
  }
}
