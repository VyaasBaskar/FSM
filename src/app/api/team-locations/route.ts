import { NextRequest, NextResponse } from "next/server";

// State/Province normalization mapping
const stateAbbreviations: { [key: string]: string } = {
  // US States
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  // Canadian Provinces/Territories
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

function normalizeStateProv(stateProv: string): string {
  if (!stateProv) return "";
  const trimmed = stateProv.trim();
  return stateAbbreviations[trimmed] || trimmed;
}

async function getTeamLocation(teamKey: string) {
  try {
    const res = await fetch(
      `https://www.thebluealliance.com/api/v3/team/${teamKey}`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
        },
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) {
      return { country: "", state_prov: "" };
    }

    const teamInfo = await res.json();
    return {
      country: teamInfo.country || "",
      state_prov: normalizeStateProv(teamInfo.state_prov || ""),
    };
  } catch {
    return { country: "", state_prov: "" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { teamKeys } = await request.json();

    if (!teamKeys || !Array.isArray(teamKeys)) {
      return NextResponse.json(
        { error: "teamKeys array is required" },
        { status: 400 }
      );
    }

    const locations: Record<string, { country: string; state_prov: string }> =
      {};

    // Fetch locations in batches
    const batchSize = 100;
    for (let i = 0; i < teamKeys.length; i += batchSize) {
      const batch = teamKeys.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((teamKey) => getTeamLocation(teamKey))
      );

      batch.forEach((teamKey, idx) => {
        const result = batchResults[idx];
        locations[teamKey] =
          result.status === "fulfilled"
            ? result.value
            : { country: "", state_prov: "" };
      });
    }

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching team locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
