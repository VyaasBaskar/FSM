import { NextRequest, NextResponse } from "next/server";
import { get26Predictions } from "@/app/lib/26pred";
import { supabase } from "@/app/lib/supabase";
import { normalizeEvent26Code, withCorsHeaders } from "@/app/api/v1/_utils";

type TeamMetric = {
  sortedRank: number;
  team: string;
  rank: number;
  fsm: number;
  auto: number;
  fuel: number;
  climb: number;
  penalty: number;
};

export const dynamic = "force-dynamic";
const DEFAULT_FSM_MEAN_2026 = 45;
const DEFAULT_FSM_STDDEV_2026 = 35;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapEventDataToTeamMetrics(
  eventData: Array<Record<string, unknown>>
) {
  return eventData.map((team) => ({
    sortedRank: 0,
    team: String(team.key ?? ""),
    rank: toNumber(team.rank),
    fsm: toNumber(team.fsm),
    auto: toNumber(team.auto),
    fuel: toNumber(team.fuel),
    climb: toNumber(team.climb),
    penalty: toNumber(team.foul),
  }));
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

async function applyPredictionFallback(rows: TeamMetric[]) {
  const predictions2026 = await get26Predictions();
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

  rows.forEach((row) => {
    if (row.fsm > 0) return;
    const rawPred = predMap.get(row.team);
    const normalized =
      rawPred != null
        ? normalizePredictedFSM(rawPred, predMean, predStddev)
        : DEFAULT_FSM_MEAN_2026;
    row.fsm = Number(normalized.toFixed(2));
    row.fuel = Number(normalized.toFixed(2));
  });
}

function finalizeOrdering(rows: TeamMetric[]) {
  const sortedByFsm = [...rows].sort((a, b) => b.fsm - a.fsm);
  sortedByFsm.forEach((row, index) => {
    row.sortedRank = index + 1;
  });

  const hasOnlyZeroRanks = sortedByFsm.every((row) => row.rank <= 0);
  if (hasOnlyZeroRanks) {
    sortedByFsm.forEach((row) => {
      row.rank = row.sortedRank;
    });
  }
  return sortedByFsm;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: withCorsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventParam = searchParams.get("event");

    if (!eventParam) {
      return NextResponse.json(
        { error: "event is required" },
        { status: 400, headers: withCorsHeaders() }
      );
    }

    const eventCode = normalizeEvent26Code(eventParam);
    const { data, error } = await supabase
      .from("EventFSMv1")
      .select("data")
      .eq("code", eventCode)
      .single();

    if (error || !data?.data) {
      return NextResponse.json(
        { error: "Event metrics not found" },
        { status: 404, headers: withCorsHeaders() }
      );
    }

    const rows = mapEventDataToTeamMetrics(
      Object.values(data.data as Record<string, Record<string, unknown>>)
    );
    await applyPredictionFallback(rows);
    const teamMetrics = finalizeOrdering(rows);

    return NextResponse.json(
      {
        event: eventCode,
        count: teamMetrics.length,
        data: teamMetrics,
      },
      {
        headers: withCorsHeaders({
          "Cache-Control": "public, max-age=300, s-maxage=600",
        }),
      }
    );
  } catch (error) {
    console.error("Error fetching event26 team metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch event26 team metrics" },
      { status: 500, headers: withCorsHeaders() }
    );
  }
}
