"use client";
/* eslint-disable */

import { useState } from "react";
import styles from "../../page.module.css";
import Event25TeamsTable from "../../components/Event25TeamsTable";
import Link from "next/link";
import LogoButton from "@/app/components/LogoButton";

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
}

export default function ClientPage({
  havePreds,
  eventCode,
  teams,
  matchPredictions,
}: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "preds">("stats");

  const entries = Object.entries(matchPredictions).sort(([a], [b]) => {
    const getTypeOrder = (key: string) => {
      if (key.includes("_f")) return 2;
      if (key.includes("_sf")) return 1;
      return 0;
    };
    const typeA = getTypeOrder(a);
    const typeB = getTypeOrder(b);

    if (typeA !== typeB) {
      return typeA - typeB;
    }

    const numA = parseInt(a.slice(4).match(/\d+/)?.[0] ?? "0", 10);
    const numB = parseInt(b.slice(4).match(/\d+/)?.[0] ?? "0", 10);

    if (numA === numB) {
      return a.localeCompare(b);
    }
    return numA - numB;
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

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          textDecoration: "none",
          color: "inherit",
          fontSize: "4rem",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
        }}
        aria-label="Back to Home"
      >
        &#8592;
      </Link>

      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Event FSM</h1>
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
            <Event25TeamsTable teams={teams} />
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
            <p style={{ color: "var(--foreground)", fontSize: "1rem", marginTop: "0.2rem" }}>
              Prediction Accuracy: {correctPredictions.length} /{" "}
              {resultsWithGroundTruth.length} ({accuracy.toFixed(1)}%)
            </p>
            <br />
            <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
              {entries.map(([matchKey, match]) => {
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
                      marginBottom: "2rem",
                      textAlign: "center",
                      border: "1px solid var(--border-color)",
                      borderRadius: 8,
                      padding: "1rem",
                      background: "var(--background-pred)",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                      {matchKey}
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>
                        Red
                      </span>{" "}
                      {match.red.join(", ")} {" vs. "}
                      <span style={{ color: "#4d8cff", fontWeight: "bold" }}>
                        Blue
                      </span>{" "}
                      {match.blue.join(", ")}
                    </div>

                    <div
                      style={{
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        width: "100%",
                        maxWidth: 320,
                        marginInline: "auto",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.9rem", marginRight: 4 }}>
                          Pred:
                        </strong>
                        <span style={{ color: "#ff4d4d" }}>{predRed}</span> --{" "}
                        <span style={{ color: "#4d8cff" }}>{predBlue}</span>
                      </div>
                      {hasResult && (
                        <div>
                          <strong
                            style={{ fontSize: "0.9rem", marginRight: 4 }}
                          >
                            Real:
                          </strong>
                          <span style={{ color: "#ff4d4d" }}>{actualRed}</span>{" "}
                          --{" "}
                          <span style={{ color: "#4d8cff" }}>{actualBlue}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: hasResult ? "0.5rem" : "0" }}>
                      Predicted winner:{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                        color: predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                        background: "var(--background)",
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
                            background: "var(--background)",
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
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
      <LogoButton />
    </div>
  );
}
