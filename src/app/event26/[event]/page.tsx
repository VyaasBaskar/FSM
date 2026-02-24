import {
  getEventQualMatches,
  getEventTeams,
  getMatchPredictions,
  getNumberPlayedMatches,
} from "../../lib/event26";
import { getGlobalStats } from "@/app/lib/global";
import ClientPage from "./clientpage";
import FuturePage from "./futurepage";
import { getAttendingTeams } from "../../lib/event26";
import { get26Predictions } from "@/app/lib/26pred";
import { upsertEvent26Metrics, Event26Metric } from "@/app/lib/supabase";

const DEFAULT_FSM_MEAN_2026 = 45;
const DEFAULT_FSM_STDDEV_2026 = 35;

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

function normalizePredictedFSM(
  rawValue: number,
  sourceMean: number,
  sourceStddev: number
) {
  if (!Number.isFinite(rawValue)) return DEFAULT_FSM_MEAN_2026;
  if (!Number.isFinite(sourceStddev) || sourceStddev <= 0) {
    return DEFAULT_FSM_MEAN_2026;
  }
  return (
    ((rawValue - sourceMean) / sourceStddev) * DEFAULT_FSM_STDDEV_2026 +
    DEFAULT_FSM_MEAN_2026
  );
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

    const [teamsFromEvent, playedMatches, matches, attendingTeams, predictions2026] =
      await Promise.all([
      getEventTeams(fullEventCode, true),
      getNumberPlayedMatches(fullEventCode),
      getEventQualMatches(fullEventCode, true),
      getAttendingTeams(fullEventCode),
      get26Predictions(),
    ]);

    const predValues = predictions2026
      .map((p) => Number(p.bestFSM))
      .filter((v) => Number.isFinite(v));
    const predMean =
      predValues.length > 0
        ? predValues.reduce((a, b) => a + b, 0) / predValues.length
        : 0;
    const predVariance =
      predValues.length > 0
        ? predValues.reduce((a, b) => a + Math.pow(b - predMean, 2), 0) /
          predValues.length
        : 0;
    const predStddev = Math.sqrt(predVariance);
    const predMap = new Map(
      predictions2026.map((p) => [p.teamKey, Number(p.bestFSM)])
    );

    const teamsByKey = new Map(
      teamsFromEvent.map((team) => [team.key, { ...team }])
    );
    for (const team of attendingTeams) {
      if (!teamsByKey.has(team.key)) {
        teamsByKey.set(team.key, {
          key: team.key,
          rank: 0,
          fsm: "0.00",
          fuel: "0.00",
          climb: "0.00",
          foul: "0.00",
          algae: "0.00",
          coral: "0.00",
          auto: "0.00",
        });
      }
    }
    const teams = Array.from(teamsByKey.values());

    let FSMs: { [key: string]: number } = {};
    for (const team of teams) {
      const actualFSM = Number(team.fsm);
      if (Number.isFinite(actualFSM) && actualFSM > 0) {
        FSMs[team.key] = actualFSM;
        continue;
      }

      const rawPred = predMap.get(team.key);
      const normalized =
        rawPred != null
          ? normalizePredictedFSM(rawPred, predMean, predStddev)
          : DEFAULT_FSM_MEAN_2026;
      FSMs[team.key] = normalized;
      team.fsm = normalized.toFixed(2);
      team.fuel = normalized.toFixed(2);
    }

    if (playedMatches === 0) {
      const ranked = [...teams].sort(
        (a, b) => (Number(FSMs[b.key]) || 0) - (Number(FSMs[a.key]) || 0)
      );
      ranked.forEach((team, idx) => {
        team.rank = idx + 1;
      });
    }

    if (playedMatches < 15 && matches.length > 0) {
      const globalStats = await getGlobalStats();
      for (const { teamKey, bestFSM } of globalStats) {
        if (FSMs[teamKey] == null || FSMs[teamKey] <= 0) {
          FSMs[teamKey] = Number(bestFSM);
        }
      }
    }

    let matchPredictions: Record<
      string,
      { preds: string[]; red: string[]; blue: string[]; result: number[] }
    > = {};
    if (matches.length > 0) {
      matchPredictions = await getMatchPredictions(fullEventCode, FSMs);
    }

    const havePreds =
      matchPredictions && Object.keys(matchPredictions).length > 0;

    const metric = buildEventMetric(eventDetail, teams, FSMs);

    if (metric) {
      await upsertEvent26Metrics([metric]);
    }

    return (
      <div>
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
            ((predFSM - predMean) / predStddev) * DEFAULT_FSM_STDDEV_2026 +
            DEFAULT_FSM_MEAN_2026;
          FSMs[teamKey] = normPredFSM;
        }
      }
    });

    return <FuturePage code={eventCode} fsms={FSMs} />;
  }
}
