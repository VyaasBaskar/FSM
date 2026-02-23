import { addEventToDB, getEventDataIfOneDayAfterEnd } from "./supabase";
import { getEventRevalidationTime } from "./eventUtils";

const MAX_ITERS = 50;
const DECAY_FAC = 1.005;
const FSM_UP_FAC = 0.4;
const FSM_DOWN_FAC = 0.4;
const ELIM_MULT_FAC = 0.5;
const ELIM_REDUC_FAC = 0.25;

const attributeMult = 0.2;
const attributeReduc = 0.03;

function modRoot(x: number) {
  if (x < 0) return -Math.pow(-x, 1.0 / 2);
  return Math.pow(x, 1.0 / 2);
}

function elimModRoot(x: number) {
  if (x < 0) return -Math.pow(-x, 1.0 / 3);
  return Math.pow(x, 1.0 / 3);
}

type Match = any;

export type TeamDataType26 = {
  key: string;
  rank: number;
  fsm: string;
  fuel: string;
  climb: string;
  foul: string;
  algae: string;
  coral: string;
  auto: string;
};

export async function getAttendingTeams(eventCode: string) {
  const revalidateTime = await getEventRevalidationTime(eventCode);
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/teams`,
    {
      headers: { "X-TBA-Auth-Key": process.env.TBA_API_KEY! },
      next: { revalidate: revalidateTime },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch attending teams for event: ${eventCode}`);
  }
  return res.json();
}

export async function getEventQualMatches(
  eventCode: string,
  anyFine: boolean = false
) {
  const revalidateTime = await getEventRevalidationTime(eventCode);
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches`,
    {
      headers: { "X-TBA-Auth-Key": process.env.TBA_API_KEY! },
      next: { revalidate: revalidateTime },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch matches for event: ${eventCode}`);
  }
  const matches = await res.json();
  return matches.filter(
    (match: { comp_level: string }) => match.comp_level === "qm" || anyFine
  );
}

export async function getNumberPlayedMatches(eventCode: string) {
  const matches = await getEventQualMatches(eventCode, true);
  let count = 0;
  for (const match of matches) {
    if (match.score_breakdown) count++;
  }
  return count;
}

async function getEventElimMatches(eventCode: string) {
  const matches = await getEventQualMatches(eventCode, true);
  return matches.filter((match: { comp_level: string }) => match.comp_level !== "qm");
}

async function getEventRankings(eventCode: string) {
  const revalidateTime = await getEventRevalidationTime(eventCode);
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/rankings`,
    {
      headers: { "X-TBA-Auth-Key": process.env.TBA_API_KEY! },
      next: { revalidate: revalidateTime },
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch rankings for event: ${eventCode}`);
  }
  return res.json();
}

function getScore(match: Match, alliance: "red" | "blue", attribute: string): number {
  const sb = match.score_breakdown?.[alliance];
  if (!sb) return 0;

  if (attribute === "score") return Number(match.alliances?.[alliance]?.score) || 0;

  if (attribute === "fuel") {
    return (
      Number(sb.hubScore?.totalCount) ||
      Number(sb.hubScore?.teleopCount) ||
      Number(sb.hubScore?.totalPoints) ||
      Number(sb.hubScore?.teleopPoints) ||
      0
    );
  }

  if (attribute === "climb") {
    return (
      Number(sb.totalTowerPoints) ||
      Number(sb.endGameTowerPoints) ||
      Number(sb.autoTowerPoints) ||
      0
    );
  }

  if (attribute === "foul") {
    return Number(sb.foulPoints) || 0;
  }

  if (attribute === "auto") {
    return (
      Number(sb.totalAutoPoints) ||
      Number(sb.hubScore?.autoPoints) ||
      Number(sb.hubScore?.autoCount) ||
      0
    );
  }

  return 0;
}

function parseTowerLevelPoints(level: string | null | undefined): number {
  const normalized = String(level ?? "").trim().toLowerCase();
  if (!normalized || normalized === "none") return 0;
  if (normalized.includes("travers")) return 15;
  if (normalized.includes("high")) return 10;
  if (normalized.includes("mid")) return 6;
  if (normalized.includes("low")) return 4;
  if (normalized.includes("park")) return 2;
  if (normalized.includes("climb")) return 8;
  return 0;
}

