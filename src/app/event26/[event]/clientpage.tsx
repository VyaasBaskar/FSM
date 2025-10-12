"use client";
/* eslint-disable */

import { useState, useEffect, useRef } from "react";
import styles from "../../page.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import TeamLink from "@/app/components/TeamLink";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import type * as ort from "onnxruntime-web";

const loadOnnxRuntime = () => import("onnxruntime-web");

const Event25TeamsTable = dynamic(
  () => import("../../components/Event25TeamsTable"),
  {
    loading: () => <LoadingSpinner message="Loading team stats..." />,
    ssr: false,
  }
);

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
}

export default function ClientPage({
  havePreds,
  eventCode,
  teams,
  matchPredictions,
  matches,
  playedMatches,
}: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "preds">("stats");
  const [sessionReady, setSessionReady] = useState(false);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  const [filterText, setFilterText] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterType, setFilterType] = useState<"all" | "quals" | "elims">(
    "all"
  );

  useEffect(() => {
    async function loadModel() {
      try {
        const ort = await loadOnnxRuntime();
        const session = await ort.InferenceSession.create("/matchpred.onnx");
        sessionRef.current = session;
        setSessionReady(true);
      } catch (err) {
        console.error("Failed to load ONNX model:", err);
      }
    }
    if (havePreds) {
      loadModel();
    }
  }, [havePreds]);

  async function runOnnxModel(inputData: Float32Array) {
    if (!sessionRef.current) throw new Error("ONNX session not loaded.");

    const ort = await loadOnnxRuntime();
    const inputTensor = new ort.Tensor("float32", inputData, [1, 17]);
    const feeds: Record<string, typeof inputTensor> = {
      [sessionRef.current.inputNames[0]]: inputTensor,
    };

    const results = await sessionRef.current.run(feeds);
    const output = results[sessionRef.current.outputNames[0]].data;
    return Number(output[0]);
  }

  useEffect(() => {
    async function runPredictions() {
      if (!sessionReady || playedMatches <= 15) return;

      for (const match of matches) {
        let compLevel = 0;
        if (match.comp_level === "qm") compLevel = 1;
        else if (match.comp_level === "ef") compLevel = 2;
        else if (match.comp_level === "f") compLevel = 3;

        const blue = match.alliances.blue.team_keys.map((key: string) =>
          teams.find((t) => t.key === key)
        );
        const red = match.alliances.red.team_keys.map((key: string) =>
          teams.find((t) => t.key === key)
        );

        if ([...blue, ...red].some((t) => !t)) continue;

        // Skip if this match doesn't have predictions
        if (!matchPredictions[match.key]) continue;

        const makeInput = (alliance: any[]) =>
          new Float32Array([
            ...alliance.flatMap((t) => [
              Number(t.fsm),
              Number(t.algae),
              Number(t.coral),
              Number(t.auto),
              Number(t.climb),
            ]),
            compLevel,
            Number(match.match_number),
          ]);

        const redOutput = await runOnnxModel(makeInput(red));
        const blueOutput = await runOnnxModel(makeInput(blue));

        let avgRedOutput = Number(matchPredictions[match.key].preds[0]);
        let avgBlueOutput = Number(matchPredictions[match.key].preds[1]);

        avgRedOutput = (avgRedOutput + redOutput) / 2;
        avgBlueOutput = (avgBlueOutput + blueOutput) / 2;

        matchPredictions[match.key].preds[0] = avgRedOutput.toFixed(0);
        matchPredictions[match.key].preds[1] = avgBlueOutput.toFixed(0);
      }
    }

    runPredictions();
  }, [sessionReady, playedMatches, matches, matchPredictions, teams]);

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

  const filteredEntries = entries.filter(([key, match]) => {
    // Remove year prefix (first 4 digits) when matching
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
    // Remove year prefix (first 4 digits) when matching
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
    // Remove year prefix (first 4 digits) when matching
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
        <h1 className={styles.title}>Event FSM</h1>
        <h2 className={styles.table}>2025{eventCode}</h2>

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
            <h2 style={{ color: "var(--foreground)" }}>Team Stats</h2>
            <br />
            <div
              style={{ maxWidth: "100%", overflowX: "scroll", width: "100%" }}
            >
              <Event25TeamsTable teams={teams} />
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

            {/* Mobile view - single column with filter */}
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
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                      {matchKey}
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
                              <TeamLink teamKey={t} year={2025} />
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
                              <TeamLink teamKey={t} year={2025} />
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

            {/* Desktop view - two columns */}
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
                {/* Quals Column */}
                <div>
                  <h3
                    style={{
                      color: "var(--yellow-color)",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    Qualification Matches
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
                          style={{
                            marginBottom: "2rem",
                            textAlign: "center",
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            padding: "1rem",
                            background: "var(--background-pred)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "0.25rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            {matchKey}
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

                {/* Elims Column */}
                <div>
                  <h3
                    style={{
                      color: "var(--yellow-color)",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    Elimination Matches
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
                          style={{
                            marginBottom: "2rem",
                            textAlign: "center",
                            border: "1px solid var(--border-color)",
                            borderRadius: 8,
                            padding: "1rem",
                            background: "var(--background-pred)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "0.25rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            {matchKey}
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
      </main>
    </div>
  );
}
