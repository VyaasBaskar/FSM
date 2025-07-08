"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [eventCode, setEventCode] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const router = useRouter();

  const handleGoEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (eventCode.trim()) {
      router.push(`/event/${eventCode.trim()}`);
    }
  };
  const handleGoTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamCode.trim()) {
      router.push(`/team/${teamCode.trim()}`);
    }
  };

  const handleGoGlobal = () => {
    router.push("/global");
  };

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.megatitle}>FunkyStats</h1>
        <p>Note: Pages have long loading times. If it isn't loading, it will; don't close the tab.</p>
        <div style={{width: "100%", textAlign: "center", justifyContent: "center", marginBottom: 12, marginTop: 12}}>
        <div>
        <button
          onClick={handleGoGlobal}
          className={styles.button}
          style={{ padding: "12px 24px", fontSize: 16, borderRadius: 4, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Explore Global Rankings
        </button>
        </div>
        </div>
        <h1 className={styles.smallheader}> Event Finder </h1>
        <form onSubmit={handleGoEvent} style={{ marginBottom: 32, display: "flex", gap: 8, textAlign: "center", justifyContent: "center" }}>
          <input
            type="text"
            placeholder="Enter event code (e.g. 2025cc)"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <button
            type="submit"
            className={styles.button}
            style={{ padding: "8px 16px", fontSize: 16, borderRadius: 4, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Go
          </button>
        </form>
        <h1 className={styles.smallheader}> Team Finder </h1>
        <form onSubmit={handleGoTeam} style={{ marginBottom: 32, display: "flex", gap: 8, textAlign: "center", justifyContent: "center" }}>
          <input
            type="text"
            placeholder="Enter team code (e.g. frc846)"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <button
            type="submit"
            className={styles.button}
            style={{ padding: "8px 16px", fontSize: 16, borderRadius: 4, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
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