import { NextRequest, NextResponse } from "next/server";
import { getCachedEvent26Metrics } from "@/app/lib/supabase";
import {
  normalizeEvent26Code,
  parseLimit,
  withCorsHeaders,
} from "@/app/api/v1/_utils";

const MAX_LIMIT = 2000;
const SORT_FIELDS = new Set([
  "overallRms",
  "top10Rms",
  "top25Rms",
  "teamCount",
  "updatedAt",
  "week",
]);

export const dynamic = "force-dynamic";

function sortMetrics(
  metrics: ReturnType<typeof getCachedEvent26Metrics> extends Promise<infer T>
    ? T
    : never,
  sortField: string,
  order: "asc" | "desc"
) {
  const dir = order === "asc" ? 1 : -1;
  return [...metrics].sort((a, b) => {
    const aValue = (a as Record<string, unknown>)[sortField];
    const bValue = (b as Record<string, unknown>)[sortField];
    if (typeof aValue === "number" && typeof bValue === "number") {
      return dir * (aValue - bValue);
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return dir * aValue.localeCompare(bValue);
    }
    return 0;
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: withCorsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventParam = searchParams.get("event");
    const sortParam = searchParams.get("sort") ?? "overallRms";
    const orderParam =
      (searchParams.get("order")?.toLowerCase() as "asc" | "desc") ?? "desc";
    const limitParam = parseLimit(searchParams.get("limit"), MAX_LIMIT);

    const metrics = await getCachedEvent26Metrics();

    if (eventParam) {
      const eventCode = normalizeEvent26Code(eventParam);
      const match =
        metrics.find((metric) => metric.key === eventCode) ?? null;
      if (!match) {
        return NextResponse.json(
          { error: "Event not found" },
          { status: 404, headers: withCorsHeaders() }
        );
      }
      return NextResponse.json(
        { data: match },
        {
          headers: withCorsHeaders({
            "Cache-Control": "public, max-age=300, s-maxage=600",
          }),
        }
      );
    }

    const sortField = SORT_FIELDS.has(sortParam) ? sortParam : "overallRms";
    const order = orderParam === "asc" ? "asc" : "desc";
    const sorted = sortMetrics(metrics, sortField, order);
    const limited =
      limitParam !== null ? sorted.slice(0, limitParam) : sorted;

    return NextResponse.json(
      { data: limited, count: limited.length },
      {
        headers: withCorsHeaders({
          "Cache-Control": "public, max-age=300, s-maxage=600",
        }),
      }
    );
  } catch (error) {
    console.error("Error fetching event26 metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch event26 metrics" },
      { status: 500, headers: withCorsHeaders() }
    );
  }
}
