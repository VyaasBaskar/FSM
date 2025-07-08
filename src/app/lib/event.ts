/* eslint-disable */
import { addEventToDB, getEventDataIfOneDayAfterEnd } from "./supabase";

const MAX_ITERS = 100;
const DECAY_FAC = 0.992;
const FSM_UP_FAC = 0.4;
const FSM_DOWN_FAC = 0.3;
const ELIM_MULT_FAC = 0.65;

function modRoot(x: number) {
  if (x < 0) {
    return -Math.pow(-x, 1.0 / 3);
  }
  return Math.pow(x, 1.0 / 3);
}

function elimModRoot(x: number) {
  if (x < 0) {
    return -Math.pow(-x, 1.0 / 2);
  }
  return Math.pow(x, 1.0 / 2);
}

async function getEventQualMatches(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch matches for event: ${eventCode}`);
  }

  const matches = await res.json();

  return matches.filter(
    (match: { comp_level: string }) => match.comp_level === "qm"
  );
}

async function getEventElimMatches(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch elimination matches for event: ${eventCode}`
    );
  }

  const matches = await res.json();

  return matches.filter(
    (match: { comp_level: string }) => match.comp_level !== "qm"
  );
}

async function getEventRankings(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/rankings`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch rankings for event: ${eventCode}`);
  }

  return res.json();
}

function calculateFSM(matches: any[]) {
  const FSMs: { [key: string]: number } = {};

  for (let i = 0; i < MAX_ITERS; i++) {
    for (let j = 0; j < matches.length; j++) {
      const kz = matches.length - j;
      for (let z = 0; z < (kz < 25 ? 3 : kz < 45 ? 2 : 1); z++) {
        const match = matches[j];
        const redTeams = match.alliances.red.team_keys;
        const blueTeams = match.alliances.blue.team_keys;

        const redScore = match.alliances.red.score;
        const blueScore = match.alliances.blue.score;

        let redFSMpred = 0.0;
        let blueFSMpred = 0.0;
        for (const team of redTeams) {
          if (!FSMs[team]) {
            FSMs[team] = redScore / 3.0;
          }
          redFSMpred += FSMs[team];
        }
        for (const team of blueTeams) {
          if (!FSMs[team]) {
            FSMs[team] = blueScore / 3.0;
          }
          blueFSMpred += FSMs[team];
        }

        const redDelta = modRoot((redScore - redFSMpred) / 3.0);
        const blueDelta = modRoot((blueScore - blueFSMpred) / 3.0);

        for (const team of redTeams) {
          if (redDelta > 0) {
            FSMs[team] += redDelta * FSM_UP_FAC * DECAY_FAC ** i;
          } else {
            FSMs[team] += redDelta * FSM_DOWN_FAC * DECAY_FAC ** i;
          }
        }

        for (const team of blueTeams) {
          if (blueDelta > 0) {
            FSMs[team] += blueDelta * FSM_UP_FAC * DECAY_FAC ** i;
          } else {
            FSMs[team] += blueDelta * FSM_DOWN_FAC * DECAY_FAC ** i;
          }
        }
      }
    }
  }
  return FSMs;
}

function elimAdjustFSM(matches: any[], fsms: { [key: string]: number }) {
  for (const match of matches) {
    const redTeams = match.alliances.red.team_keys;
    const blueTeams = match.alliances.blue.team_keys;

    const redScore = match.alliances.red.score;
    const blueScore = match.alliances.blue.score;

    const redDelta = elimModRoot((redScore - blueScore) / 3.0);
    const blueDelta = elimModRoot((blueScore - redScore) / 3.0);

    for (const team of redTeams) {
      if (redDelta > 0) {
        fsms[team] += redDelta * ELIM_MULT_FAC;
      }
    }
    for (const team of blueTeams) {
      if (blueDelta > 0) {
        fsms[team] += blueDelta * ELIM_MULT_FAC;
      }
    }
  }
}

export type TeamDataType = {
  key: string;
  rank: number;
  fsm: string;
};

export async function getEventTeams(eventCode: string) {
  const TEAMDATA: { [key: string]: TeamDataType } = {};
  const orig_data = await getEventDataIfOneDayAfterEnd(eventCode);

  if (orig_data) {
    console.log("Using cached data for event:", eventCode);
    for (const teamKey in orig_data) {
      const team = orig_data[teamKey];
      TEAMDATA[teamKey] = {
        key: team.key,
        rank: team.rank,
        fsm: team.fsm,
      };
    }
    const sortedData = Object.values(TEAMDATA).sort((a, b) => {
      return a.rank - b.rank || b.fsm.localeCompare(a.fsm);
    });
    return sortedData;
  }
  console.log("Calculating FSM for event:", eventCode);

  const matches = await getEventQualMatches(eventCode);
  if (matches.length === 0) {
    throw new Error(`No qualification matches found for event: ${eventCode}`);
  }
  const elimMatches = await getEventElimMatches(eventCode);
  const rankings = (await getEventRankings(eventCode)).rankings;
  const fsms = calculateFSM(matches);
  elimAdjustFSM(elimMatches, fsms);

  for (let i = 0; i < rankings.length; i++) {
    const teamset = rankings[i];
    const team = teamset.team_key;
    if (!fsms[team]) {
      fsms[team] = 0.0;
    }
    TEAMDATA[team] = {
      key: team,
      rank: teamset.rank,
      fsm: fsms[team].toFixed(2),
    };
  }

  const sortedData = Object.values(TEAMDATA).sort((a, b) => {
    return a.rank - b.rank || b.fsm.localeCompare(a.fsm);
  });
  await addEventToDB(eventCode, TEAMDATA);
  return sortedData;
}
