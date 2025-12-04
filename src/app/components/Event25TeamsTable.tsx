"use client";

import { memo, useState, useMemo } from "react";
import { TeamDataType } from "../lib/event";
import TeamLink from "./TeamLink";

function Event25TeamsTable({
  teams,
  defensiveScores,
  unluckyMetrics,
  sosZScoreMetrics,
}: {
  teams: TeamDataType[];
  defensiveScores?: { [teamKey: string]: number };
  unluckyMetrics?: { [teamKey: string]: number };
  sosZScoreMetrics?: { [teamKey: string]: number };
}) {
  const [sortField, setSortField] = useState<string>("rank");
  const [isAscending, setIsAscending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teams;
    return teams.filter((team) =>
      team.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teams, searchQuery]);

  const sortedTeams = useMemo(() => {
    const sorted = [...filteredTeams];

    sorted.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortField) {
        case "rank":
          aValue = a.rank;
          bValue = b.rank;
          break;
        case "fsm":
          aValue = parseFloat(a.fsm);
          bValue = parseFloat(b.fsm);
          break;
        case "auto":
          aValue = parseFloat(a.auto);
          bValue = parseFloat(b.auto);
          break;
        case "coral":
          aValue = parseFloat(a.coral);
          bValue = parseFloat(b.coral);
          break;
        case "algae":
          aValue = parseFloat(a.algae);
          bValue = parseFloat(b.algae);
          break;
        case "climb":
          aValue = parseFloat(a.climb);
          bValue = parseFloat(b.climb);
          break;
        case "foul":
          aValue = parseFloat(a.foul);
          bValue = parseFloat(b.foul);
          break;
        case "def":
          aValue = defensiveScores?.[a.key] || 0;
          bValue = defensiveScores?.[b.key] || 0;
          break;
        case "unlucky":
          aValue = unluckyMetrics?.[a.key] || 0;
          bValue = unluckyMetrics?.[b.key] || 0;
          break;
        case "sosZScore":
          aValue = sosZScoreMetrics?.[a.key] || 0;
          bValue = sosZScoreMetrics?.[b.key] || 0;
          break;
        default:
          return 0;
      }

      return isAscending ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [filteredTeams, sortField, isAscending, defensiveScores, sosZScoreMetrics, unluckyMetrics]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setIsAscending(!isAscending);
    } else {
      setSortField(field);
      setIsAscending(field === "rank");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return "";
    return isAscending ? "▲" : "▼";
  };

  const getStatColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 99) return "#10b981"; // Emerald - 99-100
    if (percentage >= 90) return "#22c55e"; // Green - 90-99
    if (percentage >= 75) return "#84cc16"; // Lime - 75-90
    if (percentage >= 25) return "#eab308"; // Yellow - 25-75
    return "#ef4444"; // Red - 0-25
  };
  const getFoulColor = (value: number) => {
    if (value > 0) return "#ef4444";
    if (value < 0) return "#22c55e";
    return "var(--foreground)";
  };

  const getUnluckyColor = (value: number, max: number, min: number) => {
    if (value === 0 && max === 0 && min === 0) return "var(--foreground)";
    const range = max - min;
    if (range === 0) return "var(--foreground)";
    const percentage = ((value - min) / range) * 100;
    if (percentage >= 75) return "#ef4444";
    if (percentage >= 50) return "#f97316";
    if (percentage >= 25) return "#eab308";
    if (percentage <= 25) return "#22c55e";
    return "var(--foreground)";
  };


  const getZScoreColor = (zScore: number) => {
    if (zScore >= 2.0) return "#ef4444";
    if (zScore >= 1.5) return "#f97316";
    if (zScore >= 1.0) return "#eab308";
    if (zScore >= 0.5) return "#fbbf24";
    if (zScore <= -2.0) return "#22c55e";
    if (zScore <= -1.5) return "#84cc16";
    if (zScore <= -1.0) return "#a3e635";
    if (zScore <= -0.5) return "#d9f99d";
    return "var(--foreground)";
  };

  const maxValues = useMemo(() => {
    return {
      fsm: Math.max(...teams.map((t) => parseFloat(t.fsm))),
      auto: Math.max(...teams.map((t) => parseFloat(t.auto))),
      coral: Math.max(...teams.map((t) => parseFloat(t.coral))),
      algae: Math.max(...teams.map((t) => parseFloat(t.algae))),
      climb: Math.max(...teams.map((t) => parseFloat(t.climb))),
      def: defensiveScores ? Math.max(...Object.values(defensiveScores), 0) : 0,
      unlucky: unluckyMetrics ? Math.max(...Object.values(unluckyMetrics), 0) : 0,
      unluckyMin: unluckyMetrics ? Math.min(...Object.values(unluckyMetrics), 0) : 0,
    };
  }, [teams, defensiveScores, unluckyMetrics]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "0 1rem",
      }}
    >
      <input
        type="text"
        placeholder="🔍 Search teams..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          padding: "0.75rem",
          borderRadius: 8,
          border: "1px solid var(--border-color)",
          background: "var(--input-bg)",
          color: "var(--input-text)",
          fontSize: "1rem",
          maxWidth: "400px",
          alignSelf: "center",
        }}
      />

      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "2px solid var(--border-color)",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "800px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "var(--gray-more)",
                borderBottom: "2px solid var(--border-color)",
              }}
            >
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  fontWeight: "700",
                  fontSize: "0.875rem",
                  letterSpacing: "0.05em",
                  color: "var(--yellow-color)",
                  width: "140px",
                }}
              >
                SORTED RANK
              </th>
              {[
                { key: "key", label: "TEAM", sortable: false },
                { key: "rank", label: "RANK", sortable: true },
                { key: "fsm", label: "FSM", sortable: true },
                { key: "auto", label: "AUTO", sortable: true },
                { key: "coral", label: "CORAL", sortable: true },
                { key: "algae", label: "ALGAE", sortable: true },
                { key: "climb", label: "CLIMB", sortable: true },
                { key: "foul", label: "FOULS", sortable: true },
                { key: "def", label: "DEF", sortable: true },
                { key: "sosZScore", label: "SOS", sortable: true },
                { key: "unlucky", label: "UNLUCKY", sortable: true },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    fontWeight: "700",
                    fontSize: "0.875rem",
                    letterSpacing: "0.05em",
                    color: "var(--yellow-color)",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (col.sortable) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {col.label} {col.sortable && getSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, idx) => {
              const defScore = defensiveScores?.[team.key] || 0;
              const foulValue = parseFloat(team.foul);
              const sosZScoreValue = sosZScoreMetrics?.[team.key] || 0;
              const unluckyValue = unluckyMetrics?.[team.key] || 0;

              return (
                <tr
                  key={team.key}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    background: "var(--background-pred)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--gray-more)";
                    e.currentTarget.style.transform = "scale(1.01)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--background-pred)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "600",
                      color: "var(--gray-less)",
                      width: "140px",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>
                    <TeamLink teamKey={team.key} year={2025} />
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      fontSize: "1.125rem",
                    }}
                  >
                    #{team.rank}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      fontSize: "1.125rem",
                      color: getStatColor(parseFloat(team.fsm), maxValues.fsm),
                    }}
                  >
                    {parseFloat(team.fsm).toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: getStatColor(
                        parseFloat(team.auto),
                        maxValues.auto
                      ),
                      fontWeight: "600",
                    }}
                  >
                    {parseFloat(team.auto).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: getStatColor(
                        parseFloat(team.coral),
                        maxValues.coral
                      ),
                      fontWeight: "600",
                    }}
                  >
                    {parseFloat(team.coral).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: getStatColor(
                        parseFloat(team.algae),
                        maxValues.algae
                      ),
                      fontWeight: "600",
                    }}
                  >
                    {parseFloat(team.algae).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: getStatColor(
                        parseFloat(team.climb),
                        maxValues.climb
                      ),
                      fontWeight: "600",
                    }}
                  >
                    {parseFloat(team.climb).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: getFoulColor(foulValue),
                      fontWeight: "600",
                    }}
                  >
                    {foulValue.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      color: getStatColor(defScore, maxValues.def),
                    }}
                  >
                    {defScore.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "600",
                      color: getZScoreColor(sosZScoreValue),
                    }}
                  >
                    {sosZScoreValue !== 0 ? sosZScoreValue.toFixed(2) : "—"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "600",
                      color: getUnluckyColor(unluckyValue, maxValues.unlucky || 1, maxValues.unluckyMin || 0),
                    }}
                  >
                    {unluckyValue !== 0 ? unluckyValue.toFixed(2) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredTeams.length === 0 && (
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
            No Teams Found
          </h3>
          <p style={{ fontSize: "0.9rem" }}>
            Try adjusting your search to see more results
          </p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "1.5rem 1rem",
          fontSize: "0.9rem",
          color: "var(--foreground)",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: "600" }}>Key (Percentile):</span>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#ef4444",
              color: "#fff",
              fontWeight: "500",
            }}
          >
            0 - 25
          </span>
          <span
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#eab308",
              color: "#fff",
              fontWeight: "500",
            }}
          >
            25 - 75
          </span>
          <span
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#84cc16",
              color: "#fff",
              fontWeight: "500",
            }}
          >
            75 - 90
          </span>
          <span
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#22c55e",
              color: "#fff",
              fontWeight: "500",
            }}
          >
            90 - 99
          </span>
          <span
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              background: "#10b981",
              color: "#fff",
              fontWeight: "500",
            }}
          >
            99 - 100
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(Event25TeamsTable);
