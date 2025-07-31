/* eslint-disable */
import { addEventToDB, getEventDataIfOneDayAfterEnd } from "./supabase";

const MAX_ITERS = 50;
const DECAY_FAC = 1.005;
const FSM_UP_FAC = 0.4;
const FSM_DOWN_FAC = 0.4;
const ELIM_MULT_FAC = 0.5;
const ELIM_REDUC_FAC = 0.25;

const attributeMult = 0.2;
const attributeReduc = 0.03;

function modRoot(x: number) {
  if (x < 0) {
    return -Math.pow(-x, 1.0 / 2);
  }
  return Math.pow(x, 1.0 / 2);
}

function elimModRoot(x: number) {
  if (x < 0) {
    return -Math.pow(-x, 1.0 / 3);
  }
  return Math.pow(x, 1.0 / 3);
}

export async function getAttendingTeams(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}/teams`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      cache: "no-store",
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
    (match: { comp_level: string }) => match.comp_level === "qm" || anyFine
  );
}

export async function getNumberPlayedMatches(eventCode: string) {
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

  let count = 0;
  for (const match of matches) {
    if (match.score_breakdown) {
      count++;
    }
  }
  return count;
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

function getScore(match: any, alliance: string, attribute: string) {
  if (attribute === "score") {
    if (alliance === "red") {
      return match.alliances.red.score;
    } else if (alliance === "blue") {
      return match.alliances.blue.score;
    }
  }
  if (attribute === "algae") {
    if (alliance === "red") {
      return (
        match.score_breakdown.red.netAlgaeCount +
        match.score_breakdown.red.wallAlgaeCount
      );
    } else if (alliance === "blue") {
      return (
        match.score_breakdown.blue.netAlgaeCount +
        match.score_breakdown.blue.wallAlgaeCount
      );
    }
  }
  if (attribute == "coral") {
    if (alliance === "red") {
      let coralCount = 0;
      for (const coral in match.score_breakdown.red.teleopReef.botRow) {
        if (match.score_breakdown.red.teleopReef.botRow[coral]) {
          coralCount += match.score_breakdown.red.teleopReef.botRow[coral];
        }
      }
      for (const coral in match.score_breakdown.red.teleopReef.midRow) {
        if (match.score_breakdown.red.teleopReef.midRow[coral]) {
          coralCount += match.score_breakdown.red.teleopReef.midRow[coral];
        }
      }
      for (const coral in match.score_breakdown.red.teleopReef.topRow) {
        if (match.score_breakdown.red.teleopReef.topRow[coral]) {
          coralCount += match.score_breakdown.red.teleopReef.topRow[coral];
        }
      }
      coralCount += match.score_breakdown.red.teleopReef.trough;

      return coralCount;
    } else if (alliance === "blue") {
      let coralCount = 0;
      for (const coral in match.score_breakdown.blue.teleopReef.botRow) {
        if (match.score_breakdown.blue.teleopReef.botRow[coral]) {
          coralCount += match.score_breakdown.blue.teleopReef.botRow[coral];
        }
      }
      for (const coral in match.score_breakdown.blue.teleopReef.midRow) {
        if (match.score_breakdown.blue.teleopReef.midRow[coral]) {
          coralCount += match.score_breakdown.blue.teleopReef.midRow[coral];
        }
      }
      for (const coral in match.score_breakdown.blue.teleopReef.topRow) {
        if (match.score_breakdown.blue.teleopReef.topRow[coral]) {
          coralCount += match.score_breakdown.blue.teleopReef.topRow[coral];
        }
      }
      coralCount += match.score_breakdown.blue.teleopReef.trough;

      return coralCount;
    }
  }
  if (attribute == "auto") {
    if (alliance === "red") {
      return match.score_breakdown.red.autoCoralCount;
    } else if (alliance === "blue") {
      return match.score_breakdown.blue.autoCoralCount;
    }
  }
  if (attribute == "penalty") {
    if (alliance === "red") {
      return match.score_breakdown.blue.foulCount;
    } else if (alliance === "blue") {
      return match.score_breakdown.red.foulCount;
    }
  }
  return 0;
}

function updateDict(
  dict: { [key: string]: number },
  teams: string[],
  value: number,
  iters: number,
  isAttribute: boolean = false,
  elims: boolean = false
) {
  let dictpred = 0.0;
  for (const team of teams) {
    if (!dict[team]) {
      dict[team] = value / teams.length;
    }
    dictpred += dict[team];
  }

  let delta = modRoot(value - dictpred) / teams.length;
  if (elims) {
    delta = elimModRoot((value - dictpred) / teams.length);
  }
  if (isAttribute) {
    delta = (value - dictpred) / teams.length;
  }

  if (elims) {
    for (const team of teams) {
      if (delta > 0) {
        dict[team] +=
          delta *
          (isAttribute ? attributeMult : 1) *
          ELIM_MULT_FAC *
          DECAY_FAC ** iters;
      } else {
        dict[team] +=
          delta *
          (isAttribute ? attributeReduc : 1) *
          ELIM_REDUC_FAC *
          DECAY_FAC ** iters;
      }
    }
  } else {
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
}

function calculateFSM(matches: any[]) {
  const FSMs: { [key: string]: number } = {};
  const algaeDict: { [key: string]: number } = {};
  const coralDict: { [key: string]: number } = {};
  const autoDict: { [key: string]: number } = {};
  const climbDict: { [key: string]: number } = {};
  const foulDict: { [key: string]: number } = {};

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

        const redAlgae = getScore(match, "red", "algae");
        const blueAlgae = getScore(match, "blue", "algae");

        const redCoral = getScore(match, "red", "coral");
        const blueCoral = getScore(match, "blue", "coral");

        const redAuto = getScore(match, "red", "auto");
        const blueAuto = getScore(match, "blue", "auto");

        const redClimb = match.score_breakdown.red.endGameBargePoints;
        const blueClimb = match.score_breakdown.blue.endGameBargePoints;

        const redFoul = getScore(match, "red", "penalty");
        const blueFoul = getScore(match, "blue", "penalty");

        updateDict(FSMs, redTeams, redScore, i);
        updateDict(FSMs, blueTeams, blueScore, i);

        updateDict(algaeDict, redTeams, redAlgae, i, true);
        updateDict(algaeDict, blueTeams, blueAlgae, i, true);
        updateDict(coralDict, redTeams, redCoral, i, true);
        updateDict(coralDict, blueTeams, blueCoral, i, true);
        updateDict(autoDict, redTeams, redAuto, i, true);
        updateDict(autoDict, blueTeams, blueAuto, i, true);
        updateDict(climbDict, redTeams, redClimb, i, true);
        updateDict(climbDict, blueTeams, blueClimb, i, true);
        updateDict(foulDict, redTeams, redFoul, i, true);
        updateDict(foulDict, blueTeams, blueFoul, i, true);
      }
    }
  }
  return { FSMs, algaeDict, coralDict, autoDict, climbDict, foulDict };
}

function elimAdjustFSM(matches: any[], fsms: { [key: string]: number }) {
  for (const match of matches) {
    if (!match.score_breakdown) break;
    const redTeams = match.alliances.red.team_keys;
    const blueTeams = match.alliances.blue.team_keys;

    const redScore = match.alliances.red.score;
    const blueScore = match.alliances.blue.score;

    const redDelta = elimModRoot((redScore - blueScore) / 3.0);
    const blueDelta = elimModRoot((blueScore - redScore) / 3.0);

    for (const team of redTeams) {
      if (redDelta > 0) {
        fsms[team] += redDelta * ELIM_MULT_FAC;
      } else {
        fsms[team] += redDelta * ELIM_REDUC_FAC;
      }
    }
    for (const team of blueTeams) {
      if (blueDelta > 0) {
        fsms[team] += blueDelta * ELIM_MULT_FAC;
      } else {
        fsms[team] += blueDelta * ELIM_REDUC_FAC;
      }
    }
  }
}

export type TeamDataType = {
  key: string;
  rank: number;
  fsm: string;
  algae: string;
  coral: string;
  auto: string;
  climb: string;
  foul: string;
};

export async function getEventTeams(
  eventCode: string,
  forceRecalc: boolean = false
): Promise<TeamDataType[]> {
  const TEAMDATA: { [key: string]: TeamDataType } = {};

  const orig_data = await getEventDataIfOneDayAfterEnd(eventCode);

  if (orig_data && !forceRecalc) {
    console.log("Using cached data for event:", eventCode);
    for (const teamKey in orig_data) {
      const team = orig_data[teamKey];
      TEAMDATA[teamKey] = {
        key: team.key,
        rank: team.rank,
        fsm: team.fsm,
        algae: "0",
        coral: "0",
        auto: "0",
        climb: "0",
        foul: "0",
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
    await addEventToDB(eventCode, TEAMDATA);
    throw new Error(`No qualification matches found for event: ${eventCode}`);
  }
  const elimMatches = await getEventElimMatches(eventCode);
  const rankings = (await getEventRankings(eventCode)).rankings;
  const fsmdata = calculateFSM(matches);
  const fsms = fsmdata.FSMs;
  const algaeDict = fsmdata.algaeDict;
  const coralDict = fsmdata.coralDict;
  const autoDict = fsmdata.autoDict;
  const climbDict = fsmdata.climbDict;
  const foulDict = fsmdata.foulDict;
  elimAdjustFSM(elimMatches, fsms);

  for (let i = 0; i < rankings.length; i++) {
    const teamset = rankings[i];
    const team = teamset.team_key;
    if (!fsms[team]) {
      fsms[team] = 0.0;
    }
    if (!foulDict[team]) {
      foulDict[team] = 0.0;
    }
    TEAMDATA[team] = {
      key: team,
      rank: teamset.rank,
      fsm: fsms[team].toFixed(2),
      algae: algaeDict[team].toFixed(2),
      coral: coralDict[team].toFixed(2),
      auto: autoDict[team].toFixed(2),
      climb: climbDict[team].toFixed(2),
      foul: foulDict[team].toFixed(2),
    };
  }

  const sortedData = Object.values(TEAMDATA).sort((a, b) => {
    return a.rank - b.rank || b.fsm.localeCompare(a.fsm);
  });
  await addEventToDB(eventCode, TEAMDATA);
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
    // if (match.score_breakdown) continue;
    const redTeams = match.alliances.red.team_keys;
    const blueTeams = match.alliances.blue.team_keys;

    let redScore = 0;
    let blueScore = 0;

    for (const team of redTeams) {
      redScore += FSMs[team] || 0;
    }
    for (const team of blueTeams) {
      blueScore += FSMs[team] || 0;
    }

    predictions[match.key] = {
      preds: [redScore.toFixed(0), blueScore.toFixed(0)],
      red: redTeams,
      blue: blueTeams,
      result: [match.alliances.red.score, match.alliances.blue.score],
    };
  }
  return predictions;
}
