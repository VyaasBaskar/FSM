"use client";

import { useState, useEffect, useRef } from "react";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import AllianceCard from "./AllianceCard";
import { AlliancePredictionsProps } from "./types";
import {
  computeAlliancePredictions,
  computeActualAllianceScores,
} from "./allianceUtils";

export default function AlliancePredictions({
  teams,
  playedMatches,
  actualAlliances,
  sessionReady,
  runOnnxModel,
  makeInput,
}: AlliancePredictionsProps) {
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

      try {
        const { alliances: newAlliances, scores: newScores } =
          await computeAlliancePredictions(
            teams,
            runOnnxModel,
            makeInput,
            setAllianceProgress
          );

        setAlliances(newAlliances);
        setScores(newScores);
        setAllianceError(null);

        if (actualAlliances && actualAlliances.length > 0) {
          const actualPredictedScores = await computeActualAllianceScores(
            actualAlliances,
            teams,
            runOnnxModel,
            makeInput
          );
          setActualScores(actualPredictedScores);
        }

        setAlliancesReady(true);
        isCompleted.current = true;
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
    }, 30000);

    runPredictions().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [sessionReady, playedMatches, teams]);

  return (
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
      ) : alliancesReady && playedMatches > 15 ? (
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
          {alliances.map((alliance, idx) => (
            <AllianceCard
              key={idx}
              alliance={alliance}
              idx={idx}
              teams={teams}
              scores={scores}
              actualScores={actualScores}
              actualAlliances={actualAlliances}
            />
          ))}
        </div>
      ) : playedMatches <= 15 ? (
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
      ) : (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <LoadingSpinner
            message={allianceProgress || "Computing alliance predictions..."}
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
      )}
    </div>
  );
}
