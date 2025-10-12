"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface ClientHomeProps {
  events: { key: string; value: string }[];
  teams: { key: string; value: string }[];
}

export default function ClientHome({ events, teams }: ClientHomeProps) {
  const [eventCode, setEventCode] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [year, setYear] = useState("2025");
  const router = useRouter();

  const handleGoEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = eventCode.trim();
    if (trimmed && trimmed.length > 5) {
      if (trimmed.startsWith("2026")) {
        router.push(`/event26/${trimmed.slice(4)}`);
      } else if (trimmed.startsWith("2025")) {
        router.push(`/event25/${trimmed.slice(4)}`);
      } else {
        router.push(`/event/${trimmed}`);
      }
    }
  };

  const handleGoTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamCode.trim();
    if (trimmed) {
      router.push(`/team/frc${trimmed}-${year}`);
    }
  };

  const handleGoGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/global/2025`);
  };

  return (
    <div
      className={styles.page}
      style={{
        position: "relative",
        minHeight: "100vh",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        overflowX: "visible",
        width: "100%",
        marginTop: "0rem",
        paddingTop: "5rem",
      }}
    >
      <main className={styles.main}>
        <h1
          className={styles.megatitle}
          style={{
            color: "var(--yellow-color)",
            marginBottom: "1rem",
            fontWeight: "800",
          }}
        >
          FunkyStats
        </h1>
        <p
          style={{
            paddingInline: "5%",
            fontSize: "1rem",
            lineHeight: "1.6",
            opacity: 0.85,
            marginBottom: "1.5rem",
            maxWidth: "600px",
            margin: "0 auto 1.5rem",
            color: "var(--foreground)",
          }}
        >
          FunkyStats is an FRC data analytics tool that utilizes FSM, the Funky
          Scoring Metric, to make highly accurate predictions of teams&#39;
          in-match performance.
        </p>

        <div
          style={{
            width: "100%",
            textAlign: "center",
            marginBottom: "2rem",
            marginTop: "0.5rem",
          }}
        >
          <form
            onSubmit={handleGoGlobal}
            style={{
              marginBottom: 0,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="submit"
              className={styles.button}
              style={{
                padding: "14px 32px",
                fontSize: 17,
                fontWeight: 600,
                borderRadius: 10,
                background: "var(--yellow-color)",
                color: "#000",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              Explore Global Rankings
            </button>
          </form>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            margin: "0 auto",
            padding: "1.5rem 1rem",
            background: "var(--gray-more)",
            borderRadius: "16px",
            border: "2px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: "1.25rem",
          }}
        >
          <h1
            className={styles.smallheader}
            style={{
              marginBottom: "1rem",
              fontSize: "1.5rem",
              color: "var(--foreground)",
            }}
          >
            Event Finder
          </h1>
          <form
            onSubmit={handleGoEvent}
            style={{
              marginBottom: 0,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              list="event-options"
              placeholder="Search or enter event code"
              value={eventCode}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const matchedEvent = events.find(
                  (event) => event.value === selectedValue
                );
                if (matchedEvent) {
                  setEventCode(matchedEvent.key);
                } else {
                  setEventCode(selectedValue);
                }
              }}
              className={styles.input}
              style={{
                padding: "12px 16px",
                fontSize: 16,
                borderRadius: 10,
                border: "2px solid var(--border-color)",
                flex: "1 1 auto",
                minWidth: "200px",
                maxWidth: "100%",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--yellow-color)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(253, 224, 71, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <datalist id="event-options">
              {events
                .filter((event) =>
                  event.value.toLowerCase().includes(eventCode.toLowerCase())
                )
                .slice(0, 5)
                .map((event) => (
                  <option key={event.key} value={event.value} />
                ))}
            </datalist>
            <button
              type="submit"
              className={styles.button}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                background: "var(--yellow-color)",
                color: "#000",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              Find Event
            </button>
          </form>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            margin: "0 auto",
            padding: "1.5rem 1rem",
            background: "var(--gray-more)",
            borderRadius: "16px",
            border: "2px solid var(--border-color)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            marginBottom: "1.25rem",
          }}
        >
          <h1
            className={styles.smallheader}
            style={{
              marginBottom: "1rem",
              fontSize: "1.5rem",
              color: "var(--foreground)",
            }}
          >
            Team Finder
          </h1>
          <form
            onSubmit={handleGoTeam}
            style={{
              marginBottom: 0,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              list="team-options"
              type="text"
              placeholder="Enter team (e.g. 846)"
              value={teamCode}
              onChange={(e) => {
                const selectedValue = e.target.value;
                const matchedTeam = teams.find(
                  (team) => team.value === selectedValue
                );
                if (matchedTeam) {
                  setTeamCode(matchedTeam.key);
                } else {
                  setTeamCode(selectedValue);
                }
              }}
              className={styles.input}
              style={{
                padding: "12px 16px",
                fontSize: 16,
                borderRadius: 10,
                border: "2px solid var(--border-color)",
                flex: "1 1 auto",
                minWidth: "180px",
                maxWidth: "100%",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--yellow-color)";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(253, 224, 71, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            <datalist id="team-options">
              {teams
                .filter((team) =>
                  team.value.toLowerCase().includes(teamCode.toLowerCase())
                )
                .sort((a, b) => Number(a.key) - Number(b.key))
                .slice(0, 5)
                .map((team) => (
                  <option key={team.key} value={team.value} />
                ))}
            </datalist>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={styles.input}
              style={{
                padding: "12px 16px",
                fontSize: 16,
                fontWeight: 500,
                borderRadius: 10,
                border: "2px solid var(--border-color)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                minWidth: "110px",
              }}
            >
              <option key="general" value="general">
                General
              </option>
              {[
                "2025",
                "2024",
                "2023",
                "2022",
                "2019",
                "2018",
                "2017",
                "2016",
                "2015",
                "2014",
                "2013",
              ].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={styles.button}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                background: "var(--yellow-color)",
                color: "#000",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              }}
            >
              Find Team
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
