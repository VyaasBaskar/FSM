/* eslint-disable */

import { TeamDataType } from "./event";

async function processAlliance(
  allianceTeams: TeamDataType[],
  allianceColor: "red" | "blue",
  matchKey: string,
  matchNumber: number,
  redScore: number,
  blueScore: number,
  predRedScore: number,
  predBlueScore: number,
  zeroTeam: TeamDataType,
  defenseProbs: { [matchKey: string]: { [teamKey: string]: number } },
  teamDefenseWeightedSum: { [teamKey: string]: number },
  teamDefenseTotalProb: { [teamKey: string]: number },
  runOnnxModel: (inputData: Float32Array) => Promise<number>,
  makeInput: (
    alliance: {
      fsm: number;
      algae: number;
      coral: number;
      auto: number;
      climb: number;
    }[],
    compLevel: number,
    match: { match_number: number }
  ) => Float32Array,
  loggedMatch: string | null,
  isFirstAlliance: boolean
): Promise<string | null> {
  const allianceScore = allianceColor === "red" ? redScore : blueScore;
  const opposingScore = allianceColor === "red" ? blueScore : redScore;
  const predictedOpposingScore =
    allianceColor === "red" ? predBlueScore : predRedScore;
  const actualOpposingScore = allianceColor === "red" ? blueScore : redScore;
  const useZeroTeam = allianceColor === "red";

  for (const team of allianceTeams) {
    try {
      const allianceWithoutTeam = allianceTeams
        .filter((t) => t.key !== team.key)
        .map((t) => ({
          fsm: Number(t.fsm),
          algae: Number(t.algae),
          coral: Number(t.coral),
          auto: Number(t.auto),
          climb: Number(t.climb),
        }));

      const replacementTeam = useZeroTeam
        ? {
            fsm: Number(zeroTeam.fsm),
            algae: Number(zeroTeam.algae),
            coral: Number(zeroTeam.coral),
            auto: Number(zeroTeam.auto),
            climb: Number(zeroTeam.climb),
          }
        : {
            fsm: 0.0,
            algae: 0.0,
            coral: 0.0,
            auto: 0.0,
            climb: 0.0,
          };

      const allianceWithReplacement = [...allianceWithoutTeam, replacementTeam];

      // let mpredWithoutTeam = await runOnnxModel(
      //   makeInput(allianceWithReplacement, 1, { match_number: matchNumber })
      // );

      // if (isNaN(mpredWithoutTeam) || !isFinite(mpredWithoutTeam)) {
      //   console.error(
      //     `ONNX model returned invalid value ${mpredWithoutTeam} for team ${team.key} in match ${matchKey}`
      //   );
      //   defenseProbs[matchKey][team.key] = 0;
      //   continue;
      // }

      const pred2WithoutTeam =
        allianceWithoutTeam.reduce((sum, t) => sum + Number(t.fsm), 0) +
        (useZeroTeam ? Number(zeroTeam.fsm) : 0);
      // const scoreWithoutTeam = (mpredWithoutTeam + pred2WithoutTeam) / 2.0;

      // if (isNaN(scoreWithoutTeam) || !isFinite(scoreWithoutTeam)) {
      //   console.error(
      //     `Calculated invalid scoreWithoutTeam ${scoreWithoutTeam} for team ${team.key} in match ${matchKey}`
      //   );
      //   defenseProbs[matchKey][team.key] = 0;
      //   continue;
      // }

      const teamContribution = Number(team.fsm);
      const threshold = (25 + 0.15 * redScore) / 2;
      const diff = threshold - teamContribution;

      let prob = 0;
      if (teamContribution < threshold + 25) {
        const normalizedDiff = Math.max(-1, Math.min(1, diff / 10));
        prob =
          0.425 + 0.325 * normalizedDiff + 0.075 * Math.pow(normalizedDiff, 3);
      } else {
        prob = 0;
      }

      defenseProbs[matchKey][team.key] = Math.max(0, Math.min(1, prob));

      if (prob > 0 && redScore !== -1 && blueScore !== -1) {
        const defensiveImpact = predictedOpposingScore - actualOpposingScore;
        teamDefenseWeightedSum[team.key] += defensiveImpact * prob;
        teamDefenseTotalProb[team.key] += prob;
      }

      if (
        isFirstAlliance &&
        loggedMatch === null &&
        allianceTeams.indexOf(team) === 0
      ) {
        // console.log(
        //   `${allianceColor === "red" ? "Red" : "Blue"} team ${
        //     team.key
        //   } in ${matchKey}: redScore=${redScore.toFixed(
        //     2
        //   )}, blueScore=${blueScore.toFixed(
        //     2
        //   )}, scoreWithoutTeam=${scoreWithoutTeam.toFixed(
        //     2
        //   )}, threshold=${threshold.toFixed(2)}, prob=${
        //     defenseProbs[matchKey][team.key]
        //   }`
        // );
        loggedMatch = matchKey;
      } else if (
        !isFirstAlliance &&
        loggedMatch === matchKey &&
        allianceTeams.indexOf(team) === 0
      ) {
        // const deltaWithTeam = allianceScore - opposingScore;
        // const deltaWithoutTeam = scoreWithoutTeam - opposingScore;
        // console.log(
        //   `${allianceColor === "red" ? "Red" : "Blue"} team ${
        //     team.key
        //   } in ${matchKey}: redScore=${redScore.toFixed(
        //     2
        //   )}, blueScore=${blueScore.toFixed(
        //     2
        //   )}, scoreWithoutTeam=${scoreWithoutTeam.toFixed(
        //     2
        //   )}, deltaWithTeam=${deltaWithTeam.toFixed(
        //     2
        //   )}, deltaWithoutTeam=${deltaWithoutTeam.toFixed(
        //     2
        //   )}, teamContribution=${teamContribution.toFixed(
        //     2
        //   )}, threshold=${threshold.toFixed(2)}, prob=${
        //     defenseProbs[matchKey][team.key]
        //   }`
        // );
      }
    } catch (err) {
      console.error(
        `Error computing defense probability for team ${team.key} in match ${matchKey}:`,
        err
      );
      defenseProbs[matchKey][team.key] = 0;
    }
  }

  return loggedMatch;
}

