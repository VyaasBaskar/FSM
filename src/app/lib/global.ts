import { getTeamStats } from "./team";
import { getGlobalData, setGlobal, needToUpdateGlobal } from "./supabase";

async function getTeams(page: number, year: number = 2025) {
  if (year !== 2025) {
    page -= (2025 - year) * 100;
  }
  const res = await fetch(
    `https://www.thebluealliance.com/api/v3/teams/${year}/${page}/keys`,
    {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_API_KEY!,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch 2025 teams");
  }

  const teams = await res.json();
  return teams;
}

async function getPartialStats(
  page: number,
  priority: boolean,
  year: number = 2025
) {
  let upage = page;
  if (year !== 2025) {
    upage += (2025 - year) * 100;
  }
  if (await needToUpdateGlobal(upage, priority)) {
    const teams = await getTeams(upage, year);
    const stats: { [key: string]: number } = {};

    for (const team of teams) {
      console.log(`Fetching stats for team: ${team}`);
      try {
        const teamStats = await getTeamStats(team, year);
        stats[team] = teamStats.bestFSM;
      } catch (error) {
        console.error(`Error fetching stats for team ${team}:`, error);
      }
    }

    console.log(stats);

    await setGlobal(upage, stats);

    return { stats: stats, updated: true };
  } else {
    const stats: { [key: string]: number } = await getGlobalData(upage);
    return { stats: stats, updated: false };
  }
}

export async function getGlobalStats(year: number = 2025) {
  const all_stats: { [key: string]: number } = {};
  let priority = true;
  for (let i = 0; i < 22; i++) {
    const pstats = await getPartialStats(i, priority, year);
    if (pstats.updated) {
      priority = false;
    }
    const stats = pstats.stats;
    console.log(
      `Fetched stats for page ${i}: ${
        Object.keys(stats).length
      } teams, updated: ${pstats.updated}`
    );
    for (const team in stats) {
      if (stats.hasOwnProperty(team)) {
        all_stats[team] = stats[team];
      }
    }
  }
  const sortedGlobalStats = Object.entries(all_stats)
    .sort(([, a], [, b]) => b - a)
    .map(([teamKey, bestFSM]) => ({
      teamKey,
      bestFSM,
    }));

  //   console.log("Global stats fetched and sorted:", sortedGlobalStats);

  return sortedGlobalStats;
}
