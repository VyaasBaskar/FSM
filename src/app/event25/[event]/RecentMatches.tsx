"use client";

import { useState, useEffect } from "react";
import {
  MatchPredictions as MatchPredictionsType,
  NexusScheduleData,
} from "./types";

interface RecentMatchesProps {
  matchPredictions: MatchPredictionsType;
  nexusSchedule: { [key: string]: NexusScheduleData };
}

function getMatchStatus(
  scheduledTime: string | null,
  actualTime: string | null
) {
  if (!scheduledTime || actualTime) return null;
  const minutesDiff = Math.floor(
    (new Date(scheduledTime).getTime() - Date.now()) / 60000
  );
  if (minutesDiff >= 0 && minutesDiff <= 5) return "queuing";
  if (minutesDiff > 5 && minutesDiff <= 10) return "ondeck";
  return null;
}

function formatMatchTime(scheduledTime: string | null, isUpcoming: boolean) {
  if (!scheduledTime) return null;
  const matchTime = new Date(scheduledTime);
  const minutesDiff = Math.floor((matchTime.getTime() - Date.now()) / 60000);

  if (isUpcoming && minutesDiff > 0) return `in ${minutesDiff}m`;

  const timeStr = matchTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return minutesDiff > 0 && minutesDiff <= 60
    ? `${timeStr} (in ${minutesDiff}m)`
    : timeStr;
}

