/* eslint-disable */
import { getEventTeams, TeamDataType } from "../lib/event";
import { getTeamRevalidationTime } from "../lib/eventUtils";

async function getTeamEvents(teamKey: string, year: number = 2025) {
  const revalidateTime = await getTeamRevalidationTime(teamKey, year);

  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/team/${teamKey}/events/${year}`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: revalidateTime },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch events for team: ${teamKey}`);
  }

  const events = await res.json();

  events.sort(
    (a: { start_date: string }, b: { start_date: string }) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return events;
}

export type EventDataType = {
  event: string;
  teamfsm: string;
  teamrank: number;
};

export async function getTeamStats(teamKey: string, year: number = 2025) {
  const events = await getTeamEvents(teamKey, year);
  if (events.length === 0) {
    throw new Error(`No events found for team: ${teamKey}`);
  }

  const teamData: EventDataType[] = [];
  for (const event of events) {
    try {
      const teams = await getEventTeams(event.key);
      const team = teams.find((t: TeamDataType) => t.key === teamKey);
      if (team) {
        teamData.push({
          event: event.key,
          teamfsm: team.fsm,
          teamrank: team.rank,
        });
      }
    } catch (exc: unknown) {
      // pass
    } finally {
      // pass
    }
  }

  let bestFSM = 0.0;
  for (const event of teamData) {
    const fsmValue = parseFloat(event.teamfsm);
    if (fsmValue > bestFSM) {
      bestFSM = fsmValue;
    }
  }

  return { teamData, bestFSM };
}

export async function getTeamInfo(teamKey: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/team/${teamKey}`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: 86400 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch info for team: ${teamKey}`);
  }

  const teamInfo = await res.json();
  return teamInfo;
}
