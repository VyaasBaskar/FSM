export async function computeAlliancePredictions(
  teams: any[],
  runOnnxModel: (inputData: Float32Array) => Promise<number>,
  makeInput: (alliance: any[], compLevel: any, match: any) => Float32Array,
  setAllianceProgress: (progress: string) => void
) {
  const teamsCopy = [...teams];
  const teamsLeft = [...teamsCopy];
  const sortedTeams = [...teamsCopy].sort(
    (a, b) => Number(b.fsm) - Number(a.fsm)
  );

  console.log("Teams available:", teams.length);

  if (teams.length < 24) {
    console.warn("Not enough teams for alliance prediction (need at least 24)");
    throw new Error(`Not enough teams (${teams.length}/24 minimum required)`);
  }

  const zeroTeamKey = sortedTeams[sortedTeams.length - 1].key;
  const zeroTeam = teams.find((team) => team.key === zeroTeamKey);

  if (!zeroTeam) {
    console.error("Could not find zero team");
    throw new Error("Unable to find reference team for predictions");
  }

  teamsLeft.sort((a, b) => Number(a.rank) - Number(b.rank));

  const newAlliances: any[] = [
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
  ];
  const newScores: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

  setAllianceProgress("Selecting alliance captains and first picks...");
  console.log(`Starting first pass with ${sortedTeams.length} teams available`);

  for (let i = 0; i < 8; i++) {
    console.log(`\nProcessing alliance ${i + 1}:`);
    console.log(`  - Teams left: ${teamsLeft.length}`);
    console.log(`  - Sorted teams available: ${sortedTeams.length}`);

    const cap = teamsLeft.shift();
    if (!cap) {
      console.error(`No captain available for alliance ${i + 1}`);
      break;
    }

    console.log(`  - Captain: ${cap.key} (FSM: ${cap.fsm})`);

    const capIdx = sortedTeams.findIndex((team) => team.key === cap.key);
    if (capIdx !== -1) sortedTeams.splice(capIdx, 1);

    const leftIdx = teamsLeft.findIndex((team) => team.key === cap.key);
    if (leftIdx !== -1) teamsLeft.splice(leftIdx, 1);

    let maxMpred = -1.0;
    let pick = "0";
    const maxTeamsToCheck = Math.min(4, sortedTeams.length);

    console.log(`  - Checking ${maxTeamsToCheck} potential picks`);

    for (let j = 0; j < maxTeamsToCheck; j++) {
      const team2 = sortedTeams[j];
      if (!team2) {
        console.warn(`    Team at index ${j} is undefined/null`);
        continue;
      }

      if (
        isNaN(Number(team2.fsm)) ||
        isNaN(Number(team2.algae)) ||
        isNaN(Number(team2.coral)) ||
        isNaN(Number(team2.auto)) ||
        isNaN(Number(team2.climb))
      ) {
        console.warn(`    Team ${team2.key} has invalid data, skipping`);
        continue;
      }

      const tempally = [cap, team2, zeroTeam];
      try {
        let mpred = await runOnnxModel(
          makeInput(tempally, 2, { match_number: 2 })
        );
        const pred2 =
          Number(cap.fsm) + Number(team2.fsm) + Number(zeroTeam.fsm);
        mpred = (mpred + pred2) / 2.0;
        if (mpred > maxMpred) {
          newAlliances[i] = [cap.key, team2.key, zeroTeam.key];
          pick = team2.key;
          maxMpred = mpred;
        }
      } catch (err) {
        console.error(`Error predicting for team ${team2.key}:`, err);
      }
    }

    if (pick !== "0") {
      const pickIdx = sortedTeams.findIndex((team) => team.key === pick);
      if (pickIdx !== -1) sortedTeams.splice(pickIdx, 1);

      const leftPickIdx = teamsLeft.findIndex((team) => team.key === pick);
      if (leftPickIdx !== -1) teamsLeft.splice(leftPickIdx, 1);
    } else {
      console.warn(`  - No valid pick found for alliance ${i + 1}!`);
    }

    console.log(`Alliance ${i + 1}: Captain ${cap.key}, Pick 1: ${pick}`);
    setAllianceProgress(`Alliance ${i + 1} of 8: Captain selected`);
  }

  setAllianceProgress("Selecting second picks for all alliances...");
  console.log(
    `\nStarting second pass with ${sortedTeams.length} teams available`
  );

  for (let i = 7; i >= 0; i--) {
    console.log(`\nProcessing second pick for alliance ${i + 1}:`);
    console.log(`  - Sorted teams available: ${sortedTeams.length}`);
    console.log(`  - Current alliance: ${newAlliances[i]}`);

    let maxMpred2 = -100;
    let pick = "0";
    const maxTeamsToCheck = Math.min(9, sortedTeams.length);

    console.log(`  - Checking ${maxTeamsToCheck} potential second picks`);

    let validChecks = 0;
    for (let j = 0; j < maxTeamsToCheck; j++) {
      const team3 = sortedTeams[j];
      if (!team3) {
        console.warn(`    Team at index ${j} is undefined/null`);
        continue;
      }

      const tempally0 = [...newAlliances[i]];
      tempally0[2] = team3.key;

      const tempally = tempally0.map((key) => teams.find((t) => t.key === key));

      if (tempally.some((t) => !t)) {
        console.warn(`    Couldn't find all teams for alliance check`);
        continue;
      }

      const allValid = tempally.every(
        (t) =>
          !isNaN(Number(t.fsm)) &&
          !isNaN(Number(t.algae)) &&
          !isNaN(Number(t.coral)) &&
          !isNaN(Number(t.auto)) &&
          !isNaN(Number(t.climb))
      );

      if (!allValid) {
        console.warn(`    Alliance has team with invalid data, skipping`);
        continue;
      }

      validChecks++;
      try {
        let mpred = await runOnnxModel(
          makeInput(tempally, 2, { match_number: 2 })
        );
        const pred2 =
          Number(tempally[0].fsm) +
          Number(tempally[1].fsm) +
          Number(tempally[2].fsm);
        mpred = (mpred + pred2) / 2.0;
        if (mpred > maxMpred2) {
          newAlliances[i][2] = team3.key;
          pick = team3.key;
          maxMpred2 = mpred;
          newScores[i] = mpred;
        }
      } catch (err) {
        console.error(
          `Error predicting second pick for alliance ${i + 1}:`,
          err
        );
      }
    }

    console.log(`  - Valid checks performed: ${validChecks}`);

    if (pick !== "0") {
      const pickIdx = sortedTeams.findIndex((team) => team.key === pick);
      if (pickIdx !== -1) sortedTeams.splice(pickIdx, 1);
    } else {
      console.warn(`  - No valid second pick found for alliance ${i + 1}!`);
    }

    console.log(
      `Alliance ${i + 1} complete: Pick 2: ${pick}, Score: ${newScores[
        i
      ].toFixed(1)}`
    );
    setAllianceProgress(`Alliance ${8 - i} of 8: Second pick selected`);
  }

  console.log("✅ Alliance predictions complete!");
  console.log("Predicted alliances:", newAlliances);
  console.log("Predicted scores:", newScores);

  return { alliances: newAlliances, scores: newScores };
}