function normalizeAllianceProbabilities(
  allianceTeams: TeamDataType[],
  matchKey: string,
  defenseProbs: { [matchKey: string]: { [teamKey: string]: number } }
): void {
  const teamProbs: { [teamKey: string]: number } = {};
  allianceTeams.forEach((team) => {
    if (defenseProbs[matchKey][team.key] !== undefined) {
      teamProbs[team.key] = defenseProbs[matchKey][team.key];
    }
  });

  const probValues = Object.values(teamProbs);
  const maxProb = Math.max(...probValues, 0);
  if (maxProb > 0 && probValues.length > 1) {
    const reductionThreshold = maxProb * 0.5;
    for (const teamKey in teamProbs) {
      if (teamProbs[teamKey] < reductionThreshold) {
        defenseProbs[matchKey][teamKey] = teamProbs[teamKey] * 0.5;
      }
    }
  }

  const teamKeys = allianceTeams.map((t) => t.key);
  const probSum = teamKeys.reduce(
    (sum, key) => sum + (defenseProbs[matchKey][key] || 0),
    0
  );
  if (probSum > 1) {
    const scaleFactor = 1 / probSum;
    for (const teamKey of teamKeys) {
      if (defenseProbs[matchKey][teamKey] !== undefined) {
        defenseProbs[matchKey][teamKey] =
          defenseProbs[matchKey][teamKey] * scaleFactor;
      }
    }
  }
}

