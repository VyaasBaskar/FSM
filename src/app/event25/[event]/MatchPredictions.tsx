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
                    <strong style={{ fontSize: "0.9rem", marginRight: 4 }}>
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
                          searchedTeamOnRed && actualRed !== -1 ? "4px" : "0",
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
                          searchedTeamOnBlue && actualBlue !== -1 ? "4px" : "0",
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
                    background: highWinner ? "#ffd700" : "var(--background)",
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
  );
}
