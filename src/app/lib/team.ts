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

  const eventResults = await Promise.allSettled(
    events.map((event: { key: string }) => getEventTeams(event.key))
  );

  const teamData: EventDataType[] = [];
  eventResults.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      const teams = result.value;
      const team = teams.find((t: TeamDataType) => t.key === teamKey);
      if (team) {
        teamData.push({
          event: events[idx].key,
          teamfsm: team.fsm,
          teamrank: team.rank,
        });
      }
    }
  });

  const fsms = teamData.map((event) => parseFloat(event.teamfsm));
  fsms.sort((a, b) => b - a);

  let bestFSM = 0.0;
  if (fsms.length === 1) {
    bestFSM = fsms[0];
  } else {
    const rms = Math.sqrt((fsms[0] ** 2 + fsms[1] ** 2) / 2);
    bestFSM = rms;
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

export type TeamMediaType = {
  type: string;
  foreign_key?: string;
  direct_url?: string;
  view_url?: string;
  details?: any;
  preferred?: boolean;
};

export type ProcessedMediaType = {
  url: string;
  type: string;
  mediaType: "image" | "video";
  preferred: boolean;
  foreignKey?: string;
};

export async function getTeamMedia(teamKey: string, year: number) {
  const revalidateTime = await getTeamRevalidationTime(teamKey, year);

  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/team/${teamKey}/media/${year}`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: revalidateTime },
    }
  );

  if (!res.ok) {
    return [];
  }

  const media: TeamMediaType[] = await res.json();

  // Process all media items
  const processedMedia = media.map((m) => {
    let url = "";
    let mediaType: "image" | "video" = "image";

    // Handle videos first
    if (m.type === "youtube" && m.foreign_key) {
      url = `https://www.youtube-nocookie.com/embed/${m.foreign_key}`;
      mediaType = "video";
    } else if (m.type === "grabcad" && m.foreign_key) {
      // GrabCAD 3D models - treat as video for interactive content
      url = `https://grabcad.com/library/${m.foreign_key}`;
      mediaType = "video";
    }
    // Handle images
    else if (m.direct_url) {
      url = m.direct_url;
      mediaType = "image";
    } else if (m.type === "imgur" && m.foreign_key) {
      // Use imgur without extension - lets imgur serve the correct format automatically
      // This is more reliable than guessing .jpg, .png, .gif
      url = `https://i.imgur.com/${m.foreign_key}`;
      mediaType = "image";
    } else if (m.type === "cdphotothread" && m.details?.image_partial) {
      url = `https://www.chiefdelphi.com/media/img/${m.details.image_partial}`;
      mediaType = "image";
    } else if (m.type === "instagram-image" && m.foreign_key) {
      // Instagram images can be treated as images
      url = `https://www.instagram.com/p/${m.foreign_key}/`;
      mediaType = "image";
    }

    // Log unhandled types for debugging
    if (!url && typeof console !== "undefined") {
      console.log(`Unhandled media type: ${m.type}`, m);
    }

    return {
      url,
      type: m.type,
      mediaType,
      preferred: m.preferred || false,
      foreignKey: m.foreign_key,
    };
  });

  // Filter out items without valid URLs
  return processedMedia.filter((m) => m.url);
}
