import styles from "../page.module.css";
import {  getGlobalStats } from "../lib/global";
import LogoButton from "../components/LogoButton";

export default async function GlobalPage() {
  const globalStats = await getGlobalStats();

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Global FSM Rankings</h1>
        <table style={{ width: "100%", marginTop: "2rem", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>FSM Rank</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Team Key</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>FSM</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(globalStats).map(([teamKey, bestFSM]) => (
              <tr key={teamKey}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{teamKey}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{bestFSM.teamKey}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{bestFSM.bestFSM}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      <LogoButton />
    </div>
  );
}