export async function computeActualAllianceScores(
  actualAlliances: any[],
  teams: any[],
  runOnnxModel: (inputData: Float32Array) => Promise<number>,
  makeInput: (alliance: any[], compLevel: any, match: any) => Float32Array
) {
  console.log("\n🔄 Computing predicted scores for actual alliances...");
  const actualPredictedScores: number[] = [];

  for (let i = 0; i < Math.min(8, actualAlliances.length); i++) {
    const actualAlliance = actualAlliances[i];
    if (
      !actualAlliance ||
      !actualAlliance.picks ||
      actualAlliance.picks.length < 3
    ) {
      actualPredictedScores.push(0);
      continue;
    }

    const allianceTeamKeys = actualAlliance.picks.slice(0, 3);
    const allianceTeams = allianceTeamKeys.map((key: string) =>
      teams.find((t) => t.key === key)
    );

    if (
      allianceTeams.some((t: any) => !t) ||
      allianceTeams.some(
        (t: any) =>
          isNaN(Number(t.fsm)) ||
          isNaN(Number(t.algae)) ||
          isNaN(Number(t.coral)) ||
          isNaN(Number(t.auto)) ||
          isNaN(Number(t.climb))
      )
    ) {
      console.warn(`Skipping actual alliance ${i + 1} - invalid team data`);
      actualPredictedScores.push(0);
      continue;
    }

    try {
      let mpred = await runOnnxModel(
        makeInput(allianceTeams, 2, { match_number: 2 })
      );
      const pred2 = allianceTeams.reduce(
        (sum: number, t: any) => sum + Number(t.fsm),
        0
      );
      mpred = (mpred + pred2) / 2.0;
      actualPredictedScores.push(mpred);
      console.log(
        `  Alliance ${i + 1} (${allianceTeamKeys.join(", ")}): ${mpred.toFixed(
          1
        )}`
      );
    } catch (err) {
      console.error(
        `Error predicting score for actual alliance ${i + 1}:`,
        err
      );
      actualPredictedScores.push(0);
    }
  }

  while (actualPredictedScores.length < 8) {
    actualPredictedScores.push(0);
  }

  console.log("✅ Actual alliance predicted scores:", actualPredictedScores);
  return actualPredictedScores;
}
