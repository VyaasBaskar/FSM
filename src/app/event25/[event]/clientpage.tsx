"use client";
/* eslint-disable */

import { useState, useEffect, useRef } from "react";
import styles from "../../page.module.css";
import Event25TeamsTable from "../../components/Event25TeamsTable";
import Link from "next/link";
import TeamLink from "@/app/components/TeamLink";
import * as ort from "onnxruntime-web";

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
        const session = await ort.InferenceSession.create("/matchpred.onnx");
        sessionRef.current = session;
        setSessionReady(true);
      } catch (err) {
        console.error("Failed to load ONNX model:", err);
      }
    }
    loadModel();
  }, []);

  async function runOnnxModel(inputData: Float32Array) {
    if (!sessionRef.current) throw new Error("ONNX session not loaded.");

    const inputTensor = new ort.Tensor("float32", inputData, [1, 17]);
    const feeds: Record<string, ort.Tensor> = {
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
    const matchNameMatch = key.toLowerCase().includes(filterText.toLowerCase());
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
            Team Stats
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
            Match Predictions
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
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
              <input
                type="text"
                placeholder="Filter by match name"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #555",
                }}
              />
              <input
                type="text"
                placeholder="Filter by team"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #555",
                }}
              />
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "quals" | "elims")
                }
                style={{
                  padding: "0.5rem",
                  borderRadius: 6,
                  border: "1px solid #555",
                }}
              >
                <option value="all">All</option>
                <option value="quals">Quals</option>
                <option value="elims">Elims</option>
              </select>
            </div>

            <ul style={{ listStyle: "none", padding: 10 }}>
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

                const searchedTeamOnRed =
                  filterTeam &&
                  match.red.some((t) =>
                    t.toLowerCase().includes(filterTeam.toLowerCase())
                  );
                const searchedTeamOnBlue =
                  filterTeam &&
                  match.blue.some((t) =>
                    t.toLowerCase().includes(filterTeam.toLowerCase())
                  );
                const highWinner =
                  (searchedTeamOnRed && predWinner === "red") ||
                  (searchedTeamOnBlue && predWinner === "blue");
                const searchedTeamWonActual =
                  (searchedTeamOnRed && actualWinner === "red") ||
                  (searchedTeamOnBlue && actualWinner === "blue");

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
                      position: "relative",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                      {matchKey}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
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
                                  ? "var(--predicted-win-highlight)"
                                  : "transparent",
                                color: isHighlighted ? "#000" : "inherit",
                                padding: isHighlighted ? "0.2em 0.4em" : "0",
                                borderRadius: isHighlighted ? "4px" : "0",
                                fontWeight: isHighlighted ? "bold" : "normal",
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
                                  ? "var(--predicted-win-highlight)"
                                  : "transparent",
                                color: isHighlighted ? "#000" : "inherit",
                                padding: isHighlighted ? "0.2em 0.4em" : "0",
                                borderRadius: isHighlighted ? "4px" : "0",
                                fontWeight: isHighlighted ? "bold" : "normal",
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
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        maxWidth: 320,
                        marginInline: "auto",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.9rem", marginRight: 4 }}>
                          Pred:
                        </strong>
                        <span
                          style={{
                            color: "#ff4d4d",
                            background: searchedTeamOnRed
                              ? "var(--predicted-win-highlight)"
                              : "transparent",
                            padding: searchedTeamOnRed ? "0.2em 0.4em" : "0",
                            borderRadius: searchedTeamOnRed ? "4px" : "0",
                            fontWeight: searchedTeamOnRed ? "bold" : "normal",
                          }}
                        >
                          {predRed}
                        </span>{" "}
                        --{" "}
                        <span
                          style={{
                            color: "#4d8cff",
                            background: searchedTeamOnBlue
                              ? "var(--predicted-win-highlight)"
                              : "transparent",
                            padding: searchedTeamOnBlue ? "0.2em 0.4em" : "0",
                            borderRadius: searchedTeamOnBlue ? "4px" : "0",
                            fontWeight: searchedTeamOnBlue ? "bold" : "normal",
                          }}
                        >
                          {predBlue}
                        </span>
                      </div>
                      {hasResult && (
                        <div>
                          <strong
                            style={{ fontSize: "0.9rem", marginRight: 4 }}
                          >
                            Real:
                          </strong>
                          <span
                            style={{
                              color: "#ff4d4d",
                              background:
                                searchedTeamOnRed && actualRed !== -1
                                  ? "var(--predicted-win-highlight)"
                                  : "transparent",
                              padding:
                                searchedTeamOnRed && actualRed !== -1
                                  ? "0.2em 0.4em"
                                  : "0",
                              borderRadius:
                                searchedTeamOnRed && actualRed !== -1
                                  ? "4px"
                                  : "0",
                              fontWeight:
                                searchedTeamOnRed && actualRed !== -1
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {actualRed}
                          </span>{" "}
                          --{" "}
                          <span
                            style={{
                              color: "#4d8cff",
                              background:
                                searchedTeamOnBlue && actualBlue !== -1
                                  ? "var(--predicted-win-highlight)"
                                  : "transparent",
                              padding:
                                searchedTeamOnBlue && actualBlue !== -1
                                  ? "0.2em 0.4em"
                                  : "0",
                              borderRadius:
                                searchedTeamOnBlue && actualBlue !== -1
                                  ? "4px"
                                  : "0",
                              fontWeight:
                                searchedTeamOnBlue && actualBlue !== -1
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {actualBlue}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: hasResult ? "0.5rem" : "0" }}>
                      Predicted winner:{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          color: predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                          background: highWinner
                            ? "#ffd700"
                            : "var(--background)",
                          padding: "0.2em 0.6em",
                          borderRadius: 4,
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
                            background:
                              (searchedTeamOnRed && actualWinner === "red") ||
                              (searchedTeamOnBlue && actualWinner === "blue")
                                ? "var(--predicted-win-highlight)"
                                : "var(--background)",
                            padding: "0.2em 0.6em",
                            borderRadius: 4,
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
                    {(actualRed === -1 || actualBlue === -1
                      ? highWinner
                      : searchedTeamWonActual) && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "0.5rem",
                          right: "0.5rem",
                        }}
                      >
                        <img
                          src="/logo846.png"
                          alt="Winner"
                          style={{
                            width: "30px",
                            height: "auto",
                          }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
