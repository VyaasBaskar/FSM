"use client";

import TeamLink from "@/app/components/TeamLink";
import { TeamData, AllianceData } from "./types";

interface AllianceCardProps {
  alliance: string[];
  idx: number;
  teams: TeamData[];
  scores: number[];
  actualScores: number[];
  actualAlliances: AllianceData[] | null;
}

export default function AllianceCard({
  alliance,
  idx,
  teams,
  scores,
  actualScores,
  actualAlliances,
}: AllianceCardProps) {
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
  const totalMatches = [captainMatch, firstPickMatch, secondPickMatch].filter(
    Boolean
  ).length;
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
              {totalMatches === 3 ? "✅" : totalMatches >= 1 ? "⚠️" : "❌"}
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
        {allianceTeams.map((team: TeamData | undefined, teamIdx: number) => {
          if (!team) return null;
          const role =
            teamIdx === 0 ? "Captain" : teamIdx === 1 ? "1st Pick" : "2nd Pick";

          const isCorrectPick =
            hasActual && alliance[teamIdx] === actualTeamKeys[teamIdx];
          const actualTeam =
            hasActual && actualTeamKeys[teamIdx]
              ? teams.find((t) => t.key === actualTeamKeys[teamIdx])
              : null;

          return (
            <div
              key={team.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem",
                background: teamIdx === 0 ? "var(--gray-more)" : "transparent",
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
                  {role} {hasActual && (isCorrectPick ? "✓" : "✗")}
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
                  {hasActual && !isCorrectPick && actualTeam && (
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
                      <TeamLink teamKey={actualTeam.key} year={2025} />
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
                  ? `Actual +${(actualScores[idx] - scores[idx]).toFixed(
                      1
                    )} better`
                  : actualScores[idx] < scores[idx]
                  ? `Predicted +${(scores[idx] - actualScores[idx]).toFixed(
                      1
                    )} better`
                  : "Equal scores"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
