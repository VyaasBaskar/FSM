import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchKey = searchParams.get("matchKey");

    if (!matchKey) {
      return NextResponse.json(
        { error: "Match key is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/match/${matchKey}`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch match details" },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
