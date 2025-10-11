"use server";

/* eslint-disable */
import { getEventTeams } from "./event";
import {
  getGlobalData,
  setGlobal,
  needToUpdateGlobal,
  fetchAllCachedEvents,
} from "./supabase";

export async function getEvents(year: number = 2025) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/events/${year}/simple`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: 86400 },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }

  const events = await res.json();
  const events_map: { key: string; value: string }[] = [];
  events.forEach((event: any) => {
    if (event.key && event.name) {
      events_map.push({ key: event.key, value: event.key + ": " + event.name });
    }
  });
  return events_map;
}

export async function getTeams(year: number = 2025) {
  const teams_map: { key: string; value: string }[] = [];
  for (let i = 0; i < 22; i++) {
    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/teams/${year}/${i}/simple`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch teams");
    }

    const teams = await res.json();

    teams.forEach((team: any) => {
      if (team.key && team.nickname) {
        team.key = team.key.replace("frc", "");
        teams_map.push({
          key: team.key,
          value: team.key + ": " + team.nickname,
        });
      }
    });
  }

  return teams_map;
}

async function getFilteredEventKeys(
  year: number = 2025,
  includeOffseason: boolean = true
): Promise<string[]> {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/events/${year}/simple`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch events for year ${year}`);
  }

  const allEvents = await res.json();

  const today = new Date();
  const allowedTypes = new Set([0, 1, 2, 3, 4]);
  if (includeOffseason) {
    allowedTypes.add(99);
  }

  const filtered = allEvents.filter((event: any) => {
    const eventStart = new Date(event.start_date);
    return eventStart < today && allowedTypes.has(event.event_type);
  });

  return filtered.map((event: any) => event.key);
}

async function getGeneralStats(
  year: number = 2025,
  includeOffseason: boolean = true
) {
  const events = await getFilteredEventKeys(year, includeOffseason);

  const stats: { [key: string]: number[] } = {};

  const cachedEvents = await fetchAllCachedEvents(year.toString());
  for (const event of cachedEvents) {
    const eventEndDate = new Date(event.event_end);
    const today = new Date();
    const diffTime = today.getTime() - eventEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 1.0) {
      const index = events.indexOf(event.code);
      if (index > -1) {
        events.splice(index, 1);
        for (const team of Object.keys(event.data)) {
          if (!stats[team]) {
            stats[team] = [];
          }
          stats[team].push(Number(event.data[team].fsm));
        }
      }
    }
  }

  console.log(events.length, "events left to process");

  let i = 0;

  for (const event of events) {
    i++;
    try {
      const event_stats = await getEventTeams(event);
      for (const team of event_stats) {
        const teamFSM = Number(team.fsm);
        if (!stats[team.key]) {
          stats[team.key] = [];
        }
        stats[team.key].push(teamFSM);
      }
    } catch (error) {
      console.error(`Error fetching stats for event ${event}:`, error);
    }
    if (i % 10 === 0) {
      console.log(`Processed ${i} of ${events.length} events...`);
    }
  }

  const statsFinal: { [key: string]: string } = {};
  for (const team of Object.keys(stats)) {
    const teamFSMs = stats[team].sort((a, b) => b - a);
    if (teamFSMs.length === 1) {
      statsFinal[team] = teamFSMs[0].toFixed(2);
    } else {
      statsFinal[team] = ((teamFSMs[0] + teamFSMs[1]) / 2).toFixed(2);
    }
  }

  return { stats: statsFinal, updated: true };
}

export async function getGlobalStats(
  year: number = 2025,
  includeOffseason: boolean = true
) {
  const all_stats: { [key: string]: string } = {};

  const pstats = await getGeneralStats(year, includeOffseason);

  const stats = pstats.stats;
  for (const team in stats) {
    if (stats.hasOwnProperty(team)) {
      all_stats[team] = stats[team];
    }
  }

  const sortedGlobalStats = Object.entries(all_stats)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([teamKey, bestFSM]) => ({
      teamKey,
      bestFSM,
    }));

  // console.log("Global stats fetched and sorted:", sortedGlobalStats);

  return sortedGlobalStats;
}
