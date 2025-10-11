"use client";

import { memo, useState, useMemo } from "react";
import { TeamDataType } from "../lib/event";
import TeamLink from "./TeamLink";

function Event25TeamsTable({ teams }: { teams: TeamDataType[] }) {
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
        case "cyp":
          aValue = Number(a.algae) * 1.4 + Number(a.auto) + Number(a.coral);
          bValue = Number(b.algae) * 1.4 + Number(b.auto) + Number(b.coral);
          break;
        default:
          return 0;
      }

      return isAscending ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [filteredTeams, sortField, isAscending]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setIsAscending(!isAscending);
    } else {
      setSortField(field);
      setIsAscending(field === "rank");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return "↕️";
    return isAscending ? "↑" : "↓";
  };

  const getStatColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 90) return "#10b981"; // Emerald - Top tier
    if (percentage >= 75) return "#22c55e"; // Green - Excellent
    if (percentage >= 60) return "#84cc16"; // Lime - Very good
    if (percentage >= 45) return "#eab308"; // Yellow - Good
    if (percentage >= 30) return "#f59e0b"; // Amber - Average
    if (percentage >= 15) return "#f97316"; // Orange - Below average
    return "#ef4444"; // Red - Low
  };

  const maxValues = useMemo(() => {
    return {
      fsm: Math.max(...teams.map((t) => parseFloat(t.fsm))),
      auto: Math.max(...teams.map((t) => parseFloat(t.auto))),
      coral: Math.max(...teams.map((t) => parseFloat(t.coral))),
      algae: Math.max(...teams.map((t) => parseFloat(t.algae))),
      climb: Math.max(...teams.map((t) => parseFloat(t.climb))),
      cyp: Math.max(
        ...teams.map(
          (t) => Number(t.algae) * 1.4 + Number(t.auto) + Number(t.coral)
        )
      ),
    };
  }, [teams]);

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
          background: "var(--background-pred)",
          border: "2px solid var(--border-color)",
          borderRadius: 12,
          padding: "1rem 1.5rem",
          maxWidth: "900px",
          alignSelf: "center",
          boxShadow:
            "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: "700",
            color: "var(--yellow-color)",
            marginBottom: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          PERFORMANCE COLOR KEY
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          {[
            { color: "#10b981", label: "Top Tier", range: "90-100%" },
            { color: "#22c55e", label: "Excellent", range: "75-90%" },
            { color: "#84cc16", label: "Very Good", range: "60-75%" },
            { color: "#eab308", label: "Good", range: "45-60%" },
            { color: "#f59e0b", label: "Average", range: "30-45%" },
            { color: "#f97316", label: "Below Avg", range: "15-30%" },
            { color: "#ef4444", label: "Low", range: "<15%" },
          ].map((item) => (
            <div
              key={item.color}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: "var(--gray-more)",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: 4,
                  background: item.color,
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--gray-less)",
                    lineHeight: 1.2,
                    marginTop: "0.15rem",
                  }}
                >
                  {item.range}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                }}
              >
                {sortField !== "rank" && "SORTED RANK"}
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
                { key: "cyp", label: "CYP", sortable: true },
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
              const cyp =
                Number(team.algae) * 1.4 +
                Number(team.auto) +
                Number(team.coral);

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
                    }}
                  >
                    {sortField !== "rank" && idx + 1}
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
                      color: "#ef4444",
                      fontWeight: "600",
                    }}
                  >
                    {parseFloat(team.foul).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      color: getStatColor(cyp, maxValues.cyp),
                    }}
                  >
                    {cyp.toFixed(2)}
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
    </div>
  );
}

export default memo(Event25TeamsTable);
