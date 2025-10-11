"use client";
/* eslint-disable */

import { useState, useEffect, useRef, lazy, Suspense } from "react";
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
  teamsf: { [key: string]: any };
  matchPredictions: MatchPredictions;
  matches: any[];
  playedMatches: number;
  actualAlliances: any[] | null;
}

export default function ClientPage({
  havePreds,
  eventCode,
  teams,
  teamsf,
  matchPredictions,
  matches,
  playedMatches,
  actualAlliances,
}: ClientPageProps) {
  console.log("actualAlliances received:", actualAlliances);
  console.log("Event code:", eventCode);

  const [activeTab, setActiveTab] = useState<"stats" | "preds" | "alliances">(
    "stats"
  );
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

  const makeInput = (alliance: any[], compLevel: any, match: any) =>
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

  const [alliances, setAlliances] = useState<any[]>([
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
    ["0", "0", "0"],
  ]);

  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [actualScores, setActualScores] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const [alliancesReady, setAlliancesReady] = useState(false);
  const [allianceError, setAllianceError] = useState<string | null>(null);
  const [allianceProgress, setAllianceProgress] = useState<string>("");
  const hasRunPredictions = useRef(false);
  const isCompleted = useRef(false);

  useEffect(() => {
    async function runPredictions() {
      if (hasRunPredictions.current) {
        return;
      }

      if (!sessionReady || playedMatches <= 15) {
        console.log("Alliance predictions not running:", {
          sessionReady,
          playedMatches,
        });
        return;
      }

      console.log("Starting alliance prediction computation...");
      hasRunPredictions.current = true;
      setAllianceProgress("Initializing alliance predictions...");

      /*
      for (const match of matches) {
        let compLevel = 0;
        if (match.comp_level === "qm") compLevel = 1;
        else if (match.comp_level === "sf") compLevel = 2;
        else if (match.comp_level === "f") compLevel = 3;

        const blue = match.alliances.blue.team_keys.map((key: string) =>
          teams.find((t) => t.key === key)
        );
        const red = match.alliances.red.team_keys.map((key: string) =>
          teams.find((t) => t.key === key)
        );

        if ([...blue, ...red].some((t) => !t)) continue;

        if (!matchPredictions[match.key]) continue;

        const redOutput = await runOnnxModel(makeInput(red, compLevel, match));
        const blueOutput = await runOnnxModel(
          makeInput(blue, compLevel, match)
        );

        let avgRedOutput = Number(matchPredictions[match.key].preds[0]);
        let avgBlueOutput = Number(matchPredictions[match.key].preds[1]);

        avgRedOutput = (avgRedOutput + redOutput) / 2;
        avgBlueOutput = (avgBlueOutput + blueOutput) / 2;

        matchPredictions[match.key].preds[0] = avgRedOutput.toFixed(0);
        matchPredictions[match.key].preds[1] = avgBlueOutput.toFixed(0);
      }
      */

      // ----

      try {
        const teamsCopy = [...teams];
        const teamsLeft = [...teamsCopy];
        const sortedTeams = [...teamsCopy].sort(
          (a, b) => Number(b.fsm) - Number(a.fsm)
        );

        console.log("Teams available:", teams.length);

        if (teams.length < 24) {
          console.warn(
            "Not enough teams for alliance prediction (need at least 24)"
          );
          setAllianceError(
            `Not enough teams (${teams.length}/24 minimum required)`
          );
          setAlliancesReady(true);
          isCompleted.current = true;
          return;
        }

        const zeroTeamKey = sortedTeams[sortedTeams.length - 1].key;
        const zeroTeam = teams.find((team) => team.key === zeroTeamKey);

        if (!zeroTeam) {
          console.error("Could not find zero team");
          setAllianceError("Unable to find reference team for predictions");
          setAlliancesReady(true);
          isCompleted.current = true;
          return;
        }

        teamsLeft.sort((a, b) => Number(a.rank) - Number(b.rank));

        const newAlliances: any[] = [
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
          ["0", "0", "0"],
        ];
        const newScores: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

        setAllianceProgress("Selecting alliance captains and first picks...");
        console.log(
          `Starting first pass with ${sortedTeams.length} teams available`
        );

        for (let i = 0; i < 8; i++) {
          console.log(`\nProcessing alliance ${i + 1}:`);
          console.log(`  - Teams left: ${teamsLeft.length}`);
          console.log(`  - Sorted teams available: ${sortedTeams.length}`);

          const cap = teamsLeft.shift();
          if (!cap) {
            console.error(`No captain available for alliance ${i + 1}`);
            break;
          }

          console.log(`  - Captain: ${cap.key} (FSM: ${cap.fsm})`);

          const capIdx = sortedTeams.findIndex((team) => team.key === cap.key);
          if (capIdx !== -1) sortedTeams.splice(capIdx, 1);

          const leftIdx = teamsLeft.findIndex((team) => team.key === cap.key);
          if (leftIdx !== -1) teamsLeft.splice(leftIdx, 1);

          let maxMpred = -1.0;
          let pick = "0";
          const maxTeamsToCheck = Math.min(4, sortedTeams.length);

          console.log(`  - Checking ${maxTeamsToCheck} potential picks`);

          for (let j = 0; j < maxTeamsToCheck; j++) {
            const team2 = sortedTeams[j];
            if (!team2) {
              console.warn(`    Team at index ${j} is undefined/null`);
              continue;
            }

            if (
              isNaN(Number(team2.fsm)) ||
              isNaN(Number(team2.algae)) ||
              isNaN(Number(team2.coral)) ||
              isNaN(Number(team2.auto)) ||
              isNaN(Number(team2.climb))
            ) {
              console.warn(`    Team ${team2.key} has invalid data, skipping`);
              continue;
            }

            const tempally = [cap, team2, zeroTeam];
            try {
              let mpred = await runOnnxModel(
                makeInput(tempally, 2, { match_number: 2 })
              );
              const pred2 =
                Number(cap.fsm) + Number(team2.fsm) + Number(zeroTeam.fsm);
              mpred = (mpred + pred2) / 2.0;
              if (mpred > maxMpred) {
                newAlliances[i] = [cap.key, team2.key, zeroTeam.key];
                pick = team2.key;
                maxMpred = mpred;
              }
            } catch (err) {
              console.error(`Error predicting for team ${team2.key}:`, err);
            }
          }

          if (pick !== "0") {
            const pickIdx = sortedTeams.findIndex((team) => team.key === pick);
            if (pickIdx !== -1) sortedTeams.splice(pickIdx, 1);

            const leftPickIdx = teamsLeft.findIndex(
              (team) => team.key === pick
            );
            if (leftPickIdx !== -1) teamsLeft.splice(leftPickIdx, 1);
          } else {
            console.warn(`  - No valid pick found for alliance ${i + 1}!`);
          }

          console.log(`Alliance ${i + 1}: Captain ${cap.key}, Pick 1: ${pick}`);
          setAllianceProgress(`Alliance ${i + 1} of 8: Captain selected`);
        }

        setAllianceProgress("Selecting second picks for all alliances...");
        console.log(
          `\nStarting second pass with ${sortedTeams.length} teams available`
        );

        for (let i = 7; i >= 0; i--) {
          console.log(`\nProcessing second pick for alliance ${i + 1}:`);
          console.log(`  - Sorted teams available: ${sortedTeams.length}`);
          console.log(`  - Current alliance: ${newAlliances[i]}`);

          let maxMpred2 = -100;
          let pick = "0";
          const maxTeamsToCheck = Math.min(9, sortedTeams.length);

          console.log(`  - Checking ${maxTeamsToCheck} potential second picks`);

          let validChecks = 0;
          for (let j = 0; j < maxTeamsToCheck; j++) {
            const team3 = sortedTeams[j];
            if (!team3) {
              console.warn(`    Team at index ${j} is undefined/null`);
              continue;
            }

            const tempally0 = [...newAlliances[i]];
            tempally0[2] = team3.key;

            const tempally = tempally0.map((key) =>
              teams.find((t) => t.key === key)
            );

            if (tempally.some((t) => !t)) {
              console.warn(`    Couldn't find all teams for alliance check`);
              continue;
            }

            const allValid = tempally.every(
              (t) =>
                !isNaN(Number(t.fsm)) &&
                !isNaN(Number(t.algae)) &&
                !isNaN(Number(t.coral)) &&
                !isNaN(Number(t.auto)) &&
                !isNaN(Number(t.climb))
            );

            if (!allValid) {
              console.warn(`    Alliance has team with invalid data, skipping`);
              continue;
            }

            validChecks++;
            try {
              let mpred = await runOnnxModel(
                makeInput(tempally, 2, { match_number: 2 })
              );
              const pred2 =
                Number(tempally[0].fsm) +
                Number(tempally[1].fsm) +
                Number(tempally[2].fsm);
              mpred = (mpred + pred2) / 2.0;
              if (mpred > maxMpred2) {
                newAlliances[i][2] = team3.key;
                pick = team3.key;
                maxMpred2 = mpred;
                newScores[i] = mpred;
              }
            } catch (err) {
              console.error(
                `Error predicting second pick for alliance ${i + 1}:`,
                err
              );
            }
          }

          console.log(`  - Valid checks performed: ${validChecks}`);

          if (pick !== "0") {
            const pickIdx = sortedTeams.findIndex((team) => team.key === pick);
            if (pickIdx !== -1) sortedTeams.splice(pickIdx, 1);
          } else {
            console.warn(
              `  - No valid second pick found for alliance ${i + 1}!`
            );
          }

          console.log(
            `Alliance ${i + 1} complete: Pick 2: ${pick}, Score: ${newScores[
              i
            ].toFixed(1)}`
          );
          setAllianceProgress(`Alliance ${8 - i} of 8: Second pick selected`);
        }

        setAlliances(newAlliances);
        setScores(newScores);
        setAllianceError(null);

        if (actualAlliances && actualAlliances.length > 0) {
          console.log(
            "\n🔄 Computing predicted scores for actual alliances..."
          );
          const actualPredictedScores: number[] = [];

          for (let i = 0; i < Math.min(8, actualAlliances.length); i++) {
            const actualAlliance = actualAlliances[i];
            if (
              !actualAlliance ||
              !actualAlliance.picks ||
              actualAlliance.picks.length < 3
            ) {
              actualPredictedScores.push(0);
              continue;
            }

            const allianceTeamKeys = actualAlliance.picks.slice(0, 3);
            const allianceTeams = allianceTeamKeys.map((key: string) =>
              teams.find((t) => t.key === key)
            );

            if (
              allianceTeams.some((t: any) => !t) ||
              allianceTeams.some(
                (t: any) =>
                  isNaN(Number(t.fsm)) ||
                  isNaN(Number(t.algae)) ||
                  isNaN(Number(t.coral)) ||
                  isNaN(Number(t.auto)) ||
                  isNaN(Number(t.climb))
              )
            ) {
              console.warn(
                `Skipping actual alliance ${i + 1} - invalid team data`
              );
              actualPredictedScores.push(0);
              continue;
            }

            try {
              let mpred = await runOnnxModel(
                makeInput(allianceTeams, 2, { match_number: 2 })
              );
              const pred2 = allianceTeams.reduce(
                (sum: number, t: any) => sum + Number(t.fsm),
                0
              );
              mpred = (mpred + pred2) / 2.0;
              actualPredictedScores.push(mpred);
              console.log(
                `  Alliance ${i + 1} (${allianceTeamKeys.join(
                  ", "
                )}): ${mpred.toFixed(1)}`
              );
            } catch (err) {
              console.error(
                `Error predicting score for actual alliance ${i + 1}:`,
                err
              );
              actualPredictedScores.push(0);
            }
          }

          // Fill remaining slots if less than 8 alliances
          while (actualPredictedScores.length < 8) {
            actualPredictedScores.push(0);
          }

          setActualScores(actualPredictedScores);
          console.log(
            "✅ Actual alliance predicted scores:",
            actualPredictedScores
          );
        }

        setAlliancesReady(true);
        isCompleted.current = true;
        console.log("✅ Alliance predictions complete!");
        console.log("Predicted alliances:", newAlliances);
        console.log("Predicted scores:", newScores);
      } catch (error) {
        console.error("Error computing alliance predictions:", error);
        setAllianceError(
          error instanceof Error
            ? error.message
            : "An error occurred while computing predictions"
        );
        setAlliancesReady(true);
        isCompleted.current = true;
      }
    }

    const timeoutId = setTimeout(() => {
      if (hasRunPredictions.current && !isCompleted.current) {
        console.error("Alliance prediction timeout - taking too long");
        setAllianceError(
          "Prediction computation timed out. Please refresh the page."
        );
        setAlliancesReady(true);
        hasRunPredictions.current = false;
        isCompleted.current = true;
      }
    }, 30000); // 30 second timeout

    runPredictions().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [sessionReady, playedMatches, teams]);

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
          <button
            onClick={() => setActiveTab("alliances")}
            disabled={!havePreds}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "alliances" ? "#333" : "#222",
              color: havePreds
                ? activeTab === "alliances"
                  ? "#fff"
                  : "#ccc"
                : "#888",
              border: "1px solid #555",
              cursor: havePreds ? "pointer" : "not-allowed",
            }}
          >
            Alliance Selection
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

        {activeTab === "alliances" && (
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
            <h2 style={{ color: "var(--foreground)" }}>
              Alliance Selection Predictions
            </h2>
            {!havePreds ? (
              <p
                style={{
                  color: "var(--foreground)",
                  fontSize: "0.95rem",
                  marginTop: "0.5rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                  maxWidth: "600px",
                }}
              >
                Alliance predictions are not available for this event yet.
              </p>
            ) : (
              <>
                <p
                  style={{
                    color: "var(--foreground)",
                    fontSize: "0.95rem",
                    marginTop: "0.5rem",
                    marginBottom: actualAlliances ? "0.5rem" : "1.5rem",
                    textAlign: "center",
                    maxWidth: "600px",
                    padding: "0 1rem",
                  }}
                >
                  {!alliancesReady && playedMatches > 15
                    ? "Computing alliance predictions..."
                    : playedMatches <= 15
                    ? "Alliance predictions will be available after 15+ matches have been played."
                    : "Predicted alliances based on team performance and strategic selection algorithm."}
                </p>
                {actualAlliances &&
                  alliancesReady &&
                  (() => {
                    let totalCorrect = 0;
                    let totalPicks = 0;
                    let perfectAlliances = 0;
                    let totalScoreDiff = 0;
                    let validScoreComparisons = 0;

                    alliances.forEach((alliance, idx) => {
                      const actualAlliance = actualAlliances[idx];
                      if (actualAlliance && actualAlliance.picks) {
                        const actualKeys = actualAlliance.picks;
                        let allianceMatches = 0;
                        for (let i = 0; i < 3; i++) {
                          totalPicks++;
                          if (alliance[i] === actualKeys[i]) {
                            totalCorrect++;
                            allianceMatches++;
                          }
                        }
                        if (allianceMatches === 3) perfectAlliances++;

                        if (scores[idx] > 0 && actualScores[idx] > 0) {
                          totalScoreDiff += actualScores[idx] - scores[idx];
                          validScoreComparisons++;
                        }
                      }
                    });

                    const accuracy =
                      totalPicks > 0 ? (totalCorrect / totalPicks) * 100 : 0;
                    const avgScoreDiff =
                      validScoreComparisons > 0
                        ? totalScoreDiff / validScoreComparisons
                        : 0;

                    return (
                      <div
                        style={{
                          background: "var(--background-pred)",
                          border: "2px solid var(--border-color)",
                          borderRadius: 12,
                          padding: "1rem 1.5rem",
                          marginBottom: "1.5rem",
                          maxWidth: "600px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-around",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem",
                          }}
                        >
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: "var(--yellow-color)",
                              }}
                            >
                              {accuracy.toFixed(1)}%
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--gray-less)",
                              }}
                            >
                              Overall Accuracy
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-less)",
                                marginTop: "0.25rem",
                              }}
                            >
                              {totalCorrect} / {totalPicks} picks
                            </div>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <div
                              style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: "#22c55e",
                              }}
                            >
                              {perfectAlliances}
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--gray-less)",
                              }}
                            >
                              Perfect Alliances
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--gray-less)",
                                marginTop: "0.25rem",
                              }}
                            >
                              out of 8
                            </div>
                          </div>
                          {validScoreComparisons > 0 && (
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: "2rem",
                                  fontWeight: "bold",
                                  color:
                                    avgScoreDiff > 0
                                      ? "#22c55e"
                                      : avgScoreDiff < 0
                                      ? "#f59e0b"
                                      : "var(--foreground)",
                                }}
                              >
                                {avgScoreDiff > 0 ? "+" : ""}
                                {avgScoreDiff.toFixed(1)}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "var(--gray-less)",
                                }}
                              >
                                Avg Score Diff
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--gray-less)",
                                  marginTop: "0.25rem",
                                }}
                              >
                                {avgScoreDiff > 0
                                  ? "Actual better"
                                  : avgScoreDiff < 0
                                  ? "Predicted better"
                                  : "Equal"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}

            {allianceError ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--foreground)",
                  fontSize: "1rem",
                  border: "2px solid #ff6b6b",
                  borderRadius: 12,
                  background: "rgba(255, 107, 107, 0.1)",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
                <h3 style={{ marginBottom: "0.5rem" }}>
                  Unable to Generate Predictions
                </h3>
                <p style={{ color: "var(--gray-less)" }}>{allianceError}</p>
              </div>
            ) : havePreds && alliancesReady && playedMatches > 15 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.5rem",
                  width: "100%",
                  maxWidth: "1200px",
                  padding: "0 1rem",
                }}
              >
                {alliances.map((alliance, idx) => {
                  const allianceTeams = alliance.map((teamKey: string) =>
                    teams.find((t) => t.key === teamKey)
                  );

                  const actualAlliance = actualAlliances?.[idx];
                  const actualTeamKeys = actualAlliance?.picks || [];

                  if (idx === 0) {
                    console.log("Alliance comparison check:");
                    console.log("  - actualAlliances:", actualAlliances);
                    console.log("  - actualAlliance[0]:", actualAlliance);
                    console.log("  - actualTeamKeys[0]:", actualTeamKeys);
                  }

                  const captainMatch = alliance[0] === actualTeamKeys[0];
                  const firstPickMatch = alliance[1] === actualTeamKeys[1];
                  const secondPickMatch = alliance[2] === actualTeamKeys[2];
                  const totalMatches = [
                    captainMatch,
                    firstPickMatch,
                    secondPickMatch,
                  ].filter(Boolean).length;
                  const hasActual = actualAlliance && actualTeamKeys.length > 0;

                  if (idx === 0 && hasActual) {
                    console.log("  - Predicted:", alliance);
                    console.log("  - Actual:", actualTeamKeys);
                    console.log("  - Matches:", totalMatches);
                  }

                  return (
                    <div
                      key={idx}
                      style={{
                        border: hasActual
                          ? totalMatches === 3
                            ? "2px solid #22c55e"
                            : totalMatches >= 1
                            ? "2px solid #f59e0b"
                            : "2px solid #ef4444"
                          : "2px solid var(--border-color)",
                        borderRadius: 12,
                        padding: "1.25rem",
                        background: "var(--background-pred)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                        boxShadow:
                          "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 10px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: "0.5rem",
                          borderBottom: "1px solid var(--border-color)",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "var(--yellow-color)",
                          }}
                        >
                          Alliance {idx + 1}
                          {hasActual && (
                            <span
                              style={{
                                marginLeft: "0.5rem",
                                fontSize: "1rem",
                              }}
                            >
                              {totalMatches === 3
                                ? "✅"
                                : totalMatches >= 1
                                ? "⚠️"
                                : "❌"}
                            </span>
                          )}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              background: "var(--gray-more)",
                              padding: "0.25rem 0.75rem",
                              borderRadius: 6,
                              fontSize: "0.875rem",
                              fontWeight: "600",
                            }}
                          >
                            Seed {idx + 1}
                          </div>
                          {hasActual && (
                            <div
                              style={{
                                background:
                                  totalMatches === 3
                                    ? "rgba(34, 197, 94, 0.2)"
                                    : totalMatches >= 1
                                    ? "rgba(245, 158, 11, 0.2)"
                                    : "rgba(239, 68, 68, 0.2)",
                                color:
                                  totalMatches === 3
                                    ? "#22c55e"
                                    : totalMatches >= 1
                                    ? "#f59e0b"
                                    : "#ef4444",
                                padding: "0.25rem 0.75rem",
                                borderRadius: 6,
                                fontSize: "0.75rem",
                                fontWeight: "700",
                              }}
                            >
                              {totalMatches}/3 Correct
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {allianceTeams.map((team: any, teamIdx: number) => {
                          if (!team) return null;
                          const role =
                            teamIdx === 0
                              ? "Captain"
                              : teamIdx === 1
                              ? "1st Pick"
                              : "2nd Pick";

                          // Check if this specific pick matches the actual alliance
                          const isCorrectPick =
                            hasActual &&
                            alliance[teamIdx] === actualTeamKeys[teamIdx];
                          const actualTeam =
                            hasActual && actualTeamKeys[teamIdx]
                              ? teams.find(
                                  (t: any) => t.key === actualTeamKeys[teamIdx]
                                )
                              : null;

                          return (
                            <div
                              key={team.key}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.5rem",
                                background:
                                  teamIdx === 0
                                    ? "var(--gray-more)"
                                    : "transparent",
                                borderRadius: 6,
                                border:
                                  teamIdx === 0
                                    ? "1px solid var(--border-color)"
                                    : hasActual && !isCorrectPick
                                    ? "1px dashed #ef4444"
                                    : "none",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.125rem",
                                  flex: 1,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--gray-less)",
                                    fontWeight: "600",
                                  }}
                                >
                                  {role}{" "}
                                  {hasActual && (isCorrectPick ? "✓" : "✗")}
                                </span>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "var(--gray-less)",
                                      }}
                                    >
                                      Pred:
                                    </span>
                                    <TeamLink teamKey={team.key} year={2025} />
                                  </div>
                                  {hasActual &&
                                    !isCorrectPick &&
                                    actualTeam && (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "0.25rem",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#22c55e",
                                          }}
                                        >
                                          Real:
                                        </span>
                                        <TeamLink
                                          teamKey={actualTeam.key}
                                          year={2025}
                                        />
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  gap: "0.125rem",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "bold",
                                    color: "var(--yellow-color)",
                                  }}
                                >
                                  {Number(team.fsm).toFixed(1)} FSM
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--gray-less)",
                                  }}
                                >
                                  Rank #{team.rank}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          marginTop: "0.5rem",
                          paddingTop: "0.75rem",
                          borderTop: "1px solid var(--border-color)",
                          display: "flex",
                          flexDirection: hasActual ? "column" : "row",
                          justifyContent: "space-between",
                          alignItems: hasActual ? "stretch" : "center",
                          gap: hasActual ? "0.5rem" : "0",
                        }}
                      >
                        {!hasActual ? (
                          <>
                            <span
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "var(--foreground)",
                              }}
                            >
                              Predicted Score
                            </span>
                            <span
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                                color: "var(--yellow-color)",
                              }}
                            >
                              {scores[idx] > 0 ? scores[idx].toFixed(1) : "—"}
                            </span>
                          </>
                        ) : (
                          <>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                  color: "var(--foreground)",
                                }}
                              >
                                Predicted Alliance Score
                              </span>
                              <span
                                style={{
                                  fontSize: "1.25rem",
                                  fontWeight: "bold",
                                  color: "var(--yellow-color)",
                                }}
                              >
                                {scores[idx] > 0 ? scores[idx].toFixed(1) : "—"}
                              </span>
                            </div>
                            {actualScores[idx] > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "0.5rem",
                                  borderTop: "1px dashed var(--border-color)",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: "600",
                                    color: "#22c55e",
                                  }}
                                >
                                  Actual Alliance Score
                                </span>
                                <span
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: "bold",
                                    color: "#22c55e",
                                  }}
                                >
                                  {actualScores[idx].toFixed(1)}
                                </span>
                              </div>
                            )}
                            {actualScores[idx] > 0 && scores[idx] > 0 && (
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--gray-less)",
                                  textAlign: "center",
                                  marginTop: "0.25rem",
                                }}
                              >
                                {actualScores[idx] > scores[idx]
                                  ? `Actual +${(
                                      actualScores[idx] - scores[idx]
                                    ).toFixed(1)} better`
                                  : actualScores[idx] < scores[idx]
                                  ? `Predicted +${(
                                      scores[idx] - actualScores[idx]
                                    ).toFixed(1)} better`
                                  : "Equal scores"}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : havePreds && playedMatches <= 15 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--gray-less)",
                  fontSize: "1rem",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏱️</div>
                <p>Waiting for more match data...</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  {playedMatches} / 15 matches played
                </p>
              </div>
            ) : havePreds && !alliancesReady && playedMatches > 15 ? (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <LoadingSpinner
                  message={
                    allianceProgress || "Computing alliance predictions..."
                  }
                />
                {allianceProgress && (
                  <p
                    style={{
                      marginTop: "1rem",
                      fontSize: "0.875rem",
                      color: "var(--gray-less)",
                    }}
                  >
                    This may take 30-60 seconds...
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
