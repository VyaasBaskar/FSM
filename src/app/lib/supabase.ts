/* eslint-disable */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

async function eventExists(eventCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("EventFSMv1")
    .select("code")
    .eq("code", eventCode)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return !!data;
}

export async function setScoutingData(
  key: string,
  data: string
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("Scouting25")
    .select("team_match")
    .eq("team_match", key)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  let error;
  if (existing) {
    ({ error } = await supabase
      .from("Scouting25")
      .update({ data: data })
      .eq("team_match", key));
  } else {
    ({ error } = await supabase
      .from("Scouting25")
      .insert({ team_match: key, data: data }));
  }

  if (error) {
    throw error;
  }
}

export async function getScoutingData(eventCode: string) {
  const { data, error } = await supabase
    .from("Scouting25")
    .select("team_match, data")
    .like("team_match", `${eventCode}-%`);

  if (error) {
    throw error;
  }

  return data;
}

const eventDataCache = new Map<string, { data: any; timestamp: number }>();

export async function getEventDataIfOneDayAfterEnd(eventCode: string) {
  const cached = eventDataCache.get(eventCode);
  if (cached && Date.now() - cached.timestamp < 60 * 60 * 1000) {
    return cached.data;
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from("EventFSMv1")
    .select("data, event_end")
    .eq("code", eventCode)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      eventDataCache.set(eventCode, { data: null, timestamp: Date.now() });
      return null;
    }
    throw fetchError;
  }

  if (!existingEvent) {
    eventDataCache.set(eventCode, { data: null, timestamp: Date.now() });
    return null;
  }

  const storedEventEnd = new Date(existingEvent.event_end);
  const today = new Date();

  const diffTime = today.getTime() - storedEventEnd.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays >= 1.0) {
    eventDataCache.set(eventCode, {
      data: existingEvent.data,
      timestamp: Date.now(),
    });
    return existingEvent.data;
  }

  eventDataCache.set(eventCode, { data: null, timestamp: Date.now() });
  return null;
}

export async function fetchAllCachedEvents(year: string) {
  const { data: matchingEvents, error: fetchError } = await supabase
    .from("EventFSMv1")
    .select("code, data, event_end")
    .like("code", `${year}%`);

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return [];
    }
    throw fetchError;
  }

  if (!matchingEvents) {
    return [];
  }

  return matchingEvents;
}

export async function fetchAll25Teams() {
  const { count, error: countError } = await supabase
    .from("Teams2025")
    .select("*", { count: "exact", head: true });

  if (!count || count === 0) {
    return [];
  }

  let allTeams: any[] = [];
  const chunkSize = 1000;
  for (let start = 0; start < count; start += chunkSize) {
    const { data: teamsChunk, error: fetchError } = await supabase
      .from("Teams2025")
      .select("key, value")
      .range(start, Math.min(start + chunkSize - 1, count - 1));

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return [];
      }
      throw fetchError;
    }

    if (teamsChunk && teamsChunk.length > 0) {
      allTeams = allTeams.concat(teamsChunk);
    }
  }

  if (allTeams.length === 0) {
    return [];
  }

  return allTeams;
}

export async function setAll25Teams(teams: { key: string; value: string }[]) {
  const { error } = await supabase.from("Teams2025").upsert(teams);

  if (error) {
    throw error;
  }
}

type TeamDataType = {
  key: string;
  rank: number;
  fsm: string;
};

