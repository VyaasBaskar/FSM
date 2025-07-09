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
