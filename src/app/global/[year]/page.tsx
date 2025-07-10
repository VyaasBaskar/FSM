/* eslint-disable */
import styles from "../../page.module.css";
import { getGlobalStats } from "../../lib/global";
import LogoButton from "../../components/LogoButton";
import OffseasonCheck from "./offseason";

export default async function GlobalPage({ params }: { params: Promise<{ year: string }> }) {
  let { year } = await params;

  let includeOffseason = true;
  if (year.split("-").length > 1 && year.split("-")[1] === "no") {
    includeOffseason = false;
  }


  year = year.split("-")[0];
  if (Number(year) < 2013 || Number(year) === 2021 || Number(year) === 2020 || Number(year) > 2025) {
    year = "2025";
  }

  const globalStats = await getGlobalStats(Number(year), includeOffseason);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <a
        href="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          textDecoration: "none",
          color: "inherit",
          fontSize: "4rem",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
        }}
        aria-label="Back to Home"
      >
        &#8592;
      </a>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: {year} Global FSM Rankings</h1>
        <div style={{ margin: "1rem 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", width: "100%", justifyContent: "center" }}>
            <OffseasonCheck year={year} checked={includeOffseason} />
            Include Offseason
          </label>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{Number(teamKey) + 1}</td>
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
