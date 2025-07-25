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

export async function getEventDataIfOneDayAfterEnd(eventCode: string) {
  const { data: existingEvent, error: fetchError } = await supabase
    .from("EventFSMv1")
    .select("data, event_end")
    .eq("code", eventCode)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return null;
    }
    throw fetchError;
  }

  if (!existingEvent) {
    return null;
  }

  const storedEventEnd = new Date(existingEvent.event_end);
  const today = new Date();

  const diffTime = today.getTime() - storedEventEnd.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays >= 1.0) {
    return existingEvent.data;
  }

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
      cache: "no-store",
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

  return false; //diffHours > 4.0;
}

export async function setGlobal(
  page: number,
  rankings: { [key: string]: number }
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