function getRobotTowerPoints(match: Match, alliance: "red" | "blue"): [number, number, number] {
  const sb = match.score_breakdown?.[alliance];
  if (!sb) return [0, 0, 0];

  const autoRaw = [1, 2, 3].map((idx) =>
    parseTowerLevelPoints(sb[`autoTowerRobot${idx}`])
  );
  const endRaw = [1, 2, 3].map((idx) =>
    parseTowerLevelPoints(sb[`endGameTowerRobot${idx}`])
  );

  const robotRaw = autoRaw.map((v, i) => v + endRaw[i]);
  const rawTotal = robotRaw.reduce((sum, v) => sum + v, 0);
  const apiTotal =
    Number(sb.totalTowerPoints) ||
    Number(sb.autoTowerPoints) + Number(sb.endGameTowerPoints) ||
    Number(sb.endGameTowerPoints) ||
    Number(sb.autoTowerPoints) ||
    0;

  if (apiTotal <= 0) return [0, 0, 0];
  if (rawTotal > 0) {
    const scale = apiTotal / rawTotal;
    return [
      robotRaw[0] * scale,
      robotRaw[1] * scale,
      robotRaw[2] * scale,
    ];
  }

  return [apiTotal / 3, apiTotal / 3, apiTotal / 3];
}

function blendFSM26(
  originalFSM: number,
  fuel: number,
  climb: number,
  penalty: number
) {
  return 0.8 * (fuel + climb - penalty) + 0.2 * originalFSM;
}

function updateDict(
  dict: { [key: string]: number },
  teams: string[],
  value: number,
  iters: number,
  isAttribute: boolean = false
) {
  let dictpred = 0.0;
  for (const team of teams) {
    if (!dict[team]) dict[team] = value / teams.length;
    dictpred += dict[team];
  }

  const delta = modRoot((value - dictpred) / teams.length);
  for (const team of teams) {
    if (delta > 0) {
      dict[team] +=
        delta *
        (isAttribute ? attributeMult : 1) *
        FSM_UP_FAC *
        DECAY_FAC ** iters;
    } else {
      dict[team] +=
        delta *
        (isAttribute ? attributeReduc : 1) *
        FSM_DOWN_FAC *
        DECAY_FAC ** iters;
    }
  }
}

function calculateFSM26(matches: Match[]) {
  const FSMs: { [key: string]: number } = {};
  const fuelDict: { [key: string]: number } = {};
  const climbDict: { [key: string]: number } = {};
  const foulDict: { [key: string]: number } = {};
  const autoDict: { [key: string]: number } = {};

  for (let i = 0; i < MAX_ITERS; i++) {
    for (let j = 0; j < matches.length; j++) {
      const kz = matches.length - j;
      for (let z = 0; z < (kz < 25 ? 3 : kz < 45 ? 2 : 1); z++) {
        const match = matches[j];
        if (!match.score_breakdown) break;

        const redTeams = match.alliances.red.team_keys;
        const blueTeams = match.alliances.blue.team_keys;

        const redScore = getScore(match, "red", "score");
        const blueScore = getScore(match, "blue", "score");
        const redFuel = getScore(match, "red", "fuel");
        const blueFuel = getScore(match, "blue", "fuel");
        const redFoul = getScore(match, "red", "foul");
        const blueFoul = getScore(match, "blue", "foul");
        const redAuto = getScore(match, "red", "auto");
        const blueAuto = getScore(match, "blue", "auto");
        const redRobotClimb = getRobotTowerPoints(match, "red");
        const blueRobotClimb = getRobotTowerPoints(match, "blue");

        updateDict(FSMs, redTeams, redScore, i);
        updateDict(FSMs, blueTeams, blueScore, i);
        updateDict(fuelDict, redTeams, redFuel, i, true);
        updateDict(fuelDict, blueTeams, blueFuel, i, true);
        updateDict(foulDict, redTeams, redFoul, i, true);
        updateDict(foulDict, blueTeams, blueFoul, i, true);
        updateDict(autoDict, redTeams, redAuto, i, true);
        updateDict(autoDict, blueTeams, blueAuto, i, true);

        for (let idx = 0; idx < 3; idx++) {
          const redTeam = redTeams[idx];
          const blueTeam = blueTeams[idx];
          if (redTeam) {
            if (climbDict[redTeam] === undefined || Number.isNaN(climbDict[redTeam])) {
              climbDict[redTeam] = 0;
            }
            const delta = redRobotClimb[idx] - climbDict[redTeam];
            climbDict[redTeam] +=
              delta *
              (delta > 0 ? attributeMult * FSM_UP_FAC : attributeReduc * FSM_DOWN_FAC) *
              DECAY_FAC ** i;
          }
          if (blueTeam) {
            if (climbDict[blueTeam] === undefined || Number.isNaN(climbDict[blueTeam])) {
              climbDict[blueTeam] = 0;
            }
            const delta = blueRobotClimb[idx] - climbDict[blueTeam];
            climbDict[blueTeam] +=
              delta *
              (delta > 0 ? attributeMult * FSM_UP_FAC : attributeReduc * FSM_DOWN_FAC) *
              DECAY_FAC ** i;
          }
        }
      }
    }
  }

  return { FSMs, fuelDict, climbDict, foulDict, autoDict };
}

