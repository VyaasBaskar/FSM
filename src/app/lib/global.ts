"use server";

/* eslint-disable */
import { getEventTeams } from "./event";
import { getEventTeams as getEventTeams26 } from "./event26";
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
      next: { revalidate: 0 },
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

interface TeamEventEntry {
  fsm: number;
  auto: number;
  fuel: number;
  climb: number;
  coral: number;
  algae: number;
}

async function getGeneralStats(
  year: number = 2025,
  includeOffseason: boolean = true
) {
  const events = await getFilteredEventKeys(year, includeOffseason);

  const stats: { [key: string]: TeamEventEntry[] } = {};

  const cachedEvents = await fetchAllCachedEvents(year.toString());
  for (const event of cachedEvents) {
    const eventEndDate = new Date(event.event_end);
    const today = new Date();
    const diffTime = today.getTime() - eventEndDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 1.0) {
      const index = events.indexOf(event.code);
      if (index > -1) {
        const sampleTeam = Object.values(event.data)[0] as any;
        if (year >= 2026 && sampleTeam && !sampleTeam.fuel) {
          console.log(`Skipping stale cached data for ${event.code} (missing fuel field, needs recompute)`);
          continue;
        }
        events.splice(index, 1);
        for (const team of Object.keys(event.data)) {
          if (!stats[team]) {
            stats[team] = [];
          }
          const d = event.data[team];
          stats[team].push({
            fsm: Number(d.fsm ?? 0),
            auto: Number(d.auto ?? 0),
            fuel: Number(d.fuel ?? 0),
            climb: Number(d.climb ?? 0),
            coral: Number(d.coral ?? 0),
            algae: Number(d.algae ?? 0),
          });
        }
      }
    }
  }

  console.log(events.length, "events left to process");

  const fetchTeams = year >= 2026 ? getEventTeams26 : getEventTeams;

  const batchSize = 5;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((event) => fetchTeams(event))
    );

    batchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        for (const team of result.value) {
          if (!stats[team.key]) {
            stats[team.key] = [];
          }
          stats[team.key].push({
            fsm: Number(team.fsm ?? 0),
            auto: Number(team.auto ?? 0),
            fuel: Number((team as any).fuel ?? 0),
            climb: Number(team.climb ?? 0),
            coral: Number(team.coral ?? 0),
            algae: Number(team.algae ?? 0),
          });
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
  const componentsFinal: { [key: string]: { auto: string; fuel: string; climb: string; coral: string; algae: string } } = {};

  for (const team of Object.keys(stats)) {
    const entries = stats[team].sort((a, b) => b.fsm - a.fsm);
    const best = entries[0];
    if (entries.length === 1) {
      statsFinal[team] = best.fsm.toFixed(2);
    } else {
      const rms = Math.sqrt((entries[0].fsm ** 2 + entries[1].fsm ** 2) / 2);
      statsFinal[team] = rms.toFixed(2);
    }
    componentsFinal[team] = {
      auto: best.auto.toFixed(2),
      fuel: best.fuel.toFixed(2),
      climb: best.climb.toFixed(2),
      coral: best.coral.toFixed(2),
      algae: best.algae.toFixed(2),
    };
  }

  return { stats: statsFinal, components: componentsFinal, updated: true };
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
): Promise<Array<{ teamKey: string; bestFSM: string; auto: string; fuel: string; climb: string; coral: string; algae: string }>> {
  const all_stats: { [key: string]: string } = {};
  const all_components: { [key: string]: { auto: string; fuel: string; climb: string; coral: string; algae: string } } = {};

  const pstats = await getGeneralStats(year, includeOffseason);

  const stats = pstats.stats;
  const components = pstats.components;
  for (const team in stats) {
    if (stats.hasOwnProperty(team)) {
      all_stats[team] = stats[team];
      all_components[team] = components[team] ?? { auto: "0", fuel: "0", climb: "0", coral: "0", algae: "0" };
    }
  }

  const sortedGlobalStats = Object.entries(all_stats)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([teamKey, bestFSM]) => ({
      teamKey,
      bestFSM,
      auto: all_components[teamKey]?.auto ?? "0",
      fuel: all_components[teamKey]?.fuel ?? "0",
      climb: all_components[teamKey]?.climb ?? "0",
      coral: all_components[teamKey]?.coral ?? "0",
      algae: all_components[teamKey]?.algae ?? "0",
    }));

  // Persist FSM rankings to Supabase so other features (compare, team page) can access them
  const rankingId = getGlobalRankingId(year, includeOffseason);
  try {
    const existing = await getGlobalDataWithLocation(rankingId);
    const locationMap = new Map(
      (existing ?? []).map((s) => [s.teamKey, { country: s.country, state_prov: s.state_prov }])
    );
    const statsForStorage = sortedGlobalStats.map((s) => ({
      teamKey: s.teamKey,
      bestFSM: s.bestFSM,
      country: locationMap.get(s.teamKey)?.country ?? "",
      state_prov: locationMap.get(s.teamKey)?.state_prov ?? "",
    }));
    await setGlobalWithLocation(rankingId, statsForStorage);
    console.log(`Stored ${statsForStorage.length} teams to global DB for ${year}`);
  } catch (error) {
    console.error("Error storing global rankings:", error);
  }

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