export async function computeDefenseProbabilities(
  teams: TeamDataType[],
  matchPredictions: {
    [key: string]: {
      red: string[];
      blue: string[];
      result: number[];
      preds?: string[];
    };
  },
  runOnnxModel: (inputData: Float32Array) => Promise<number>,
  makeInput: (
    alliance: {
      fsm: number;
      algae: number;
      coral: number;
      auto: number;
      climb: number;
    }[],
    compLevel: number,
    match: { match_number: number }
  ) => Float32Array
): Promise<{
  probabilities: { [matchKey: string]: { [teamKey: string]: number } };
  defensiveScores: { [teamKey: string]: number };
}> {
  console.log("\nComputing defense probabilities...");
  console.log(`Processing ${Object.keys(matchPredictions).length} matches`);
  const defenseProbs: { [matchKey: string]: { [teamKey: string]: number } } =
    {};
  const defensiveScores: { [teamKey: string]: number } = {};
  const teamDefenseWeightedSum: { [teamKey: string]: number } = {};
  const teamDefenseTotalProb: { [teamKey: string]: number } = {};

  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    console.error("Invalid teams data for defense calculations");
    return { probabilities: defenseProbs, defensiveScores: {} };
  }

  if (!matchPredictions || Object.keys(matchPredictions).length === 0) {
    console.error("Invalid match predictions for defense calculations");
    return { probabilities: defenseProbs, defensiveScores: {} };
  }

  teams.forEach((team) => {
    teamDefenseWeightedSum[team.key] = 0;
    teamDefenseTotalProb[team.key] = 0;
  });

  let loggedMatch: string | null = null;

  const sortedTeams = [...teams].sort((a, b) => Number(b.fsm) - Number(a.fsm));
  const zeroTeam = sortedTeams[sortedTeams.length - 1];
  if (!zeroTeam) {
    console.error("Could not find zero team for defense calculations");
    return { probabilities: defenseProbs, defensiveScores: {} };
  }

  for (const [matchKey, matchPred] of Object.entries(matchPredictions)) {
    if (!matchKey.includes("_qm")) {
      continue;
    }

    if (
      !matchPred ||
      !matchPred.red ||
      !matchPred.blue ||
      !Array.isArray(matchPred.red) ||
      !Array.isArray(matchPred.blue)
    ) {
      continue;
    }

    const matchNumberMatch = matchKey.match(/qm(\d+)/);
    if (!matchNumberMatch) {
      continue;
    }
    const matchNumber = parseInt(matchNumberMatch[1]);
    const redTeams = matchPred.red
      .map((key) => teams.find((t) => t.key === key))
      .filter((t): t is TeamDataType => t !== undefined);
    const blueTeams = matchPred.blue
      .map((key) => teams.find((t) => t.key === key))
      .filter((t): t is TeamDataType => t !== undefined);

    if (redTeams.length < 3 || blueTeams.length < 3) continue;

    const redScore = matchPred.result[0] || 0;
    const blueScore = matchPred.result[1] || 0;
    const predRedScore =
      matchPred.preds && matchPred.preds[0]
        ? Number(matchPred.preds[0])
        : redScore;
    const predBlueScore =
      matchPred.preds && matchPred.preds[1]
        ? Number(matchPred.preds[1])
        : blueScore;

    defenseProbs[matchKey] = {};

    loggedMatch = await processAlliance(
      redTeams,
      "red",
      matchKey,
      matchNumber,
      redScore,
      blueScore,
      predRedScore,
      predBlueScore,
      zeroTeam,
      defenseProbs,
      teamDefenseWeightedSum,
      teamDefenseTotalProb,
      runOnnxModel,
      makeInput,
      loggedMatch,
      true
    );

    loggedMatch = await processAlliance(
      blueTeams,
      "blue",
      matchKey,
      matchNumber,
      redScore,
      blueScore,
      predRedScore,
      predBlueScore,
      zeroTeam,
      defenseProbs,
      teamDefenseWeightedSum,
      teamDefenseTotalProb,
      runOnnxModel,
      makeInput,
      loggedMatch,
      false
    );

    normalizeAllianceProbabilities(redTeams, matchKey, defenseProbs);
    normalizeAllianceProbabilities(blueTeams, matchKey, defenseProbs);
  }

  const MIN_TOTAL_DEFENSE_PROB = 0.3;

  const maxTotalProb = Math.max(
    ...teams.map((team) => teamDefenseTotalProb[team.key]),
    0
  );
  const FULL_CREDIT_THRESHOLD = Math.max(maxTotalProb, 3.0);

  teams.forEach((team) => {
    const totalProb = teamDefenseTotalProb[team.key];
    if (totalProb >= MIN_TOTAL_DEFENSE_PROB) {
      const rawScore = teamDefenseWeightedSum[team.key] / totalProb;

      const multiplier = Math.min(1.0, totalProb / FULL_CREDIT_THRESHOLD);
      const scaledMultiplier = Math.pow(multiplier, 0.6);

      defensiveScores[team.key] = rawScore * scaledMultiplier;
    } else {
      defensiveScores[team.key] = 0;
    }
  });

  console.log("Defense probabilities computed");
  console.log("Defensive scores:", defensiveScores);
  return { probabilities: defenseProbs, defensiveScores };
}
