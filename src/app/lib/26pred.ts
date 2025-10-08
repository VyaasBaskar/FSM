"use server";

import { getGlobalStats } from "./global";

export async function get26Predictions() {
  const astats25 = await getGlobalStats(2025, true);
  const astats24 = await getGlobalStats(2024, true);
  const astats23 = await getGlobalStats(2023, true);

  function normalizeStats(
    stats: { teamKey: string; bestFSM: string }[],
    center = 1500,
    stddev = 100
  ) {
    const values = stats.map((s) => Number(s.bestFSM));
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const currentStddev = Math.sqrt(variance) || 1;
    return stats.map((s) => ({
      ...s,
      bestFSM: ((Number(s.bestFSM) - mean) / currentStddev) * stddev + center,
    }));
  }

  let stats23 = normalizeStats(astats23);
  let stats24 = normalizeStats(astats24);
  let stats25 = normalizeStats(astats25);

  const map23 = new Map(stats23.map((s) => [s.teamKey, Number(s.bestFSM)]));
  const map24 = new Map(stats24.map((s) => [s.teamKey, Number(s.bestFSM)]));
  const map25 = new Map(stats25.map((s) => [s.teamKey, Number(s.bestFSM)]));

  const predictions = [];
  console.log("Predicting 2026 FSMs...");

  for (const team of stats25) {
    const key = team.teamKey;
    const y23 = map23.get(key);
    const y24 = map24.get(key);
    const y25 = map25.get(key);

    let pred2026: number | undefined;

    if (y23 !== undefined && y24 !== undefined && y25 !== undefined) {
      const xs = [2023, 2024, 2025];
      const ys = [y23, y24, y25];
      const yMean = Math.sqrt(ys.reduce((a, b) => a + b * b, 0) / ys.length);
      const candidates: [number, number][] = [];
      if (y23 !== undefined) candidates.push([2023, y23]);
      if (y24 !== undefined) candidates.push([2024, y24]);
      const y25val = y25!;
      let maxSlope = 0;
      for (const [year, value] of candidates) {
        const slope = (y25val - value) / (2025 - year);
        if (Math.abs(slope) > Math.abs(maxSlope) || candidates.length === 1) {
          maxSlope = slope;
        }
      }
      const slope = maxSlope;
      pred2026 = yMean + 0.85 * slope;
    } else if (y24 !== undefined && y25 !== undefined) {
      const slope = y25 - y24;
      const avg = (y24 + y25) / 2;
      pred2026 = avg + 0.64 * slope;
    } else if (y25 !== undefined) {
      pred2026 = y25 + 50;
    } else {
      continue;
    }

    if (y25 !== undefined && pred2026 !== undefined) {
      const maxImp = 9.47614e10 / Math.pow(y25, 2.82382);
      if (pred2026 - y25 > maxImp) {
        pred2026 = y25 + maxImp;
      }
      const maxDec = 50;
      if (y25 - pred2026 > maxDec) {
        pred2026 = y25 - maxDec;
      }
    }

    predictions.push({
      teamKey: key,
      bestFSM: pred2026,
    });
  }

  return predictions;
}
