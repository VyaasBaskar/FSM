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
      if (trimmed.startsWith("2025")) {
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
    router.push(`/global/${year}`);
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
      }}
    >
      <main className={styles.main}>
        <h1 className={styles.megatitle}>FunkyStats</h1>
        <p style={{ paddingInline: "15%" }}>
          FunkyStats is an FRC data analytics tool that utilizes FSM, the Funky
          Scoring Metric, to make highly accurate predictions of teams&#39;
          in-match performance.
        </p>

        <div
          style={{
            width: "100%",
            textAlign: "center",
            marginBottom: 12,
            marginTop: 12,
          }}
        >
          <form
            onSubmit={handleGoGlobal}
            style={{
              marginBottom: 12,
              display: "flex",
              gap: 8,
              justifyContent: "center",
            }}
          >
            <button
              type="submit"
              className={styles.button}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                borderRadius: 4,
                background: "#0070f3",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Explore Global Rankings
            </button>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={styles.input}
              style={{
                padding: 8,
                fontSize: 16,
                borderRadius: 4,
              }}
            >
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
          </form>
        </div>

        <h1 className={styles.smallheader}>Event Finder</h1>
        <form
          onSubmit={handleGoEvent}
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 8,
            justifyContent: "center",
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
              padding: 8,
              fontSize: 16,
              borderRadius: 4,
              border: "1px solid #ccc",
              width: 290,
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
              padding: "8px 16px",
              fontSize: 16,
              borderRadius: 4,
              background: "#0070f3",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go
          </button>
        </form>

        <h1 className={styles.smallheader}>Team Finder</h1>
        <form
          onSubmit={handleGoTeam}
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 8,
            justifyContent: "center",
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
              padding: 8,
              fontSize: 16,
              borderRadius: 4,
              border: "1px solid #ccc",
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
              padding: 8,
              fontSize: 16,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          >
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
              padding: "8px 16px",
              fontSize: 16,
              borderRadius: 4,
              background: "#0070f3",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go
          </button>
        </form>
      </main>

      <img
        src="/logo846.png"
        alt="Logo"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          width: 68,
          height: 80,
          zIndex: 1000,
        }}
      />
    </div>
  );
}
