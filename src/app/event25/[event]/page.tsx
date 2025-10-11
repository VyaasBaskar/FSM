/* eslint-disable */

import {
  getEventQualMatches,
  getEventTeams,
  getMatchPredictions,
  getNumberPlayedMatches,
} from "../../lib/event";
import { getGlobalStats } from "@/app/lib/global";
import ClientPage from "./clientpage";
import FuturePage from "./futurepage";
import { getAttendingTeams } from "../../lib/event";

export default async function EventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: eventCode } = await params;

  try {
    const fullEventCode = "2025" + eventCode;

    const [teams, playedMatches] = await Promise.all([
      getEventTeams(fullEventCode, true),
      getNumberPlayedMatches(fullEventCode),
    ]);

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

    const [matchPredictions, matches] = await Promise.all([
      getMatchPredictions(fullEventCode, FSMs),
      getEventQualMatches(fullEventCode, true),
    ]);

    const havePreds =
      matchPredictions && Object.keys(matchPredictions).length > 0;

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
          teamsf={FSMs}
          matchPredictions={matchPredictions}
          matches={matches}
          playedMatches={playedMatches}
        />
      </div>
    );
  } catch (error) {
    let FSMs: { [key: string]: number } = {};

    let attendingKeys = [];
    for (const team of await getAttendingTeams("2025" + eventCode)) {
      attendingKeys.push(team.key);
    }

    const globalStats = await getGlobalStats();

    globalStats.forEach(({ teamKey, bestFSM }) => {
      if (attendingKeys.includes(teamKey)) FSMs[teamKey] = Number(bestFSM);
    });

    return <FuturePage code={eventCode} fsms={FSMs} />;
  }
}
