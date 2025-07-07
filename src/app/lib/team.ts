/* eslint-disable */
import { getEventTeams, TeamDataType } from "../lib/event";

async function getTeamEvents(teamKey: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/team/${teamKey}/events/2025`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      cache: "no-store",
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

export async function getTeamStats(teamKey: string) {
  const events = await getTeamEvents(teamKey);
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
      // pass on error
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
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch info for team: ${teamKey}`);
  }

  const teamInfo = await res.json();
  return teamInfo;
}