async function getEventEndDate(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: 86400 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch end date for event: ${eventCode}`);
  }

  const eventData = await res.json();
  return eventData.end_date;
}

export async function addEventToDB(
  eventCode: string,
  team_data: { [key: string]: TeamDataType }
) {
  const event_end = await getEventEndDate(eventCode);
  if (await eventExists(eventCode)) {
    const { error: updateError } = await supabase
      .from("EventFSMv1")
      .update({
        data: team_data,
        event_end: event_end,
      })
      .eq("code", eventCode);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase.from("EventFSMv1").insert([
      {
        code: eventCode,
        data: team_data,
        event_end: event_end,
      },
    ]);

    if (insertError) {
      throw insertError;
    }
  }
}

export async function getGlobalData(id: number) {
  const { data: data, error: fetchError } = await supabase
    .from("GlobalRanking")
    .select("rankings")
    .eq("id", id)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  return data.rankings;
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
  return stateAbbreviations[trimmed] || trimmed;
}

export async function getGlobalDataWithLocation(id: number): Promise<
  Array<{
    teamKey: string;
    bestFSM: string;
    country: string;
    state_prov: string;
  }>
> {
  const rankings = await getGlobalData(id);

  const stats: Array<{
    teamKey: string;
    bestFSM: string;
    country: string;
    state_prov: string;
  }> = [];

  for (const teamKey in rankings) {
    const value = rankings[teamKey];
    if (typeof value === "number") {
      stats.push({
        teamKey,
        bestFSM: value.toFixed(2),
        country: "",
        state_prov: "",
      });
    } else if (typeof value === "object" && value !== null) {
      stats.push({
        teamKey,
        bestFSM: value.fsm.toFixed(2),
        country: value.country || "",
        state_prov: normalizeStateProv(value.state_prov || ""),
      });
    }
  }

  stats.sort((a, b) => Number(b.bestFSM) - Number(a.bestFSM));

  return stats;
}

export async function needToUpdateGlobal(
  id: number,
  priority: boolean = false
): Promise<boolean> {
  const { data: existingGlobal, error: fetchError } = await supabase
    .from("GlobalRanking")
    .select("set_time, rankings")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return true;
    }
    throw fetchError;
  }

  if (!existingGlobal || !existingGlobal.set_time) {
    return true;
  }

  if (Object.keys(existingGlobal.rankings).length === 0) {
    return true;
  }

  if (!priority) return false;

  const today = new Date();
  const diffTime = today.getTime() - Number(existingGlobal.set_time);
  const diffHours = diffTime / (1000 * 60 * 60);

  return diffHours >= 6;
}

export async function setGlobal(
  page: number,
  rankings: {
    [key: string]:
      | number
      | { fsm: number; country?: string; state_prov?: string };
  }
) {
  const { error } = await supabase.from("GlobalRanking").upsert({
    id: page,
    rankings: rankings,
    set_time: new Date().getTime(),
  });

  if (error) {
    throw error;
  }
}

export async function setGlobalWithLocation(
  page: number,
  stats: Array<{
    teamKey: string;
    bestFSM: string;
    country: string;
    state_prov: string;
  }>
) {
  const rankings: {
    [key: string]: { fsm: number; country?: string; state_prov?: string };
  } = {};

  stats.forEach((stat) => {
    rankings[stat.teamKey] = {
      fsm: Number(stat.bestFSM),
      country: stat.country || undefined,
      state_prov: stat.state_prov || undefined,
    };
  });

  await setGlobal(page, rankings);
}

export async function updateSingleTeamGlobalFSM(
  rankingId: number,
  teamKey: string,
  fsm: number
) {
  try {
    const { data: existingData } = await supabase
      .from("GlobalRanking")
      .select("rankings")
      .eq("id", rankingId)
      .single();

    if (!existingData || !existingData.rankings) {
      return;
    }

    const rankings = { ...existingData.rankings };

    if (typeof rankings[teamKey] === "object" && rankings[teamKey] !== null) {
      rankings[teamKey] = { ...rankings[teamKey], fsm };
    } else {
      rankings[teamKey] = fsm;
    }

    await supabase
      .from("GlobalRanking")
      .update({
        rankings: rankings,
        set_time: new Date().getTime(),
      })
      .eq("id", rankingId);
  } catch (error) {
    console.error(`Error updating team ${teamKey} FSM:`, error);
  }
}
