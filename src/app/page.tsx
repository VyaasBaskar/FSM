"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [eventCode, setEventCode] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [year, setYear] = useState("2025");
  const router = useRouter();

  const handleGoEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (eventCode.trim() && eventCode.trim().length > 5) {
      if (eventCode.trim().charAt(0) === "2" && eventCode.trim().charAt(1) === "0" && eventCode.trim().charAt(2) === "2" && eventCode.trim().charAt(3) === "5") {
        router.push(`/event25/${eventCode.trim().slice(4)}`);
      } else {
        router.push(`/event/${eventCode.trim()}`);
      }
    }

  };
  const handleGoTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamCode.trim()) {
      router.push(`/team/frc${teamCode.trim()}-${year}`);
    }
  };

  const handleGoGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Navigating to global rankings for year: ${year}`);
    router.push(`/global/${year}`);
  };

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.megatitle}>FunkyStats</h1>
        <p>Note: Pages have long loading times. If it is not loading, it will; do not close the tab.</p>
        <div style={{width: "100%", textAlign: "center", justifyContent: "center", marginBottom: 12, marginTop: 12}}>
        <div>
        <form onSubmit={handleGoGlobal} style={{ marginBottom: 12, display: "flex", gap: 8, textAlign: "center", justifyContent: "center" }}>
          <button
            type="submit"
            className={styles.button}
            style={{ padding: "12px 24px", fontSize: 16, borderRadius: 4, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
          >
          Explore Global Rankings
          </button>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
            <option value="2017">2017</option>
            <option value="2016">2016</option>
            <option value="2015">2015</option>
            <option value="2014">2014</option>
            <option value="2013">2013</option>
          </select>
        </form>
        </div>
        </div>
        <h1 className={styles.smallheader}> Event Finder </h1>
        <form onSubmit={handleGoEvent} style={{ marginBottom: 12, display: "flex", gap: 8, textAlign: "center", justifyContent: "center" }}>
          <input
            type="text"
            placeholder="Enter event code (e.g. 2025caav)"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc", width: "290px" }}
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
            placeholder="Enter team (e.g. 846)"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={styles.input}
            style={{ padding: 8, fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2019">2019</option>
            <option value="2018">2018</option>
            <option value="2017">2017</option>
            <option value="2016">2016</option>
            <option value="2015">2015</option>
            <option value="2014">2014</option>
            <option value="2013">2013</option>
          </select>
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