export default function RecentMatches({
  matchPredictions,
  nexusSchedule,
}: RecentMatchesProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const sortedEntries = Object.entries(matchPredictions).sort(
    ([keyA], [keyB]) => {
      const scheduleA = nexusSchedule[keyA];
      const scheduleB = nexusSchedule[keyB];

      if (scheduleA?.scheduledTime && scheduleB?.scheduledTime) {
        return (
          new Date(scheduleA.scheduledTime).getTime() -
          new Date(scheduleB.scheduledTime).getTime()
        );
      }

      const getTypeOrder = (key: string) =>
        key.includes("_f") ? 2 : key.includes("_sf") ? 1 : 0;
      const typeOrder = getTypeOrder(keyA) - getTypeOrder(keyB);
      if (typeOrder !== 0) return typeOrder;

      const getNum = (key: string) =>
        parseInt((key.split("_")[1] || "").match(/\d+/)?.[0] ?? "0", 10);
      const numDiff = getNum(keyA) - getNum(keyB);
      return numDiff === 0 ? keyA.localeCompare(keyB) : numDiff;
    }
  );

  const now = isMounted ? currentTime.getTime() : Date.now();
  const [pastMatches, upcomingMatches] = sortedEntries.reduce<
    [typeof sortedEntries, typeof sortedEntries]
  >(
    ([past, upcoming], entry) => {
      const [key, match] = entry;
      const scheduleData = nexusSchedule[key];
      const hasResult = match.result?.[0] !== -1 && match.result?.[1] !== -1;
      const matchTime = scheduleData?.scheduledTime
        ? new Date(scheduleData.scheduledTime).getTime()
        : null;

      const isPast = matchTime
        ? matchTime < now || scheduleData.actualTime
        : hasResult;
      if (isPast) {
        past.push(entry);
      } else {
        upcoming.push(entry);
      }
      return [past, upcoming];
    },
    [[], []]
  );

  const recentPast = pastMatches.slice(-3);
  const nextUpcoming = upcomingMatches.slice(0, 3);

  if (nextUpcoming.length === 0) return null;

  const getPredictionBorder = (match: (typeof matchPredictions)[string]) => {
    if (!match.result || match.result.length !== 2)
      return "var(--border-color)";
    const [actualRed, actualBlue] = match.result;
    if (actualRed === null || actualBlue === null || actualRed === actualBlue)
      return "var(--border-color)";

    const actualWinner = actualRed > actualBlue ? "red" : "blue";
    return actualWinner === "red" ? "#ff4d4d" : "#4d8cff";
  };

  const renderMatchCard = (
    matchKey: string,
    match: (typeof matchPredictions)[string],
    isPast: boolean
  ) => {
    const scheduleData = nexusSchedule[matchKey];
    const matchStatus = isMounted
      ? getMatchStatus(scheduleData?.scheduledTime, scheduleData?.actualTime)
      : null;
    const matchTime =
      scheduleData?.scheduledTime && isMounted
        ? formatMatchTime(scheduleData.scheduledTime, !isPast)
        : null;

    const hasResult =
      match.result &&
      match.result.length === 2 &&
      match.result[0] !== -1 &&
      match.result[1] !== -1;

    return (
      <div
        key={matchKey}
        onClick={() => {
          const element = document.getElementById(matchKey);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        style={{
          border: `2px solid ${getPredictionBorder(match)}`,
          borderRadius: 10,
          padding: "0.75rem",
          background: "var(--background-pred)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          minWidth: "300px",
          maxWidth: "350px",
          cursor: "pointer",
          boxShadow:
            "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)";
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              fontSize: "0.95rem",
              color: "var(--yellow-color)",
              letterSpacing: "0.025em",
            }}
          >
            {matchKey.split("_")[1] || matchKey}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {matchTime && (
              <div
                style={{
                  color: "var(--gray-less)",
                  fontSize: "0.7rem",
                  fontWeight: "500",
                }}
              >
                {matchTime}
              </div>
            )}
            {matchStatus && (
              <div
                style={{
                  background:
                    matchStatus === "queuing"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(59, 130, 246, 0.2)",
                  color: matchStatus === "queuing" ? "#f59e0b" : "#3b82f6",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 4,
                  fontSize: "0.6rem",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                }}
              >
                {matchStatus === "queuing" ? "QUEUING" : "ON DECK"}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {[
              {
                teams: match.red,
                bg: "rgba(255, 77, 77, 0.15)",
                color: "#ff6666",
                border: "rgba(255, 77, 77, 0.3)",
                actualScore: hasResult ? match.result[0] : null,
                predictedScore: match.preds[0],
              },
              {
                teams: match.blue,
                bg: "rgba(77, 140, 255, 0.15)",
                color: "#6699ff",
                border: "rgba(77, 140, 255, 0.3)",
                actualScore: hasResult ? match.result[1] : null,
                predictedScore: match.preds[1],
              },
            ].map(
              (
                { teams, bg, color, border, actualScore, predictedScore },
                i
              ) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.3rem",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    {teams.map((t) => (
                      <span
                        key={t}
                        style={{
                          background: bg,
                          color,
                          border: `1px solid ${border}`,
                          padding: "0.25rem 0.3rem",
                          borderRadius: 5,
                          fontWeight: "600",
                          fontSize: "0.68rem",
                          minWidth: "42px",
                          maxWidth: "48px",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          boxSizing: "border-box",
                          flex: "0 1 auto",
                        }}
                      >
                        {t.replace("frc", "")}
                      </span>
                    ))}
                  </div>
                  {actualScore !== null ? (
                    <span
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        color,
                        minWidth: "38px",
                        textAlign: "right",
                        flexShrink: 0,
                        paddingLeft: "0.25rem",
                      }}
                    >
                      {actualScore}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        color,
                        minWidth: "38px",
                        textAlign: "right",
                        fontStyle: "italic",
                        opacity: 0.8,
                        flexShrink: 0,
                        paddingLeft: "0.25rem",
                      }}
                    >
                      {predictedScore}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      suppressHydrationWarning
      style={{
        width: "100%",
        marginBottom: "3rem",
        padding: "0 1rem",
      }}
    >
      <div
        suppressHydrationWarning
        style={{
          display: "flex",
          gap: "3rem",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            title: "Recent Matches",
            matches: recentPast,
            isPast: true,
            color: "#6b7280",
          },
          {
            title: "Upcoming Matches",
            matches: nextUpcoming,
            isPast: false,
            color: "var(--yellow-color)",
          },
        ].map(
          ({ title, matches, isPast, color }) =>
            matches.length > 0 && (
              <div
                key={title}
                style={{
                  flex: "0 1 auto",
                  background: "var(--gray-more)",
                  padding: "1.5rem",
                  borderRadius: 12,
                  border: "2px solid var(--border-color)",
                  boxShadow:
                    "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
                }}
              >
                <h3
                  style={{
                    color: "var(--foreground)",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    letterSpacing: "0.025em",
                  }}
                >
                  <span style={{ color }}>{title}</span>
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {matches.map(([key, match]) =>
                    renderMatchCard(key, match, isPast)
                  )}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