function elimAdjustFSM(matches: Match[], fsms: { [key: string]: number }) {
  for (const match of matches) {
    if (!match.score_breakdown) break;
    const redTeams = match.alliances.red.team_keys;
    const blueTeams = match.alliances.blue.team_keys;
    const redScore = Number(match.alliances.red.score) || 0;
    const blueScore = Number(match.alliances.blue.score) || 0;

    const redDelta = elimModRoot((redScore - blueScore) / 3.0);
    const blueDelta = elimModRoot((blueScore - redScore) / 3.0);

    for (const team of redTeams) {
      fsms[team] += redDelta > 0 ? redDelta * ELIM_MULT_FAC : redDelta * ELIM_REDUC_FAC;
    }
    for (const team of blueTeams) {
      fsms[team] += blueDelta > 0 ? blueDelta * ELIM_MULT_FAC : blueDelta * ELIM_REDUC_FAC;
    }
  }
}

const eventTeamsCache = new Map<
  string,
  { data: TeamDataType26[]; timestamp: number }
>();

export async function getEventTeams(
  eventCode: string,
  forceRecalc: boolean = false
): Promise<TeamDataType26[]> {
  if (!eventCode.startsWith("2026")) {
    throw new Error(`event26 utility only supports 2026 events: ${eventCode}`);
  }

  if (!forceRecalc) {
    const cached = eventTeamsCache.get(eventCode);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) return cached.data;
  }

  const TEAMDATA: { [key: string]: TeamDataType26 } = {};
  const orig_data = await getEventDataIfOneDayAfterEnd(eventCode);

  if (orig_data && !forceRecalc) {
    for (const teamKey in orig_data) {
      const team = orig_data[teamKey];
      TEAMDATA[teamKey] = {
        key: team.key,
        rank: team.rank,
        fsm: team.fsm,
        fuel: team.fuel ?? "0",
        climb: team.climb ?? "0",
        foul: team.foul ?? "0",
        algae: team.algae ?? "0",
        coral: team.coral ?? "0",
        auto: team.auto ?? "0",
      };
    }
    const sortedData = Object.values(TEAMDATA).sort(
      (a, b) => a.rank - b.rank || b.fsm.localeCompare(a.fsm)
    );
    eventTeamsCache.set(eventCode, { data: sortedData, timestamp: Date.now() });
    return sortedData;
  }

  const matches = await getEventQualMatches(eventCode);
  const attendingTeams = await getAttendingTeams(eventCode);

  if (matches.length === 0) {
    for (const team of attendingTeams) {
      TEAMDATA[team.key] = {
        key: team.key,
        rank: 0,
        fsm: "0.00",
        fuel: "0.00",
        climb: "0.00",
        foul: "0.00",
        algae: "0.00",
        coral: "0.00",
        auto: "0.00",
      };
    }
    const sortedData = Object.values(TEAMDATA);
    eventTeamsCache.set(eventCode, { data: sortedData, timestamp: Date.now() });
    await addEventToDB(eventCode, TEAMDATA as any);
    return sortedData;
  }

  const elimMatches = await getEventElimMatches(eventCode);
  const rankings = (await getEventRankings(eventCode)).rankings;
  const fsmdata = calculateFSM26(matches);
  const fsms = fsmdata.FSMs;
  const fuelDict = fsmdata.fuelDict;
  const climbDict = fsmdata.climbDict;
  const foulDict = fsmdata.foulDict;
  const autoDict = fsmdata.autoDict;
  elimAdjustFSM(elimMatches, fsms);

  for (let i = 0; i < rankings.length; i++) {
    const teamset = rankings[i];
    const team = teamset.team_key;
    if (!fsms[team]) fsms[team] = 0.0;
    if (!fuelDict[team]) fuelDict[team] = 0.0;
    if (!climbDict[team]) climbDict[team] = 0.0;
    if (!foulDict[team]) foulDict[team] = 0.0;
    if (!autoDict[team]) autoDict[team] = 0.0;
    const blendedFSM = blendFSM26(
      fsms[team],
      fuelDict[team],
      climbDict[team],
      foulDict[team]
    );
    fsms[team] = blendedFSM;

    TEAMDATA[team] = {
      key: team,
      rank: teamset.rank,
      fsm: blendedFSM.toFixed(2),
      fuel: fuelDict[team].toFixed(2),
      climb: climbDict[team].toFixed(2),
      foul: foulDict[team].toFixed(2),
      auto: autoDict[team].toFixed(2),
      algae: "0.00",
      coral: "0.00",
    };
  }

  for (const team of attendingTeams) {
    if (!TEAMDATA[team.key]) {
      const originalFSM = fsms[team.key] || 0;
      const fuel = fuelDict[team.key] || 0;
      const climb = climbDict[team.key] || 0;
      const foul = foulDict[team.key] || 0;
      const auto = autoDict[team.key] || 0;
      const blendedFSM = blendFSM26(originalFSM, fuel, climb, foul);
      fsms[team.key] = blendedFSM;
      TEAMDATA[team.key] = {
        key: team.key,
        rank: rankings.length + 1,
        fsm: blendedFSM.toFixed(2),
        fuel: fuel.toFixed(2),
        climb: climb.toFixed(2),
        foul: foul.toFixed(2),
        auto: auto.toFixed(2),
        algae: "0.00",
        coral: "0.00",
      };
    }
  }

  const sortedData = Object.values(TEAMDATA).sort(
    (a, b) => a.rank - b.rank || b.fsm.localeCompare(a.fsm)
  );
  eventTeamsCache.set(eventCode, { data: sortedData, timestamp: Date.now() });
  await addEventToDB(eventCode, TEAMDATA as any);
  return sortedData;
}

export async function getMatchPredictions(
  eventCode: string,
  FSMs: { [key: string]: number }
) {
  const matches = await getEventQualMatches(eventCode, true);
  if (matches.length === 0) {
    throw new Error(`No qualification matches found for event: ${eventCode}`);
  }

  const predictions: {
    [key: string]: {
      preds: string[];
      red: string[];
      blue: string[];
      result: number[];
    };
  } = {};

  for (const match of matches) {
    const redTeams = match.alliances.red.team_keys;
    const blueTeams = match.alliances.blue.team_keys;

    let redScore = 0;
    let blueScore = 0;
    for (const team of redTeams) redScore += FSMs[team] || 0;
    for (const team of blueTeams) blueScore += FSMs[team] || 0;

    predictions[match.key] = {
      preds: [redScore.toFixed(0), blueScore.toFixed(0)],
      red: redTeams,
      blue: blueTeams,
      result: [match.alliances.red.score, match.alliances.blue.score],
    };
  }
  return predictions;
}
