import { NextResponse } from "next/server";
import { getGlobalStats } from "../../lib/global";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i)
      .filter((y) => y !== 2020 && y !== 2021 && y >= 2013)
      .reverse();

    const teamNormFSMs: { [teamKey: string]: number[] } = {};

    const yearResults = await Promise.allSettled(
      years.map((y) => getGlobalStats(y, true))
    );

    yearResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        const globalStats = result.value;
        const fsms = globalStats.map((t: any) => Number(t.bestFSM));
        const mean = fsms.reduce((a, b) => a + b, 0) / fsms.length;
        const variance =
          fsms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fsms.length;
        const stddev = Math.sqrt(variance);

        if (stddev > 0) {
          globalStats.forEach((team: any) => {
            const fsm = Number(team.bestFSM);
            if (!isNaN(fsm)) {
              const normFSM = ((fsm - mean) / stddev) * 100.0 + 1500.0;
              if (!teamNormFSMs[team.teamKey]) {
                teamNormFSMs[team.teamKey] = [];
              }
              teamNormFSMs[team.teamKey].push(normFSM);
            }
          });
        }
      }
    });

    const fsmMap: { [key: string]: number } = {};
    for (const teamKey in teamNormFSMs) {
      const normFSMs = teamNormFSMs[teamKey];
      if (normFSMs.length === 0) continue;
      
      const statsForAvg =
        normFSMs.length > 1
          ? normFSMs.filter(
              (s) => s !== Math.min(...normFSMs)
            )
          : normFSMs;

      let normSumSq = 0;
      for (const s of statsForAvg) {
        normSumSq += s * s;
      }
      const avgNormFSM = Math.sqrt(normSumSq / statsForAvg.length);
      const normalizedKey = teamKey.replace(/^frc/, "");
      fsmMap[normalizedKey] = avgNormFSM;
    }

    return NextResponse.json(fsmMap);
  } catch (error) {
    console.error("Error fetching RMS normalized FSM:", error);
    return NextResponse.json(
      { error: "Failed to fetch RMS normalized FSM" },
      { status: 500 }
    );
  }
}

