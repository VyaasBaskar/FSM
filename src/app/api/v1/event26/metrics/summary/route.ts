import { NextResponse } from "next/server";
import { getCachedEvent26Metrics } from "@/app/lib/supabase";
import { withCorsHeaders } from "@/app/api/v1/_utils";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: withCorsHeaders() });
}

function numericStats(values: number[]) {
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
  };
}

export async function GET() {
  try {
    const metrics = await getCachedEvent26Metrics();
    const updatedAts = metrics
      .map((metric) => metric.updatedAt)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    const summary = {
      count: metrics.length,
      updatedAt: {
        oldest:
          updatedAts.length > 0
            ? new Date(Math.min(...updatedAts)).toISOString()
            : null,
        newest:
          updatedAts.length > 0
            ? new Date(Math.max(...updatedAts)).toISOString()
            : null,
      },
      overallRms: numericStats(metrics.map((metric) => metric.overallRms)),
      top10Rms: numericStats(metrics.map((metric) => metric.top10Rms)),
      top25Rms: numericStats(metrics.map((metric) => metric.top25Rms)),
      teamCount: numericStats(metrics.map((metric) => metric.teamCount)),
      week: numericStats(
        metrics
          .map((metric) => metric.week)
          .filter((value): value is number => typeof value === "number")
      ),
    };

    return NextResponse.json(summary, {
      headers: withCorsHeaders({
        "Cache-Control": "public, max-age=300, s-maxage=600",
      }),
    });
  } catch (error) {
    console.error("Error fetching event26 metrics summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch event26 metrics summary" },
      { status: 500, headers: withCorsHeaders() }
    );
  }
}
