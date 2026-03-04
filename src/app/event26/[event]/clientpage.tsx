"use client";
/* eslint-disable */

import { useState, useEffect, useMemo } from "react";
import styles from "../../page.module.css";
import Link from "next/link";
import TeamLink from "@/app/components/TeamLink";
import MatchDetailModal from "./MatchDetailModal";
import Event26TeamsTable from "../../components/Event26TeamsTable";

type MatchPredictions = {
  [key: string]: {
    preds: string[];
    red: string[];
    blue: string[];
    result: number[];
  };
};

interface ClientPageProps {
  havePreds: boolean;
  eventCode: string;
  teams: any[];
  matchPredictions: MatchPredictions;
  matches: any[];
  playedMatches: number;
  predictedFsms: Record<string, number>;
}

export default function ClientPage({
  havePreds,
  eventCode,
  teams,
  matchPredictions,
  matches,
  playedMatches,
  predictedFsms,
}: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "preds" | "rankings">(
    "stats"
  );
  const [selectedMatch, setSelectedMatch] = useState<{
    matchKey: string;
    match: MatchPredictions[string];
  } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const [filterText, setFilterText] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterType, setFilterType] = useState<"all" | "quals" | "elims">(
    "all"
  );

  const { topQuarterRms, overallRms, topDecileRms } = useMemo(() => {
    const predictedValues = Object.values(predictedFsms ?? {})
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    const fallbackValues = teams
      .map((team) => Number(team.fsm))
      .filter((value) => Number.isFinite(value));

    const fsmValues =
      predictedValues.length > 0 ? predictedValues : fallbackValues;

    if (fsmValues.length === 0) {
      return { topQuarterRms: 0, overallRms: 0, topDecileRms: 0 };
    }

    const sorted = [...fsmValues].sort((a, b) => b - a);

    const computeRms = (values: number[]) => {
      if (values.length === 0) return 0;
      const sumSquares = values.reduce((acc, value) => acc + value * value, 0);
      return Math.sqrt(sumSquares / values.length);
    };

    const top25Count = Math.max(1, Math.ceil(sorted.length * 0.25));
    const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));

    return {
      topQuarterRms: computeRms(sorted.slice(0, top25Count)),
      overallRms: computeRms(sorted),
      topDecileRms: computeRms(sorted.slice(0, top10Count)),
    };
  }, [predictedFsms, teams]);

  const summaryCards = useMemo(
    () => [
      { label: "Top 10% RMS FSM", value: topDecileRms },
      { label: "Top 25% RMS FSM", value: topQuarterRms },
      { label: "RMS FSM", value: overallRms },
    ],
    [topQuarterRms, overallRms, topDecileRms]
  );

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);

    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const entries = Object.entries(matchPredictions).sort(([a], [b]) => {
    const getTypeOrder = (key: string) => {
      if (key.includes("_f")) return 2;
      if (key.includes("_sf")) return 1;
      return 0;
    };
    const typeA = getTypeOrder(a);
    const typeB = getTypeOrder(b);

    if (typeA !== typeB) return typeA - typeB;

    const numA = parseInt(a.slice(4).match(/\d+/)?.[0] ?? "0", 10);
    const numB = parseInt(b.slice(4).match(/\d+/)?.[0] ?? "0", 10);

    return numA === numB ? a.localeCompare(b) : numA - numB;
  });

  const resultsWithGroundTruth = entries.filter(
    ([, match]) =>
      match.result &&
      match.result.length === 2 &&
      match.result[0] !== -1 &&
      match.result[1] !== -1
  );

  const correctPredictions = resultsWithGroundTruth.filter(([, match]) => {
    const [predRed, predBlue] = match.preds;
    const predWinner = Number(predRed) > Number(predBlue) ? "red" : "blue";

    const [actualRed, actualBlue] = match.result;
    const actualWinner =
      actualRed > actualBlue ? "red" : actualBlue > actualRed ? "blue" : "tie";

    return predWinner === actualWinner;
  });

  const accuracy =
    resultsWithGroundTruth.length > 0
      ? (100 * correctPredictions.length) / resultsWithGroundTruth.length
      : 0;

  const predictionSummary = useMemo(() => {
    if (entries.length === 0) {
      return { avgTotal: 0, avgMargin: 0 };
    }
    let total = 0;
    let margin = 0;
    for (const [, match] of entries) {
      const red = Number(match.preds?.[0]) || 0;
      const blue = Number(match.preds?.[1]) || 0;
      total += red + blue;
      margin += Math.abs(red - blue);
    }
    return {
      avgTotal: total / entries.length,
      avgMargin: margin / entries.length,
    };
  }, [entries]);

  const filteredEntries = entries.filter(([key, match]) => {
    const keyWithoutYear = key.replace(/^\d{4}/, "");
    const matchNameMatch = keyWithoutYear
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const teamMatch =
      filterTeam === "" ||
      [...match.red, ...match.blue].some((team) =>
        team.toLowerCase().includes(filterTeam.toLowerCase())
      );
    const typeMatch =
      filterType === "all" ||
      (filterType === "quals" && key.includes("_qm")) ||
      (filterType === "elims" && !key.includes("_qm"));

    return matchNameMatch && teamMatch && typeMatch;
  });

  const qualsEntries = entries.filter(([key, match]) => {
    const keyWithoutYear = key.replace(/^\d{4}/, "");
    const matchNameMatch = keyWithoutYear
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const teamMatch =
      filterTeam === "" ||
      [...match.red, ...match.blue].some((team) =>
        team.toLowerCase().includes(filterTeam.toLowerCase())
      );
    return key.includes("_qm") && matchNameMatch && teamMatch;
  });

  const elimsEntries = entries.filter(([key, match]) => {
    const keyWithoutYear = key.replace(/^\d{4}/, "");
    const matchNameMatch = keyWithoutYear
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const teamMatch =
      filterTeam === "" ||
      [...match.red, ...match.blue].some((team) =>
        team.toLowerCase().includes(filterTeam.toLowerCase())
      );
    return !key.includes("_qm") && matchNameMatch && teamMatch;
  });

  const matchCounts = useMemo(
    () => ({
      total: entries.length,
      quals: qualsEntries.length,
      elims: elimsEntries.length,
    }),
    [entries.length, qualsEntries.length, elimsEntries.length]
  );

  const getConfidence = (red: number, blue: number) => {
    const margin = Math.abs(red - blue);
    if (margin >= 35) {
      return { label: "High", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    }
    if (margin >= 18) {
      return { label: "Medium", color: "#eab308", bg: "rgba(234,179,8,0.12)" };
    }
    return { label: "Low", color: "#f97316", bg: "rgba(249,115,22,0.12)" };
  };

  const projectedRankings = useMemo(() => {
    const EPS = 1e-6;
    const erf = (x: number) => {
      const sign = x >= 0 ? 1 : -1;
      const ax = Math.abs(x);
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      const t = 1 / (1 + p * ax);
      const y =
        1 -
        (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
          t *
          Math.exp(-ax * ax));
      return sign * y;
    };
    const normalCdf = (z: number) => 0.5 * (1 + erf(z / Math.sqrt(2)));
    const probAtLeast = (mean: number, stdDev: number, threshold: number) => {
      const s = stdDev > EPS ? stdDev : 1;
      return 1 - normalCdf((threshold - mean) / s);
    };

    const teamMetricMap = new Map<
      string,
      { fuel: number; climb: number; fsm: number }
    >(
      teams.map((team) => [
        team.key,
        {
          fuel: Number(team.fuel ?? team.fsm ?? 0),
          climb: Number(team.climb ?? 0),
          fsm: Number(team.fsm ?? 0),
        },
      ])
    );

    const allFuel = teams.map((t) => Number(t.fuel ?? t.fsm ?? 0)).filter(Number.isFinite);
    const allClimb = teams.map((t) => Number(t.climb ?? 0)).filter(Number.isFinite);
    const allFsm = teams.map((t) => Number(t.fsm ?? 0)).filter(Number.isFinite);
    const meanOf = (vals: number[], fallback: number) =>
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : fallback;
    const varOf = (vals: number[], fallback: number) => {
      if (vals.length === 0) return fallback;
      const m = meanOf(vals, 0);
      return vals.reduce((a, b) => a + Math.pow(b - m, 2), 0) / vals.length;
    };

    const fuelMean = meanOf(allFuel, 45);
    const climbMean = meanOf(allClimb, 8);
    const fsmMean = meanOf(allFsm, 45);
    const fuelVar = Math.max(varOf(allFuel, 25 * 25), 25);
    const climbVar = Math.max(varOf(allClimb, 12 * 12), 16);
    const fsmVar = Math.max(varOf(allFsm, 25 * 25), 25);

    const allianceMetricStats = (
      teamKeys: string[],
      metric: "fuel" | "climb" | "fsm"
    ) => {
      let mean = 0;
      let variance = 0;
      for (const key of teamKeys) {
        const m = teamMetricMap.get(key);
        const value =
          m?.[metric] ??
          (metric === "fuel" ? fuelMean : metric === "climb" ? climbMean : fsmMean);
        mean += Number.isFinite(value) ? value : 0;
        variance += metric === "fuel" ? fuelVar : metric === "climb" ? climbVar : fsmVar;
      }
      return { mean, stdDev: Math.sqrt(Math.max(variance, EPS)) };
    };

    const standings = new Map<
      string,
      {
        teamKey: string;
        currentRp: number;
        forecastRp: number;
        wins: number;
        losses: number;
        ties: number;
        played: number;
      }
    >();

    const ensure = (teamKey: string) => {
      if (!standings.has(teamKey)) {
        standings.set(teamKey, {
          teamKey,
          currentRp: 0,
          forecastRp: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          played: 0,
        });
      }
      return standings.get(teamKey)!;
    };

    for (const team of teams) ensure(team.key);

    const addActualAlliance = (
      teamKeys: string[],
      rpValue: number,
      result: "win" | "loss" | "tie"
    ) => {
      for (const teamKey of teamKeys) {
        const row = ensure(teamKey);
        row.currentRp += rpValue;
        row.forecastRp += rpValue;
        row.played += 1;
        if (result === "win") row.wins += 1;
        else if (result === "loss") row.losses += 1;
        else row.ties += 1;
      }
    };

    const addExpectedAlliance = (
      teamKeys: string[],
      pWin: number,
      pFuel: number,
      pScore: number,
      pClimb: number
    ) => {
      const expectedRp = 3 * pWin + pFuel + pScore + pClimb;
      for (const teamKey of teamKeys) {
        const row = ensure(teamKey);
        row.forecastRp += expectedRp;
        row.wins += pWin;
        row.losses += 1 - pWin;
        row.played += 1;
      }
    };

    const pairThresholdProbability = (
      teamKey: string,
      metric: "fuel" | "climb" | "fsm",
      threshold: number
    ) => {
      const teamValue = Number(
        teamMetricMap.get(teamKey)?.[metric] ??
          (metric === "fuel" ? fuelMean : metric === "climb" ? climbMean : fsmMean)
      );
      if (!Number.isFinite(teamValue)) return 0;
      if (teamValue >= threshold) return 1;
      const deficit = threshold - teamValue;
      const partnerValues = teams
        .filter((t) => t.key !== teamKey)
        .map((t) => {
          const value =
            teamMetricMap.get(t.key)?.[metric] ??
            (metric === "fuel" ? fuelMean : metric === "climb" ? climbMean : fsmMean);
          return Number(value);
        })
        .filter(Number.isFinite);
      if (partnerValues.length < 2) {
        const varValue = metric === "fuel" ? fuelVar : metric === "climb" ? climbVar : fsmVar;
        return probAtLeast(teamValue + 2 * meanOf(partnerValues, 0), Math.sqrt(2 * varValue), threshold);
      }
      let success = 0;
      let total = 0;
      for (let i = 0; i < partnerValues.length - 1; i += 1) {
        for (let j = i + 1; j < partnerValues.length; j += 1) {
          total += 1;
          if (partnerValues[i] + partnerValues[j] >= deficit) {
            success += 1;
          }
        }
      }
      return total > 0 ? success / total : 0;
    };

    const qualMatches = matches.filter((m) => m.comp_level === "qm");
    if (qualMatches.length === 0) {
      const expectedMatches = 10;
      const meanOppFsm = 3 * fsmMean;
      const stdOppFsm = Math.sqrt(3 * fsmVar);

      for (const team of teams) {
        const row = ensure(team.key);
        const teamFuel = Number(team.fuel ?? team.fsm ?? fuelMean);
        const teamClimb = Number(team.climb ?? 0);
        const teamFsm = Number(team.fsm ?? fsmMean);

        const allianceFuelMean = teamFuel + 2 * fuelMean;
        const allianceClimbMean = teamClimb + 2 * climbMean;
        const allianceFsmMean = teamFsm + 2 * fsmMean;

        const allianceFuelStd = Math.sqrt(3 * fuelVar);
        const allianceClimbStd = Math.sqrt(3 * climbVar);
        const allianceFsmStd = Math.sqrt(3 * fsmVar);

        const pWin = probAtLeast(
          allianceFsmMean - meanOppFsm,
          Math.sqrt(allianceFsmStd ** 2 + stdOppFsm ** 2),
          0
        );
        const pFuel = pairThresholdProbability(team.key, "fuel", 100);
        const pScore = pairThresholdProbability(team.key, "fsm", 360);
        const pClimb = pairThresholdProbability(team.key, "climb", 50);

        row.currentRp = 0;
        row.forecastRp += (3 * pWin + pFuel + pScore + pClimb) * expectedMatches;
        row.wins += pWin * expectedMatches;
        row.losses += (1 - pWin) * expectedMatches;
        row.played += expectedMatches;
      }
    } else {
      for (const match of qualMatches) {
        const redTeams: string[] = match.alliances?.red?.team_keys ?? [];
        const blueTeams: string[] = match.alliances?.blue?.team_keys ?? [];
        const redSb = match.score_breakdown?.red;
        const blueSb = match.score_breakdown?.blue;

        if (redSb && blueSb && redSb.rp != null && blueSb.rp != null) {
          const redScore = Number(match.alliances?.red?.score) || 0;
          const blueScore = Number(match.alliances?.blue?.score) || 0;
          const redResult =
            redScore > blueScore ? "win" : redScore < blueScore ? "loss" : "tie";
          const blueResult =
            blueScore > redScore ? "win" : blueScore < redScore ? "loss" : "tie";
          addActualAlliance(redTeams, Number(redSb.rp) || 0, redResult);
          addActualAlliance(blueTeams, Number(blueSb.rp) || 0, blueResult);
          continue;
        }

        const redFsm = allianceMetricStats(redTeams, "fsm");
        const blueFsm = allianceMetricStats(blueTeams, "fsm");
        const redFuel = allianceMetricStats(redTeams, "fuel");
        const blueFuel = allianceMetricStats(blueTeams, "fuel");
        const redClimb = allianceMetricStats(redTeams, "climb");
        const blueClimb = allianceMetricStats(blueTeams, "climb");

        const pRedWin = probAtLeast(
          redFsm.mean - blueFsm.mean,
          Math.sqrt(redFsm.stdDev ** 2 + blueFsm.stdDev ** 2),
          0
        );
        const pBlueWin = 1 - pRedWin;

        const pRedFuel = probAtLeast(redFuel.mean, redFuel.stdDev, 100);
        const pBlueFuel = probAtLeast(blueFuel.mean, blueFuel.stdDev, 100);
        const pRedScore = probAtLeast(redFsm.mean, redFsm.stdDev, 360);
        const pBlueScore = probAtLeast(blueFsm.mean, blueFsm.stdDev, 360);
        const pRedClimb = probAtLeast(redClimb.mean, redClimb.stdDev, 50);
        const pBlueClimb = probAtLeast(blueClimb.mean, blueClimb.stdDev, 50);

        addExpectedAlliance(redTeams, pRedWin, pRedFuel, pRedScore, pRedClimb);
        addExpectedAlliance(blueTeams, pBlueWin, pBlueFuel, pBlueScore, pBlueClimb);
      }
    }

    const getForecastAvg = (row: { forecastRp: number; played: number }) =>
      row.played > 0 ? row.forecastRp / row.played : 0;

    return Array.from(standings.values())
      .sort((a, b) => {
        const bAvg = getForecastAvg(b);
        const aAvg = getForecastAvg(a);
        if (bAvg !== aAvg) return bAvg - aAvg;
        if (b.currentRp !== a.currentRp) return b.currentRp - a.currentRp;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.teamKey.localeCompare(b.teamKey);
      })
      .map((row, idx) => ({
        ...row,
        forecastRp: getForecastAvg(row),
        rank: idx + 1,
      }));
  }, [matches, teams]);

  return (
    <div
      className={styles.page}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100%",
      }}
    >
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Event FSM</h1>
        <h2 className={styles.table}>2026{eventCode}</h2>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setActiveTab("stats")}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "stats" ? "#333" : "#222",
              color: activeTab === "stats" ? "#fff" : "#ccc",
              border: "1px solid #555",
              cursor: "pointer",
            }}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab("preds")}
            disabled={!havePreds}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "preds" ? "#333" : "#222",
              color: havePreds
                ? activeTab === "preds"
                  ? "#fff"
                  : "#ccc"
                : "#888",
              border: "1px solid #555",
              cursor: havePreds ? "pointer" : "not-allowed",
            }}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab("rankings")}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "rankings" ? "#333" : "#222",
              color: activeTab === "rankings" ? "#fff" : "#ccc",
              border: "1px solid #555",
              cursor: "pointer",
            }}
          >
            Rankings
          </button>
        </div>

        {activeTab === "stats" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "var(--foreground)",
              borderRadius: 12,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "1rem",
                width: "100%",
                marginBottom: "1.5rem",
              }}
            >
              {summaryCards.map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    minWidth: "200px",
                    padding: "1rem 1.5rem",
                    background: "var(--background-pred)",
                    borderRadius: 12,
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9rem",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--gray-less)",
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 700,
                      color: "var(--foreground)",
                    }}
                  >
                    {value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <h2 style={{ color: "var(--foreground)" }}>Team Stats</h2>
            <br />
            <div
              style={{ maxWidth: "100%", overflowX: "scroll", width: "100%" }}
            >
              <Event26TeamsTable teams={teams} />
            </div>
          </div>
        )}

        {activeTab === "preds" && havePreds && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "var(--foreground)",
              borderRadius: 12,
              width: "100%",
            }}
          >
            <h2 style={{ color: "var(--foreground)" }}>Match Predictions</h2>
            <p
              style={{
                color: "var(--foreground)",
                fontSize: "1rem",
                marginTop: "0.2rem",
              }}
            >
              Prediction Accuracy: {correctPredictions.length} /{" "}
              {resultsWithGroundTruth.length} ({accuracy.toFixed(1)}%)
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  background: "var(--background-pred)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                }}
              >
                Avg Pred Total:{" "}
                <strong>{predictionSummary.avgTotal.toFixed(1)}</strong>
              </div>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  background: "var(--background-pred)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                }}
              >
                Avg Pred Margin:{" "}
                <strong>{predictionSummary.avgMargin.toFixed(1)}</strong>
              </div>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  background: "var(--background-pred)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                }}
              >
                Matches: <strong>{matchCounts.total}</strong> (Q{" "}
                <strong>{matchCounts.quals}</strong> / E{" "}
                <strong>{matchCounts.elims}</strong>)
              </div>
            </div>

            <br />
            <div
              className="filters-container"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                width: "100%",
                maxWidth: "600px",
                marginBottom: "1.5rem",
              }}
            >
              <input
                type="text"
                placeholder="Filter by match name"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  fontSize: "1rem",
                  width: "100%",
                }}
              />
              <input
                type="text"
                placeholder="Filter by team"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="team-filter-input"
                style={{
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  fontSize: "1rem",
                  width: "100%",
                }}
              />
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "quals" | "elims")
                }
                className="match-type-filter-mobile"
                style={{
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  fontSize: "1rem",
                  width: "100%",
                }}
              >
                <option value="all">All</option>
                <option value="quals">Quals</option>
                <option value="elims">Elims</option>
              </select>
            </div>
            <style jsx>{`
              @media (min-width: 768px) {
                .match-type-filter-mobile {
                  display: none !important;
                }
              }
            `}</style>

            <ul
              className="mobile-matches-list"
              style={{ listStyle: "none", padding: 10 }}
            >
              {filteredEntries.map(([matchKey, match]) => {
                const [predRed, predBlue] = match.preds;
                const predWinner =
                  Number(predRed) > Number(predBlue) ? "red" : "blue";

                const hasResult = match.result && match.result.length === 2;
                const [actualRed, actualBlue] = hasResult
                  ? match.result
                  : [null, null];
                const actualWinner =
                  hasResult && actualRed !== null && actualBlue !== null
                    ? actualRed > actualBlue
                      ? "red"
                      : actualBlue > actualRed
                      ? "blue"
                      : "tie"
                    : null;

                return (
                  <li
                    key={matchKey}
                    style={{
                      marginBottom: "1rem",
                      textAlign: "center",
                      border: "1px solid var(--border-color)",
                      borderRadius: 4,
                      padding: "0.5rem",
                      background: "var(--background-pred)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{matchKey}</span>
                      {hasResult && (
                        <a
                          href={`https://www.thebluealliance.com/match/${matchKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: "0.65rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.08)",
                            color: "var(--gray-less)",
                            textDecoration: "none",
                            fontWeight: 600,
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          ▶ TBA
                        </a>
                      )}
                      <span
                        style={{
                          padding: "0.12rem 0.45rem",
                          borderRadius: 999,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          background: getConfidence(
                            Number(predRed),
                            Number(predBlue)
                          ).bg,
                          color: getConfidence(Number(predRed), Number(predBlue))
                            .color,
                          border: `1px solid ${
                            getConfidence(Number(predRed), Number(predBlue))
                              .color
                          }33`,
                        }}
                      >
                        {getConfidence(Number(predRed), Number(predBlue)).label}{" "}
                        Confidence
                      </span>
                    </div>
                    <div
                      style={{ marginBottom: "0.25rem", fontSize: "0.75rem" }}
                    >
                      <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>
                        Red
                      </span>{" "}
                      {match.red.map((t, i) => {
                        const isHighlighted =
                          filterTeam &&
                          t.toLowerCase().includes(filterTeam.toLowerCase());
                        return (
                          <span key={t}>
                            {i > 0 && ", "}
                            <span
                              style={{
                                background: isHighlighted
                                  ? "#ffd700"
                                  : "transparent",
                                color: isHighlighted ? "#000" : "inherit",
                                padding: isHighlighted ? "0.2em 0.4em" : "0",
                                borderRadius: isHighlighted ? "4px" : "0",
                              }}
                            >
                              <TeamLink teamKey={t} year={2026} />
                            </span>
                          </span>
                        );
                      })}{" "}
                      {" vs. "}
                      <span style={{ color: "#4d8cff", fontWeight: "bold" }}>
                        Blue
                      </span>{" "}
                      {match.blue.map((t, i) => {
                        const isHighlighted =
                          filterTeam &&
                          t.toLowerCase().includes(filterTeam.toLowerCase());
                        return (
                          <span key={t}>
                            {i > 0 && ", "}
                            <span
                              style={{
                                background: isHighlighted
                                  ? "#ffd700"
                                  : "transparent",
                                color: isHighlighted ? "#000" : "inherit",
                                padding: isHighlighted ? "0.2em 0.4em" : "0",
                                borderRadius: isHighlighted ? "4px" : "0",
                              }}
                            >
                              <TeamLink teamKey={t} year={2026} />
                            </span>
                          </span>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        marginBottom: "0.2rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.35rem",
                        maxWidth: 320,
                        marginInline: "auto",
                      }}
                    >
                      <div style={{ fontSize: "0.875rem" }}>
                        <strong style={{ fontSize: "0.7rem", marginRight: 3 }}>
                          Pred:
                        </strong>
                        <span style={{ color: "#ff4d4d" }}>
                          {Math.round(Number(predRed))}
                        </span>{" "}
                        --{" "}
                        <span style={{ color: "#4d8cff" }}>
                          {Math.round(Number(predBlue))}
                        </span>
                        <span
                          style={{
                            marginLeft: 8,
                            color: "var(--gray-less)",
                            fontSize: "0.72rem",
                          }}
                        >
                          (Δ {Math.abs(Number(predRed) - Number(predBlue)).toFixed(0)})
                        </span>
                      </div>
                      {hasResult && (
                        <div style={{ fontSize: "0.875rem" }}>
                          <strong
                            style={{ fontSize: "0.65rem", marginRight: 2 }}
                          >
                            Real:
                          </strong>
                          <span style={{ color: "#ff4d4d" }}>{actualRed}</span>{" "}
                          --{" "}
                          <span style={{ color: "#4d8cff" }}>{actualBlue}</span>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        marginBottom: hasResult ? "0.25rem" : "0",
                        fontSize: "0.75rem",
                      }}
                    >
                      Predicted winner:{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                          background: "var(--background)",
                          padding: "0.1em 0.4em",
                          borderRadius: 2,
                        }}
                      >
                        {predWinner === "red" ? "Red" : "Blue"}
                      </span>
                    </div>

                    {hasResult && (
                      <div>
                        Winner:{" "}
                        <span
                          style={{
                            fontWeight: "bold",
                            color:
                              actualWinner === "red"
                                ? "#ff4d4d"
                                : actualWinner === "blue"
                                ? "#4d8cff"
                                : "#aaa",
                            background: "var(--background)",
                            padding: "0.1em 0.4em",
                            borderRadius: 2,
                          }}
                        >
                          {actualWinner === "tie"
                            ? "Tie"
                            : actualWinner === "red"
                            ? "Red"
                            : "Blue"}
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div
              className="desktop-matches-container"
              style={{ marginTop: "2rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                  width: "100%",
                  maxWidth: "1200px",
                  margin: "0 auto",
                }}
              >
                <div>
                  <h3
                    style={{
                      color: "var(--yellow-color)",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    Qualification Matches ({qualsEntries.length})
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {qualsEntries.map(([matchKey, match]) => {
                      const [predRed, predBlue] = match.preds;
                      const predWinner =
                        Number(predRed) > Number(predBlue) ? "red" : "blue";
                      const hasResult =
                        match.result && match.result.length === 2;
                      const [actualRed, actualBlue] = hasResult
                        ? match.result
                        : [null, null];
                      const actualWinner =
                        hasResult && actualRed !== null && actualBlue !== null
                          ? actualRed > actualBlue
                            ? "red"
                            : actualBlue > actualRed
                            ? "blue"
                            : "tie"
                          : null;
                      return (
                        <li
                          key={matchKey}
                          onClick={() => {
                            setSelectedMatch({ matchKey, match });
                          }}
                          style={{
                            marginBottom: "2rem",
                            textAlign: "center",
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            padding: "1rem",
                            background: "var(--background-pred)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 16px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "0.25rem",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.45rem",
                            }}
                          >
                            <span>{matchKey}</span>
                            {hasResult && (
                              <a
                                href={`https://www.thebluealliance.com/match/${matchKey}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: 999,
                                  background: "rgba(255,255,255,0.08)",
                                  color: "var(--gray-less)",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                ▶ TBA
                              </a>
                            )}
                            <span
                              style={{
                                padding: "0.1rem 0.4rem",
                                borderRadius: 999,
                                fontSize: "0.58rem",
                                fontWeight: 700,
                                background: getConfidence(
                                  Number(predRed),
                                  Number(predBlue)
                                ).bg,
                                color: getConfidence(
                                  Number(predRed),
                                  Number(predBlue)
                                ).color,
                              }}
                            >
                              {getConfidence(Number(predRed), Number(predBlue))
                                .label}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "0.35rem",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                background: "rgba(255, 77, 77, 0.05)",
                                padding: "0.35rem",
                                borderRadius: 4,
                                border: "1px solid rgba(255, 77, 77, 0.2)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: "700",
                                  color: "#ff4d4d",
                                  marginBottom: "0.25rem",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                RED
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {match.red.map((t) => {
                                  const isHighlighted =
                                    filterTeam &&
                                    t
                                      .toLowerCase()
                                      .includes(filterTeam.toLowerCase());
                                  return (
                                    <span
                                      key={t}
                                      style={{
                                        background: isHighlighted
                                          ? "var(--predicted-win-highlight)"
                                          : "rgba(255, 77, 77, 0.15)",
                                        color: isHighlighted
                                          ? "#000"
                                          : "#ff6666",
                                        padding: "0.2rem 0.4rem",
                                        borderRadius: 3,
                                        fontWeight: isHighlighted
                                          ? "bold"
                                          : "600",
                                        border: isHighlighted
                                          ? "2px solid var(--yellow-color)"
                                          : "1px solid rgba(255, 77, 77, 0.3)",
                                        transition: "all 0.2s",
                                        textAlign: "center",
                                      }}
                                    >
                                      <TeamLink teamKey={t} year={2026} />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div
                              style={{
                                flex: 1,
                                background: "rgba(77, 140, 255, 0.05)",
                                padding: "0.35rem",
                                borderRadius: 4,
                                border: "1px solid rgba(77, 140, 255, 0.2)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: "700",
                                  color: "#4d8cff",
                                  marginBottom: "0.25rem",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                BLUE
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {match.blue.map((t) => {
                                  const isHighlighted =
                                    filterTeam &&
                                    t
                                      .toLowerCase()
                                      .includes(filterTeam.toLowerCase());
                                  return (
                                    <span
                                      key={t}
                                      style={{
                                        background: isHighlighted
                                          ? "var(--predicted-win-highlight)"
                                          : "rgba(77, 140, 255, 0.15)",
                                        color: isHighlighted
                                          ? "#000"
                                          : "#6699ff",
                                        padding: "0.2rem 0.4rem",
                                        borderRadius: 3,
                                        fontWeight: isHighlighted
                                          ? "bold"
                                          : "600",
                                        border: isHighlighted
                                          ? "2px solid var(--yellow-color)"
                                          : "1px solid rgba(77, 140, 255, 0.3)",
                                        transition: "all 0.2s",
                                        textAlign: "center",
                                      }}
                                    >
                                      <TeamLink teamKey={t} year={2026} />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              marginBottom: "0.2rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.35rem",
                              maxWidth: 320,
                              marginInline: "auto",
                            }}
                          >
                            <div>
                              <strong
                                style={{ fontSize: "0.65rem", marginRight: 2 }}
                              >
                                Pred:
                              </strong>
                              <span style={{ color: "#ff4d4d" }}>
                                {Math.round(Number(predRed))}
                              </span>{" "}
                              --{" "}
                              <span style={{ color: "#4d8cff" }}>
                                {Math.round(Number(predBlue))}
                              </span>
                              <span
                                style={{
                                  marginLeft: 8,
                                  color: "var(--gray-less)",
                                  fontSize: "0.62rem",
                                }}
                              >
                                (Δ {Math.abs(Number(predRed) - Number(predBlue)).toFixed(0)})
                              </span>
                            </div>
                            {hasResult && (
                              <div>
                                <strong
                                  style={{ fontSize: "0.6rem", marginRight: 2 }}
                                >
                                  Real:
                                </strong>
                                <span style={{ color: "#ff4d4d" }}>
                                  {actualRed}
                                </span>{" "}
                                --{" "}
                                <span style={{ color: "#4d8cff" }}>
                                  {actualBlue}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              marginBottom: hasResult ? "0.2rem" : "0",
                              fontSize: "0.7rem",
                            }}
                          >
                            Predicted winner:{" "}
                            <span
                              style={{
                                fontWeight: "bold",
                                color:
                                  predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                                background: "var(--background)",
                                padding: "0.1em 0.4em",
                                borderRadius: 2,
                              }}
                            >
                              {predWinner === "red" ? "Red" : "Blue"}
                            </span>
                          </div>
                          {hasResult && (
                            <div>
                              Winner:{" "}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color:
                                    actualWinner === "red"
                                      ? "#ff4d4d"
                                      : actualWinner === "blue"
                                      ? "#4d8cff"
                                      : "#aaa",
                                  background: "var(--background)",
                                  padding: "0.1em 0.4em",
                                  borderRadius: 2,
                                }}
                              >
                                {actualWinner === "tie"
                                  ? "Tie"
                                  : actualWinner === "red"
                                  ? "Red"
                                  : "Blue"}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {qualsEntries.length === 0 && (
                      <div
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: "var(--gray-less)",
                          background: "var(--background-pred)",
                          borderRadius: 12,
                          border: "2px solid var(--border-color)",
                        }}
                      >
                        No qualification matches found
                      </div>
                    )}
                  </ul>
                </div>

                <div>
                  <h3
                    style={{
                      color: "var(--yellow-color)",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    Elimination Matches ({elimsEntries.length})
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {elimsEntries.map(([matchKey, match]) => {
                      const [predRed, predBlue] = match.preds;
                      const predWinner =
                        Number(predRed) > Number(predBlue) ? "red" : "blue";
                      const hasResult =
                        match.result && match.result.length === 2;
                      const [actualRed, actualBlue] = hasResult
                        ? match.result
                        : [null, null];
                      const actualWinner =
                        hasResult && actualRed !== null && actualBlue !== null
                          ? actualRed > actualBlue
                            ? "red"
                            : actualBlue > actualRed
                            ? "blue"
                            : "tie"
                          : null;
                      return (
                        <li
                          key={matchKey}
                          onClick={() => {
                            setSelectedMatch({ matchKey, match });
                          }}
                          style={{
                            marginBottom: "2rem",
                            textAlign: "center",
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            padding: "1rem",
                            background: "var(--background-pred)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 16px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "0.25rem",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.45rem",
                            }}
                          >
                            <span>{matchKey}</span>
                            {hasResult && (
                              <a
                                href={`https://www.thebluealliance.com/match/${matchKey}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: 999,
                                  background: "rgba(255,255,255,0.08)",
                                  color: "var(--gray-less)",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                ▶ TBA
                              </a>
                            )}
                            <span
                              style={{
                                padding: "0.1rem 0.4rem",
                                borderRadius: 999,
                                fontSize: "0.58rem",
                                fontWeight: 700,
                                background: getConfidence(
                                  Number(predRed),
                                  Number(predBlue)
                                ).bg,
                                color: getConfidence(
                                  Number(predRed),
                                  Number(predBlue)
                                ).color,
                              }}
                            >
                              {getConfidence(Number(predRed), Number(predBlue))
                                .label}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              gap: "0.35rem",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                background: "rgba(255, 77, 77, 0.05)",
                                padding: "0.35rem",
                                borderRadius: 4,
                                border: "1px solid rgba(255, 77, 77, 0.2)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: "700",
                                  color: "#ff4d4d",
                                  marginBottom: "0.25rem",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                RED
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {match.red.map((t) => {
                                  const isHighlighted =
                                    filterTeam &&
                                    t
                                      .toLowerCase()
                                      .includes(filterTeam.toLowerCase());
                                  return (
                                    <span
                                      key={t}
                                      style={{
                                        background: isHighlighted
                                          ? "var(--predicted-win-highlight)"
                                          : "rgba(255, 77, 77, 0.15)",
                                        color: isHighlighted
                                          ? "#000"
                                          : "#ff6666",
                                        padding: "0.2rem 0.4rem",
                                        borderRadius: 3,
                                        fontWeight: isHighlighted
                                          ? "bold"
                                          : "600",
                                        border: isHighlighted
                                          ? "2px solid var(--yellow-color)"
                                          : "1px solid rgba(255, 77, 77, 0.3)",
                                        transition: "all 0.2s",
                                        textAlign: "center",
                                      }}
                                    >
                                      <TeamLink teamKey={t} year={2026} />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div
                              style={{
                                flex: 1,
                                background: "rgba(77, 140, 255, 0.05)",
                                padding: "0.35rem",
                                borderRadius: 4,
                                border: "1px solid rgba(77, 140, 255, 0.2)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.55rem",
                                  fontWeight: "700",
                                  color: "#4d8cff",
                                  marginBottom: "0.25rem",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                BLUE
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                  flexWrap: "wrap",
                                  gap: "0.25rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {match.blue.map((t) => {
                                  const isHighlighted =
                                    filterTeam &&
                                    t
                                      .toLowerCase()
                                      .includes(filterTeam.toLowerCase());
                                  return (
                                    <span
                                      key={t}
                                      style={{
                                        background: isHighlighted
                                          ? "var(--predicted-win-highlight)"
                                          : "rgba(77, 140, 255, 0.15)",
                                        color: isHighlighted
                                          ? "#000"
                                          : "#6699ff",
                                        padding: "0.2rem 0.4rem",
                                        borderRadius: 3,
                                        fontWeight: isHighlighted
                                          ? "bold"
                                          : "600",
                                        border: isHighlighted
                                          ? "2px solid var(--yellow-color)"
                                          : "1px solid rgba(77, 140, 255, 0.3)",
                                        transition: "all 0.2s",
                                        textAlign: "center",
                                      }}
                                    >
                                      <TeamLink teamKey={t} year={2026} />
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              marginBottom: "0.2rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "0.35rem",
                              maxWidth: 320,
                              marginInline: "auto",
                            }}
                          >
                            <div>
                              <strong
                                style={{ fontSize: "0.65rem", marginRight: 2 }}
                              >
                                Pred:
                              </strong>
                              <span style={{ color: "#ff4d4d" }}>
                                {Math.round(Number(predRed))}
                              </span>{" "}
                              --{" "}
                              <span style={{ color: "#4d8cff" }}>
                                {Math.round(Number(predBlue))}
                              </span>
                              <span
                                style={{
                                  marginLeft: 8,
                                  color: "var(--gray-less)",
                                  fontSize: "0.62rem",
                                }}
                              >
                                (Δ {Math.abs(Number(predRed) - Number(predBlue)).toFixed(0)})
                              </span>
                            </div>
                            {hasResult && (
                              <div>
                                <strong
                                  style={{ fontSize: "0.6rem", marginRight: 2 }}
                                >
                                  Real:
                                </strong>
                                <span style={{ color: "#ff4d4d" }}>
                                  {actualRed}
                                </span>{" "}
                                --{" "}
                                <span style={{ color: "#4d8cff" }}>
                                  {actualBlue}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              marginBottom: hasResult ? "0.2rem" : "0",
                              fontSize: "0.7rem",
                            }}
                          >
                            Predicted winner:{" "}
                            <span
                              style={{
                                fontWeight: "bold",
                                color:
                                  predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                                background: "var(--background)",
                                padding: "0.1em 0.4em",
                                borderRadius: 2,
                              }}
                            >
                              {predWinner === "red" ? "Red" : "Blue"}
                            </span>
                          </div>
                          {hasResult && (
                            <div>
                              Winner:{" "}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color:
                                    actualWinner === "red"
                                      ? "#ff4d4d"
                                      : actualWinner === "blue"
                                      ? "#4d8cff"
                                      : "#aaa",
                                  background: "var(--background)",
                                  padding: "0.1em 0.4em",
                                  borderRadius: 2,
                                }}
                              >
                                {actualWinner === "tie"
                                  ? "Tie"
                                  : actualWinner === "red"
                                  ? "Red"
                                  : "Blue"}
                              </span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {elimsEntries.length === 0 && (
                      <div
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: "var(--gray-less)",
                          background: "var(--background-pred)",
                          borderRadius: 12,
                          border: "2px solid var(--border-color)",
                        }}
                      >
                        No elimination matches found
                      </div>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <style jsx>{`
              .mobile-matches-list {
                display: block;
              }
              .desktop-matches-container {
                display: none;
              }
              @media (min-width: 768px) {
                .mobile-matches-list {
                  display: none !important;
                }
                .desktop-matches-container {
                  display: block !important;
                }
              }
            `}</style>
          </div>
        )}

        {activeTab === "rankings" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "var(--foreground)",
              borderRadius: 12,
              width: "100%",
              marginTop: "1rem",
            }}
          >
            <h2 style={{ color: "var(--foreground)" }}>
              Predicted Qualification Rankings
            </h2>
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                borderRadius: 12,
                border: "2px solid var(--border-color)",
                boxShadow:
                  "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "760px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--gray-more)",
                      borderBottom: "2px solid var(--border-color)",
                    }}
                  >
                    {[
                      "Rank",
                      "Team",
                      "Current RP",
                      "Forecast RP",
                      "W",
                      "L",
                      "T",
                      "Played",
                    ].map(
                      (header) => (
                        <th
                          key={header}
                          style={{
                            padding: "0.9rem",
                            textAlign: "left",
                            fontWeight: "700",
                            fontSize: "0.875rem",
                            letterSpacing: "0.05em",
                            color: "var(--yellow-color)",
                          }}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {projectedRankings.map((row) => (
                    <tr
                      key={row.teamKey}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        background: "var(--background-pred)",
                      }}
                    >
                      <td style={{ padding: "0.85rem", fontWeight: "700" }}>
                        {row.rank}
                      </td>
                      <td style={{ padding: "0.85rem", fontWeight: "600" }}>
                        <TeamLink teamKey={row.teamKey} year={2026} />
                      </td>
                      <td style={{ padding: "0.85rem", fontWeight: "700" }}>
                        {row.currentRp.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem",
                          fontWeight: "700",
                          color: "var(--yellow-color)",
                        }}
                      >
                        {row.forecastRp.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.85rem" }}>
                        {Number(row.wins).toFixed(1)}
                      </td>
                      <td style={{ padding: "0.85rem" }}>
                        {Number(row.losses).toFixed(1)}
                      </td>
                      <td style={{ padding: "0.85rem" }}>{row.ties}</td>
                      <td style={{ padding: "0.85rem" }}>{row.played}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedMatch && isDesktop && (
          <MatchDetailModal
            matchKey={selectedMatch.matchKey}
            year="2026"
            match={selectedMatch.match}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </main>
    </div>
  );
}
