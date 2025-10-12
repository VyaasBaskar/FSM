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
    const [predRed, predBlue] = match.preds;
    const [actualRed, actualBlue] = match.result;
    if (actualRed === null || actualBlue === null || actualRed === actualBlue)
      return "var(--border-color)";

    const predWinner = Number(predRed) > Number(predBlue) ? "red" : "blue";
    const actualWinner = actualRed > actualBlue ? "red" : "blue";
    return predWinner === actualWinner ? "#22c55e" : "#ef4444";
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

    return (
      <div
        key={matchKey}
        onClick={() => {
          const element = document.getElementById(matchKey);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        style={{
          border: `2px solid ${getPredictionBorder(match)}`,
          borderRadius: 8,
          padding: "0.5rem 0.75rem",
          background: "var(--background-pred)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          minWidth: "fit-content",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.15rem",
            minWidth: "80px",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              fontSize: "0.85rem",
              color: "var(--yellow-color)",
              whiteSpace: "nowrap",
            }}
          >
            {matchKey.split("_")[1] || matchKey}
          </span>
          {matchTime && (
            <div style={{ color: "var(--gray)", fontSize: "0.65rem" }}>
              {matchTime}
            </div>
          )}
          <div
            style={{
              minHeight: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {matchStatus && (
              <div
                style={{
                  background:
                    matchStatus === "queuing"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(59, 130, 246, 0.2)",
                  color: matchStatus === "queuing" ? "#f59e0b" : "#3b82f6",
                  padding: "0.15rem 0.4rem",
                  borderRadius: 3,
                  fontSize: "0.55rem",
                  fontWeight: "700",
                }}
              >
                {matchStatus === "queuing" ? "QUEUING" : "ON DECK"}
              </div>
            )}
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
        >
          {[
            {
              teams: match.red,
              bg: "rgba(255, 77, 77, 0.2)",
              color: "#ff6666",
              border: "rgba(255, 77, 77, 0.3)",
            },
            {
              teams: match.blue,
              bg: "rgba(77, 140, 255, 0.2)",
              color: "#6699ff",
              border: "rgba(77, 140, 255, 0.3)",
            },
          ].map(({ teams, bg, color, border }, i) => (
            <div key={i} style={{ display: "flex", gap: "0.25rem" }}>
              {teams.map((t) => (
                <span
                  key={t}
                  style={{
                    background: bg,
                    color,
                    border: `1px solid ${border}`,
                    padding: "0.2rem 0.3rem",
                    borderRadius: 4,
                    fontWeight: "600",
                    fontSize: "0.65rem",
                    width: "46px",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                  }}
                >
                  {t.replace("frc", "")}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      suppressHydrationWarning
      style={{ width: "100%", marginBottom: "2rem", padding: "0 1rem" }}
    >
      <div
        suppressHydrationWarning
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {[
          { title: "Recent Matches", matches: recentPast, isPast: true },
          { title: "Upcoming Matches", matches: nextUpcoming, isPast: false },
        ].map(
          ({ title, matches, isPast }) =>
            matches.length > 0 && (
              <div key={title} style={{ flex: "0 1 auto" }}>
                <h3
                  style={{
                    color: "var(--foreground)",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span>{title}</span>
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
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
