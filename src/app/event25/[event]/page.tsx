/* eslint-disable */

import {
  getEventQualMatches,
  getEventTeams,
  getMatchPredictions,
  getNumberPlayedMatches,
} from "../../lib/event";
import { getGlobalStats } from "@/app/lib/global";
import ClientPage from "./clientpage";
import SaveTextButton from "./stb";

import * as ort from "onnxruntime-node";
import path from "path";

const modelPath = path.join(process.cwd(), "public", "matchpred.onnx");

const session = await ort.InferenceSession.create(modelPath);

export default async function EventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  async function runOnnxModel(inputData: Float32Array) {
    const inputTensor = new ort.Tensor("float32", inputData, [1, 17]);

    const feeds: Record<string, ort.Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;

    const results = await session.run(feeds);
    const output = results[session.outputNames[0]].data;

    return Number(output[0]);
  }

  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode, true);

  const playedMatches = await getNumberPlayedMatches("2025" + eventCode);

  let FSMs: { [key: string]: number } = {};
  teams.forEach((team) => {
    FSMs[team.key] = Number(team.fsm);
  });

  if (playedMatches < 15) {
    const globalStats = await getGlobalStats();
    FSMs = {};
    globalStats.forEach(({ teamKey, bestFSM }) => {
      FSMs[teamKey] = Number(bestFSM);
    });
  }

  const matchPredictions = await getMatchPredictions("2025" + eventCode, FSMs);
  const havePreds =
    matchPredictions && Object.keys(matchPredictions).length > 0;

  const matches = await getEventQualMatches("2025" + eventCode, true);
  // const dataDict = [];
  // for (const match of matches) {
  //   let compLevel = 0;
  //   if (match.comp_level === "qm") {
  //     compLevel = 1;
  //   } else if (match.comp_level === "ef") {
  //     compLevel = 2;
  //   } else if (match.comp_level === "f") {
  //     compLevel = 3;
  //   }
  //   dataDict.push({
  //     a: teams.find((team) => team.key === match.alliances.blue.team_keys[0]),
  //     b: teams.find((team) => team.key === match.alliances.blue.team_keys[1]),
  //     c: teams.find((team) => team.key === match.alliances.blue.team_keys[2]),
  //     res: match.alliances.blue.score,
  //     num: match.match_number,
  //     lvl: compLevel,
  //   });
  //   dataDict.push({
  //     a: teams.find((team) => team.key === match.alliances.red.team_keys[0]),
  //     b: teams.find((team) => team.key === match.alliances.red.team_keys[1]),
  //     c: teams.find((team) => team.key === match.alliances.red.team_keys[2]),
  //     res: match.alliances.red.score,
  //     num: match.match_number,
  //     lvl: compLevel,
  //   });
  // }
  // console.log("Data Dictionary:", dataDict);

  if (playedMatches > 15) {
    for (const match of matches) {
      let compLevel = 0;
      if (match.comp_level === "qm") {
        compLevel = 1;
      } else if (match.comp_level === "ef") {
        compLevel = 2;
      } else if (match.comp_level === "f") {
        compLevel = 3;
      }
      const blueTeamA = teams.find(
        (team) => team.key === match.alliances.blue.team_keys[0]
      );
      const blueTeamB = teams.find(
        (team) => team.key === match.alliances.blue.team_keys[1]
      );
      const blueTeamC = teams.find(
        (team) => team.key === match.alliances.blue.team_keys[2]
      );
      const redTeamA = teams.find(
        (team) => team.key === match.alliances.red.team_keys[0]
      );
      const redTeamB = teams.find(
        (team) => team.key === match.alliances.red.team_keys[1]
      );
      const redTeamC = teams.find(
        (team) => team.key === match.alliances.red.team_keys[2]
      );

      if (
        redTeamA &&
        redTeamB &&
        redTeamC &&
        blueTeamA &&
        blueTeamB &&
        blueTeamC
      ) {
        const redInputData = new Float32Array([
          Number(redTeamA.fsm),
          Number(redTeamA.algae),
          Number(redTeamA.coral),
          Number(redTeamA.auto),
          Number(redTeamA.climb),
          Number(redTeamB.fsm),
          Number(redTeamB.algae),
          Number(redTeamB.coral),
          Number(redTeamB.auto),
          Number(redTeamB.climb),
          Number(redTeamC.fsm),
          Number(redTeamC.algae),
          Number(redTeamC.coral),
          Number(redTeamC.auto),
          Number(redTeamC.climb),
          compLevel,
          Number(match.match_number),
        ]);
        const redOutput = await runOnnxModel(redInputData);

        const blueInputData = new Float32Array([
          Number(blueTeamA.fsm),
          Number(blueTeamA.algae),
          Number(blueTeamA.coral),
          Number(blueTeamA.auto),
          Number(blueTeamA.climb),
          Number(blueTeamB.fsm),
          Number(blueTeamB.algae),
          Number(blueTeamB.coral),
          Number(blueTeamB.auto),
          Number(blueTeamB.climb),
          Number(blueTeamC.fsm),
          Number(blueTeamC.algae),
          Number(blueTeamC.coral),
          Number(blueTeamC.auto),
          Number(blueTeamC.climb),
          compLevel,
          Number(match.match_number),
        ]);
        const blueOutput = await runOnnxModel(blueInputData);

        let avgRedOutput = Number(matchPredictions[match.key].preds[0]);
        let avgBlueOutput = Number(matchPredictions[match.key].preds[1]);

        avgRedOutput = (avgRedOutput + redOutput) / 2;
        avgBlueOutput = (avgBlueOutput + blueOutput) / 2;

        matchPredictions[match.key].preds[0] = avgRedOutput.toFixed(0);
        matchPredictions[match.key].preds[1] = avgBlueOutput.toFixed(0);
      }
    }
  }

  return (
    <div>
      {/* <SaveTextButton
        text={JSON.stringify(dataDict, null, 2)}
        filename={`event_${eventCode}_data.json`}
      /> */}
      <ClientPage
        havePreds={havePreds}
        eventCode={eventCode}
        teams={teams}
        matchPredictions={matchPredictions}
      />
    </div>
  );
}
