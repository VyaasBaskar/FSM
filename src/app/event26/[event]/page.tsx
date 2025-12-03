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
import { get26Predictions } from "@/app/lib/26pred";
import { upsertEvent26Metrics, Event26Metric } from "@/app/lib/supabase";

async function fetchEventDetail(eventCode: string) {
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/event/${eventCode}`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch event detail for ${eventCode}`);
  }

  return res.json();
}

function computeRms(values: number[]) {
  if (values.length === 0) {
    return { top10: 0, top25: 0, overall: 0 };
  }

  const sorted = [...values].sort((a, b) => b - a);
  const compute = (list: number[]) => {
    if (list.length === 0) return 0;
    const sumSquares = list.reduce((acc, value) => acc + value * value, 0);
    return Math.sqrt(sumSquares / list.length);
  };

  const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));
  const top25Count = Math.max(1, Math.ceil(sorted.length * 0.25));

  return {
    top10: compute(sorted.slice(0, top10Count)),
    top25: compute(sorted.slice(0, top25Count)),
    overall: compute(sorted),
  };
}

function buildEventMetric(
  eventDetail: any,
  teams: any[],
  fsmMap: Record<string, number>
): Event26Metric | null {
  const actualValues = new Map(
    teams.flatMap((team) => {
      const numericKey = team.key.replace(/^frc/, "");
      const value = Number(team.fsm);
      return [[team.key, value] as const, [numericKey, value] as const];
    })
  );

  const combinedValues = teams
    .map((team) => {
      const key = team.key;
      const numericKey = key.replace(/^frc/, "");
      const actual = actualValues.get(key) ?? actualValues.get(numericKey) ?? 0;
      if (actual > 0) {
        return actual;
      }
      const predicted = Number(fsmMap[key]) || Number(fsmMap[numericKey]) || 0;
      return predicted;
    })
    .filter((value) => Number.isFinite(value) && value > 0);

  if (combinedValues.length === 0) {
    return null;
  }

  const { top10, top25, overall } = computeRms(combinedValues);

  return {
    key: eventDetail.key,
    shortCode: eventDetail.key.replace(/^2026/, ""),
    name: eventDetail.name ?? eventDetail.key,
    city: eventDetail.city,
    stateProv: eventDetail.state_prov,
    country: eventDetail.country,
    startDate: eventDetail.start_date,
    endDate: eventDetail.end_date,
    week:
      typeof eventDetail.week === "number"
        ? eventDetail.week + 1
        : eventDetail.week === null
        ? null
        : null,
    district: eventDetail.district?.display_name ?? null,
    top10Rms: top10,
    top25Rms: top25,
    overallRms: overall,
    teamCount: combinedValues.length,
    updatedAt: new Date().toISOString(),
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: eventCode } = await params;

  try {
    const fullEventCode = "2026" + eventCode;
    let eventDetail: any;
    try {
      eventDetail = await fetchEventDetail(fullEventCode);
    } catch {
      eventDetail = {
        key: fullEventCode,
        name: fullEventCode,
        city: "",
        state_prov: "",
        country: "",
        start_date: null,
        end_date: null,
        week: null,
        district: null,
      };
    }

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
    //   } else if (match.comp_level === "sf") {
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

    const metric = buildEventMetric(eventDetail, teams, FSMs);

    if (metric) {
      await upsertEvent26Metrics([metric]);
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
          matches={matches}
          playedMatches={playedMatches}
          predictedFsms={FSMs}
        />
      </div>
    );
  } catch (error) {
    let FSMs: { [key: string]: number } = {};

    let attendingKeys = [];
    for (const team of await getAttendingTeams("2026" + eventCode)) {
      attendingKeys.push(team.key);
    }

    const predictions2026 = await get26Predictions();

    const predFSMs = predictions2026.map((p) => Number(p.bestFSM));
    const predMean = predFSMs.reduce((a, b) => a + b, 0) / predFSMs.length;
    const predVariance =
      predFSMs.reduce((a, b) => a + Math.pow(b - predMean, 2), 0) /
      predFSMs.length;
    const predStddev = Math.sqrt(predVariance);

    predictions2026.forEach(({ teamKey, bestFSM }) => {
      if (attendingKeys.includes(teamKey)) {
        const predFSM = Number(bestFSM);
        if (!isNaN(predFSM) && predStddev > 0) {
          const normPredFSM =
            ((predFSM - predMean) / predStddev) * 100.0 + 1500.0;
          FSMs[teamKey] = normPredFSM;
        }
      }
    });

    return <FuturePage code={eventCode} fsms={FSMs} />;
  }
}
