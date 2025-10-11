"use client";

import { useState } from "react";
import TeamLink from "@/app/components/TeamLink";
import { MatchPredictions as MatchPredictionsType } from "./types";

interface MatchPredictionsProps {
  matchPredictions: MatchPredictionsType;
}

export default function MatchPredictions({
  matchPredictions,
}: MatchPredictionsProps) {
  const [filterText, setFilterText] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterType, setFilterType] = useState<"all" | "quals" | "elims">(
    "all"
  );

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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color: "var(--foreground)",
        borderRadius: 12,
        width: "100%",
        padding: "0 1rem",
      }}
    >
      <h2 style={{ color: "var(--foreground)", textAlign: "center" }}>
        Match Predictions
      </h2>

      <div
        style={{
          background: "var(--background-pred)",
          border: "2px solid var(--border-color)",
          borderRadius: 12,
          padding: "1.5rem",
          marginTop: "1rem",
          marginBottom: "1.5rem",
          textAlign: "center",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            color: "var(--yellow-color)",
            lineHeight: 1,
          }}
        >
          {accuracy.toFixed(1)}%
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: "var(--gray-less)",
            marginTop: "0.75rem",
            fontWeight: "600",
            letterSpacing: "0.05em",
          }}
        >
          PREDICTION ACCURACY
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--foreground)",
            marginTop: "0.5rem",
            fontWeight: "500",
          }}
        >
          {correctPredictions.length} / {resultsWithGroundTruth.length} correct
          predictions
        </div>
      </div>

      <div
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
          placeholder="🔍 Filter by match name..."
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
        <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
          <input
            type="text"
            placeholder="🤖 Filter by team..."
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--input-bg)",
              color: "var(--input-text)",
              fontSize: "1rem",
              flex: 1,
            }}
          />
          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "all" | "quals" | "elims")
            }
            style={{
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--input-bg)",
              color: "var(--input-text)",
              fontSize: "1rem",
              minWidth: "120px",
            }}
          >
            <option value="all">All Matches</option>
            <option value="quals">Quals Only</option>
            <option value="elims">Elims Only</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "1400px",
        }}
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

          const isPredictionCorrect =
            actualWinner !== null &&
            actualWinner !== "tie" &&
            predWinner === actualWinner;
          const isPredictionWrong =
            actualWinner !== null &&
            actualWinner !== "tie" &&
            predWinner !== actualWinner;

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

          return (
            <div
              key={matchKey}
              style={{
                border: `2px solid ${
                  isPredictionCorrect
                    ? "#22c55e"
                    : isPredictionWrong
                    ? "#ef4444"
                    : "var(--border-color)"
                }`,
                borderRadius: 12,
                padding: "1.25rem",
                background: "var(--background-pred)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                position: "relative",
                boxShadow:
                  "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 24px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.1)";
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
                  paddingBottom: "0.75rem",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.125rem",
                    color: "var(--yellow-color)",
                    letterSpacing: "0.025em",
                  }}
                >
                  {matchKey}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isPredictionCorrect && (
                    <div
                      style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        padding: "0.25rem 0.75rem",
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      CORRECT
                    </div>
                  )}
                  {isPredictionWrong && (
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#ef4444",
                        padding: "0.25rem 0.75rem",
                        borderRadius: 6,
                        fontSize: "0.75rem",
                        fontWeight: "700",
                      }}
                    >
                      INCORRECT
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 77, 77, 0.05)",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: "1px solid rgba(255, 77, 77, 0.2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      color: "#ff4d4d",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    RED ALLIANCE
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {match.red.map((t, i) => {
                      const isHighlighted =
                        filterTeam &&
                        t.toLowerCase().includes(filterTeam.toLowerCase());
                      return (
                        <span
                          key={t}
                          style={{
                            background: isHighlighted
                              ? "var(--predicted-win-highlight)"
                              : "rgba(255, 77, 77, 0.15)",
                            color: isHighlighted ? "#000" : "#ff6666",
                            padding: "0.4rem 0.7rem",
                            borderRadius: 6,
                            fontWeight: isHighlighted ? "bold" : "600",
                            border: isHighlighted
                              ? "2px solid var(--yellow-color)"
                              : "1px solid rgba(255, 77, 77, 0.3)",
                            transition: "all 0.2s",
                          }}
                        >
                          <TeamLink teamKey={t} year={2025} />
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(77, 140, 255, 0.05)",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: "1px solid rgba(77, 140, 255, 0.2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      color: "#4d8cff",
                      marginBottom: "0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    BLUE ALLIANCE
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {match.blue.map((t, i) => {
                      const isHighlighted =
                        filterTeam &&
                        t.toLowerCase().includes(filterTeam.toLowerCase());
                      return (
                        <span
                          key={t}
                          style={{
                            background: isHighlighted
                              ? "var(--predicted-win-highlight)"
                              : "rgba(77, 140, 255, 0.15)",
                            color: isHighlighted ? "#000" : "#6699ff",
                            padding: "0.4rem 0.7rem",
                            borderRadius: 6,
                            fontWeight: isHighlighted ? "bold" : "600",
                            border: isHighlighted
                              ? "2px solid var(--yellow-color)"
                              : "1px solid rgba(77, 140, 255, 0.3)",
                            transition: "all 0.2s",
                          }}
                        >
                          <TeamLink teamKey={t} year={2025} />
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: hasResult ? "row" : "column",
                  gap: "1rem",
                  paddingTop: "0.75rem",
                  marginTop: "0.5rem",
                  borderTop: "2px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "var(--gray-more)",
                    padding: "0.75rem",
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--gray-less)",
                      marginBottom: "0.5rem",
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PREDICTED SCORE
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        color: "#ff4d4d",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                      }}
                    >
                      {predRed}
                    </span>
                    <span
                      style={{
                        color: "var(--gray-less)",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      -
                    </span>
                    <span
                      style={{
                        color: "#4d8cff",
                        fontWeight: "bold",
                        fontSize: "1.5rem",
                      }}
                    >
                      {predBlue}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: predWinner === "red" ? "#ff4d4d" : "#4d8cff",
                      marginTop: "0.5rem",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Predicted: {predWinner === "red" ? "Red" : "Blue"}
                  </div>
                </div>

                {hasResult && (
                  <div
                    style={{
                      flex: 1,
                      background: "var(--gray-more)",
                      padding: "0.75rem",
                      borderRadius: 8,
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--gray-less)",
                        marginBottom: "0.5rem",
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ACTUAL SCORE
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          color: "#ff4d4d",
                          fontWeight: "bold",
                          fontSize: "1.5rem",
                        }}
                      >
                        {actualRed}
                      </span>
                      <span
                        style={{
                          color: "var(--gray-less)",
                          fontSize: "1rem",
                          fontWeight: "bold",
                        }}
                      >
                        -
                      </span>
                      <span
                        style={{
                          color: "#4d8cff",
                          fontWeight: "bold",
                          fontSize: "1.5rem",
                        }}
                      >
                        {actualBlue}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color:
                          actualWinner === "red"
                            ? "#ff4d4d"
                            : actualWinner === "blue"
                            ? "#4d8cff"
                            : "var(--gray-less)",
                        marginTop: "0.5rem",
                        textAlign: "center",
                        fontWeight: "600",
                      }}
                    >
                      Winner:{" "}
                      {actualWinner === "tie"
                        ? "Tie"
                        : actualWinner === "red"
                        ? "Red"
                        : "Blue"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <div
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--gray-less)",
            background: "var(--background-pred)",
            borderRadius: 12,
            border: "2px solid var(--border-color)",
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "var(--foreground)",
              marginBottom: "0.5rem",
            }}
          >
            No Matches Found
          </h3>
          <p style={{ fontSize: "0.9rem" }}>
            Try adjusting your filters to see more results
          </p>
        </div>
      )}
    </div>
  );
}
