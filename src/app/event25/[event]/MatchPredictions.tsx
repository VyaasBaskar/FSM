"use client";

import { useState, useEffect } from "react";
import TeamLink from "@/app/components/TeamLink";
import RecentMatches from "./RecentMatches";
import MatchDetailModal from "./MatchDetailModal";
import {
  MatchPredictions as MatchPredictionsType,
  NexusScheduleData,
} from "./types";

interface MatchPredictionsProps {
  matchPredictions: MatchPredictionsType;
  nexusSchedule: { [key: string]: NexusScheduleData };
}

function getMatchStatus(
  scheduledTime: string | null,
  actualTime: string | null
) {
  if (!scheduledTime) return null;

  const now = new Date();
  const matchTime = new Date(scheduledTime);
  const timeDiff = matchTime.getTime() - now.getTime();
  const minutesDiff = Math.floor(timeDiff / 60000);

  if (actualTime || timeDiff < -600000) {
    return null;
  }

  if (minutesDiff <= 5 && minutesDiff >= 0) {
    return "queuing";
  } else if (minutesDiff > 5 && minutesDiff <= 10) {
    return "ondeck";
  }

  return null;
}

function formatMatchTime(scheduledTime: string | null) {
  if (!scheduledTime) return null;

  const matchTime = new Date(scheduledTime);
  return matchTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MatchPredictions({
  matchPredictions,
  nexusSchedule,
}: MatchPredictionsProps) {
  const [, setCurrentTime] = useState(new Date());
  const [filterText, setFilterText] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterType, setFilterType] = useState<"all" | "quals" | "elims">(
    "all"
  );
  const [selectedMatch, setSelectedMatch] = useState<{
    matchKey: string;
    match: (typeof matchPredictions)[string];
  } | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Detect if desktop view (768px+)
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
          placeholder="Filter by match name..."
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
          placeholder="Filter by team..."
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
          <option value="all">All Matches</option>
          <option value="quals">Quals Only</option>
          <option value="elims">Elims Only</option>
        </select>
      </div>
      <style jsx>{`
        @media (min-width: 768px) {
          .match-type-filter-mobile {
            display: none !important;
          }
        }
      `}</style>

      <RecentMatches
        matchPredictions={matchPredictions}
        nexusSchedule={nexusSchedule}
      />

      <div className="mobile-matches-container">
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

          const scheduleData = nexusSchedule[matchKey];
          const matchStatus = scheduleData
            ? getMatchStatus(
                scheduleData.scheduledTime,
                scheduleData.actualTime
              )
            : null;
          const matchTime = scheduleData
            ? formatMatchTime(scheduleData.scheduledTime)
            : null;

          return (
            <div
              key={matchKey}
              id={matchKey}
              style={{
                border: `2px solid ${
                  actualWinner === "red"
                    ? "#ff4d4d"
                    : actualWinner === "blue"
                    ? "#4d8cff"
                    : "var(--border-color)"
                }`,
                borderRadius: 6,
                padding: "0.5rem",
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
                  flexDirection: "column",
                  gap: "0.15rem",
                  paddingBottom: "0.35rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      fontSize: "0.8rem",
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
                          padding: "0.15rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.65rem",
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
                          padding: "0.15rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.65rem",
                          fontWeight: "700",
                        }}
                      >
                        INCORRECT
                      </div>
                    )}
                  </div>
                </div>
                {(matchTime || matchStatus) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {matchTime && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                          color: "var(--gray-less)",
                        }}
                      >
                        <span>🕐</span>
                        <span>{matchTime}</span>
                      </div>
                    )}
                    {matchStatus === "queuing" && (
                      <div
                        style={{
                          background: "rgba(245, 158, 11, 0.2)",
                          color: "#f59e0b",
                          padding: "0.15rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.65rem",
                          fontWeight: "700",
                        }}
                      >
                        🟡 QUEUING
                      </div>
                    )}
                    {matchStatus === "ondeck" && (
                      <div
                        style={{
                          background: "rgba(59, 130, 246, 0.2)",
                          color: "#3b82f6",
                          padding: "0.15rem 0.5rem",
                          borderRadius: 4,
                          fontSize: "0.65rem",
                          fontWeight: "700",
                        }}
                      >
                        🔵 ON DECK
                      </div>
                    )}
                  </div>
                )}
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
                      flexDirection: "column",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {match.red.map((t) => {
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
                            padding: "0.2rem 0.4rem",
                            borderRadius: 3,
                            fontWeight: isHighlighted ? "bold" : "600",
                            border: isHighlighted
                              ? "2px solid var(--yellow-color)"
                              : "1px solid rgba(255, 77, 77, 0.3)",
                            transition: "all 0.2s",
                            textAlign: "center",
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
                      flexDirection: "column",
                      gap: "0.25rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {match.blue.map((t) => {
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
                            padding: "0.2rem 0.4rem",
                            borderRadius: 3,
                            fontWeight: isHighlighted ? "bold" : "600",
                            border: isHighlighted
                              ? "2px solid var(--yellow-color)"
                              : "1px solid rgba(77, 140, 255, 0.3)",
                            transition: "all 0.2s",
                            textAlign: "center",
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
                  gap: "0.25rem",
                  paddingTop: "0.25rem",
                  marginTop: "0.2rem",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: "var(--gray-more)",
                    padding: "0.25rem",
                    borderRadius: 3,
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.5rem",
                      color: "var(--gray-less)",
                      marginBottom: "0.15rem",
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PRED
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        color: "#ff4d4d",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      {Math.round(Number(predRed))}
                    </span>
                    <span
                      style={{
                        color: "var(--gray-less)",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                      }}
                    >
                      -
                    </span>
                    <span
                      style={{
                        color: "#4d8cff",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                      }}
                    >
                      {Math.round(Number(predBlue))}
                    </span>
                  </div>
                </div>

                {hasResult && (
                  <div
                    style={{
                      flex: 1,
                      background: "var(--gray-more)",
                      padding: "0.25rem",
                      borderRadius: 3,
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.5rem",
                        color: "var(--gray-less)",
                        marginBottom: "0.15rem",
                        fontWeight: "700",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ACTUAL
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span
                        style={{
                          color: "#ff4d4d",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                        }}
                      >
                        {actualRed}
                      </span>
                      <span
                        style={{
                          color: "var(--gray-less)",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      >
                        -
                      </span>
                      <span
                        style={{
                          color: "#4d8cff",
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                        }}
                      >
                        {actualBlue}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="desktop-matches-container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            alignItems: "start",
          }}
        >
          <div>
            <h3
              style={{
                color: "var(--yellow-color)",
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Qualification Matches
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {qualsEntries.map(([matchKey, match]) => {
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

                const scheduleData = nexusSchedule[matchKey];
                const matchStatus = scheduleData
                  ? getMatchStatus(
                      scheduleData.scheduledTime,
                      scheduleData.actualTime
                    )
                  : null;
                const matchTime = scheduleData
                  ? formatMatchTime(scheduleData.scheduledTime)
                  : null;

                return (
                  <div
                    key={matchKey}
                    id={matchKey}
                    style={{
                      border: `2px solid ${
                        actualWinner === "red"
                          ? "#ff4d4d"
                          : actualWinner === "blue"
                          ? "#4d8cff"
                          : "var(--border-color)"
                      }`,
                      borderRadius: 6,
                      padding: "0.5rem",
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
                    onClick={() => {
                      setSelectedMatch({ matchKey, match });
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
                        flexDirection: "column",
                        gap: "0.5rem",
                        paddingBottom: "0.75rem",
                        borderBottom: "2px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "0.8rem",
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
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
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
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              INCORRECT
                            </div>
                          )}
                        </div>
                      </div>
                      {(matchTime || matchStatus) && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {matchTime && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.75rem",
                                color: "var(--gray-less)",
                              }}
                            >
                              <span>🕐</span>
                              <span>{matchTime}</span>
                            </div>
                          )}
                          {matchStatus === "queuing" && (
                            <div
                              style={{
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "#f59e0b",
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              🟡 QUEUING
                            </div>
                          )}
                          {matchStatus === "ondeck" && (
                            <div
                              style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                color: "#3b82f6",
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              🔵 ON DECK
                            </div>
                          )}
                        </div>
                      )}
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
                                  color: isHighlighted ? "#000" : "#ff6666",
                                  padding: "0.2rem 0.4rem",
                                  borderRadius: 3,
                                  fontWeight: isHighlighted ? "bold" : "600",
                                  border: isHighlighted
                                    ? "2px solid var(--yellow-color)"
                                    : "1px solid rgba(255, 77, 77, 0.3)",
                                  transition: "all 0.2s",
                                  textAlign: "center",
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
                                  color: isHighlighted ? "#000" : "#6699ff",
                                  padding: "0.2rem 0.4rem",
                                  borderRadius: 3,
                                  fontWeight: isHighlighted ? "bold" : "600",
                                  border: isHighlighted
                                    ? "2px solid var(--yellow-color)"
                                    : "1px solid rgba(77, 140, 255, 0.3)",
                                  transition: "all 0.2s",
                                  textAlign: "center",
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
                        gap: "0.25rem",
                        paddingTop: "0.25rem",
                        marginTop: "0.2rem",
                        borderTop: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          background: "var(--gray-more)",
                          padding: "0.25rem",
                          borderRadius: 3,
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--gray-less)",
                            marginBottom: "0.15rem",
                            fontWeight: "700",
                            letterSpacing: "0.05em",
                          }}
                        >
                          PRED
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              color: "#ff4d4d",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                            }}
                          >
                            {predRed}
                          </span>
                          <span
                            style={{
                              color: "var(--gray-less)",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                            }}
                          >
                            -
                          </span>
                          <span
                            style={{
                              color: "#4d8cff",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                            }}
                          >
                            {predBlue}
                          </span>
                        </div>
                      </div>

                      {hasResult && (
                        <div
                          style={{
                            flex: 1,
                            background: "var(--gray-more)",
                            padding: "0.25rem",
                            borderRadius: 3,
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.5rem",
                              color: "var(--gray-less)",
                              marginBottom: "0.15rem",
                              fontWeight: "700",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ACTUAL
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <span
                              style={{
                                color: "#ff4d4d",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                              }}
                            >
                              {actualRed}
                            </span>
                            <span
                              style={{
                                color: "var(--gray-less)",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                              }}
                            >
                              -
                            </span>
                            <span
                              style={{
                                color: "#4d8cff",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                              }}
                            >
                              {actualBlue}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {qualsEntries.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
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
            </div>
          </div>

          <div>
            <h3
              style={{
                color: "var(--yellow-color)",
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Elimination Matches
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {elimsEntries.map(([matchKey, match]) => {
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

                const scheduleData = nexusSchedule[matchKey];
                const matchStatus = scheduleData
                  ? getMatchStatus(
                      scheduleData.scheduledTime,
                      scheduleData.actualTime
                    )
                  : null;
                const matchTime = scheduleData
                  ? formatMatchTime(scheduleData.scheduledTime)
                  : null;

                return (
                  <div
                    key={matchKey}
                    id={matchKey}
                    style={{
                      border: `2px solid ${
                        actualWinner === "red"
                          ? "#ff4d4d"
                          : actualWinner === "blue"
                          ? "#4d8cff"
                          : "var(--border-color)"
                      }`,
                      borderRadius: 6,
                      padding: "0.5rem",
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
                    onClick={() => {
                      setSelectedMatch({ matchKey, match });
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
                        flexDirection: "column",
                        gap: "0.5rem",
                        paddingBottom: "0.75rem",
                        borderBottom: "2px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            fontSize: "0.8rem",
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
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
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
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              INCORRECT
                            </div>
                          )}
                        </div>
                      </div>
                      {(matchTime || matchStatus) && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {matchTime && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.75rem",
                                color: "var(--gray-less)",
                              }}
                            >
                              <span>🕐</span>
                              <span>{matchTime}</span>
                            </div>
                          )}
                          {matchStatus === "queuing" && (
                            <div
                              style={{
                                background: "rgba(245, 158, 11, 0.2)",
                                color: "#f59e0b",
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              🟡 QUEUING
                            </div>
                          )}
                          {matchStatus === "ondeck" && (
                            <div
                              style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                color: "#3b82f6",
                                padding: "0.15rem 0.5rem",
                                borderRadius: 4,
                                fontSize: "0.65rem",
                                fontWeight: "700",
                              }}
                            >
                              🔵 ON DECK
                            </div>
                          )}
                        </div>
                      )}
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
                                  color: isHighlighted ? "#000" : "#ff6666",
                                  padding: "0.2rem 0.4rem",
                                  borderRadius: 3,
                                  fontWeight: isHighlighted ? "bold" : "600",
                                  border: isHighlighted
                                    ? "2px solid var(--yellow-color)"
                                    : "1px solid rgba(255, 77, 77, 0.3)",
                                  transition: "all 0.2s",
                                  textAlign: "center",
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
                                  color: isHighlighted ? "#000" : "#6699ff",
                                  padding: "0.2rem 0.4rem",
                                  borderRadius: 3,
                                  fontWeight: isHighlighted ? "bold" : "600",
                                  border: isHighlighted
                                    ? "2px solid var(--yellow-color)"
                                    : "1px solid rgba(77, 140, 255, 0.3)",
                                  transition: "all 0.2s",
                                  textAlign: "center",
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
                        gap: "0.25rem",
                        paddingTop: "0.25rem",
                        marginTop: "0.2rem",
                        borderTop: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          background: "var(--gray-more)",
                          padding: "0.25rem",
                          borderRadius: 3,
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.5rem",
                            color: "var(--gray-less)",
                            marginBottom: "0.15rem",
                            fontWeight: "700",
                            letterSpacing: "0.05em",
                          }}
                        >
                          PRED
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <span
                            style={{
                              color: "#ff4d4d",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                            }}
                          >
                            {predRed}
                          </span>
                          <span
                            style={{
                              color: "var(--gray-less)",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                            }}
                          >
                            -
                          </span>
                          <span
                            style={{
                              color: "#4d8cff",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                            }}
                          >
                            {predBlue}
                          </span>
                        </div>
                      </div>

                      {hasResult && (
                        <div
                          style={{
                            flex: 1,
                            background: "var(--gray-more)",
                            padding: "0.25rem",
                            borderRadius: 3,
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.5rem",
                              color: "var(--gray-less)",
                              marginBottom: "0.15rem",
                              fontWeight: "700",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ACTUAL
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <span
                              style={{
                                color: "#ff4d4d",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                              }}
                            >
                              {actualRed}
                            </span>
                            <span
                              style={{
                                color: "var(--gray-less)",
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                              }}
                            >
                              -
                            </span>
                            <span
                              style={{
                                color: "#4d8cff",
                                fontWeight: "bold",
                                fontSize: "0.85rem",
                              }}
                            >
                              {actualBlue}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {elimsEntries.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
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
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-matches-container {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(100%, 320px), 1fr)
          );
          gap: 0.75rem;
          width: 100%;
          max-width: 1400px;
        }
        .desktop-matches-container {
          display: none;
        }
        @media (min-width: 768px) {
          .mobile-matches-container {
            display: none;
          }
          .desktop-matches-container {
            display: block;
            width: 100%;
          }
        }

        /* Add scroll offset for match cards */
        .mobile-matches-container > div,
        .desktop-matches-container div[id] {
          scroll-margin-top: 100px;
        }
      `}</style>

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

      {selectedMatch && isDesktop && (
        <MatchDetailModal
          matchKey={selectedMatch.matchKey}
          match={selectedMatch.match}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}
