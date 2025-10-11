"use server";

/* eslint-disable */
import { getEventTeams } from "./event";
import {
  getGlobalData,
  getGlobalDataWithLocation,
  setGlobal,
  setGlobalWithLocation,
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

  const batchSize = 5;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((event) => getEventTeams(event))
    );

    batchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        for (const team of result.value) {
          const teamFSM = Number(team.fsm);
          if (!stats[team.key]) {
            stats[team.key] = [];
          }
          stats[team.key].push(teamFSM);
        }
      } else {
        console.error(
          `Error fetching stats for event ${batch[idx]}:`,
          result.reason
        );
      }
    });

    if ((i + batchSize) % 50 === 0 || i + batchSize >= events.length) {
      console.log(
        `Processed ${Math.min(i + batchSize, events.length)} of ${
          events.length
        } events...`
      );
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

const stateAbbreviations: { [key: string]: string } = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

function normalizeStateProv(stateProv: string): string {
  if (!stateProv) return "";

  const trimmed = stateProv.trim();

  if (stateAbbreviations[trimmed]) {
    return stateAbbreviations[trimmed];
  }

  return trimmed;
}

async function getTeamLocation(teamKey: string) {
  try {
    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/team/${teamKey}`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) {
      return { country: "", state_prov: "" };
    }

    const teamInfo = await res.json();
    return {
      country: teamInfo.country || "",
      state_prov: normalizeStateProv(teamInfo.state_prov || ""),
    };
  } catch {
    return { country: "", state_prov: "" };
  }
}

function getGlobalRankingId(year: number, includeOffseason: boolean): number {
  return year * 10 + (includeOffseason ? 1 : 0);
}

export async function getGlobalStatsWithoutLocation(
  year: number = 2025,
  includeOffseason: boolean = true
): Promise<Array<{ teamKey: string; bestFSM: string }>> {
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

  return sortedGlobalStats;
}

export async function getGlobalStats(
  year: number = 2025,
  includeOffseason: boolean = true
) {
  const rankingId = getGlobalRankingId(year, includeOffseason);

  try {
    const cachedData = await getGlobalDataWithLocation(rankingId);
    if (cachedData && cachedData.length > 0) {
      console.log(
        `Using cached global rankings for ${year} (offseason: ${includeOffseason})`
      );
      return cachedData;
    }
  } catch (error) {
    console.error("Error fetching cached global data:", error);
  }

  console.log(
    `Fetching fresh global rankings for ${year} (offseason: ${includeOffseason})`
  );

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

  const batchSize = 100;
  const statsWithLocation: {
    teamKey: string;
    bestFSM: string;
    country: string;
    state_prov: string;
  }[] = [];

  for (let i = 0; i < sortedGlobalStats.length; i += batchSize) {
    const batch = sortedGlobalStats.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((stat) => getTeamLocation(stat.teamKey))
    );

    batch.forEach((stat, idx) => {
      const locationResult = batchResults[idx];
      const location =
        locationResult.status === "fulfilled"
          ? locationResult.value
          : { country: "", state_prov: "" };

      statsWithLocation.push({
        teamKey: stat.teamKey,
        bestFSM: stat.bestFSM,
        country: location.country,
        state_prov: location.state_prov,
      });
    });

    if (
      (i + batchSize) % 500 === 0 ||
      i + batchSize >= sortedGlobalStats.length
    ) {
      console.log(
        `Processed ${Math.min(i + batchSize, sortedGlobalStats.length)} of ${
          sortedGlobalStats.length
        } team locations...`
      );
    }
  }

  try {
    console.log(`Storing global rankings to Supabase (ID: ${rankingId})`);
    await setGlobalWithLocation(rankingId, statsWithLocation);
    console.log("Successfully stored global rankings to Supabase");
  } catch (error) {
    console.error("Error storing global rankings to Supabase:", error);
  }

  return statsWithLocation;
}
