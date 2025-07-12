import styles from "../../page.module.css";
import { getEventTeams, getMatchPredictions, getNumberPlayedMatches } from "../../lib/event";
import { getGlobalStats } from "@/app/lib/global";
import LogoButton from "../../components/LogoButton";
import Event25TeamsTable from "../../components/Event25TeamsTable";
import Link from "next/link";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode, true);

  const playedMatches = await getNumberPlayedMatches("2025" + eventCode);

  let FSMs: { [key: string]: number } = {};
  teams.forEach((team) => {
    FSMs[team.key] = Number(team.fsm);
  });

  if (playedMatches < 10) {
    const globalStats = await getGlobalStats();
    FSMs = {};
    globalStats.forEach(({ teamKey, bestFSM }) => {
      FSMs[teamKey] = Number(bestFSM);
    });
  }

  const matchPredictions = await getMatchPredictions("2025" + eventCode, FSMs);
  const havePreds = matchPredictions && Object.keys(matchPredictions).length > 0;

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <Link
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
      </Link>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Event FSM</h1>
        <h2 className={styles.table}>2025{eventCode}</h2>
        {havePreds ? (
          <h2 className={styles.table} style={{ color: "#4caf50" }}>
            Match Predictions Available (Scroll down)
          </h2>
        ) : (
          <h2 className={styles.table} style={{ color: "#f44336" }}>
            No Match Predictions Available
          </h2>
        )}
        <Event25TeamsTable teams={teams} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "8rem",
            background: "#181818",
            color: "#f1f1f1",
            borderRadius: 12,
            boxShadow: "0 2px 16px rgba(0,0,0,0.6)",
            padding: "2rem",
          }}
        >
          <h2 style={{ color: "#fafafa" }}>Match Predictions</h2>
          <ul style={{ listStyle: "none", padding: 0, width: "100%", maxWidth: 600 }}>
            {Object.entries(matchPredictions).map(([matchKey, { preds, red, blue }]) => {
              const [redScore, blueScore] = preds;
              const winner = redScore > blueScore ? "red" : "blue";
              return havePreds && (
          <li
            key={matchKey}
            style={{
              marginBottom: "2rem",
              textAlign: "center",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "1rem",
              background: "#222",
              color: "#f1f1f1",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#fafafa" }}>{matchKey}</div>
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>Red</span> {red.join(", ")}
              {" vs. "}
              <span style={{ color: "#4d8cff", fontWeight: "bold" }}>Blue</span> {blue.map(b => `${b}`).join(", ")}
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "#ff4d4d" }}>{redScore}</span> -- <span style={{ color: "#4d8cff" }}>{blueScore}</span>
            </div>
            <div>
              Predicted winner:{" "}
              <span
                style={{
            fontWeight: "bold",
            color: winner === "red" ? "#ff4d4d" : "#4d8cff",
            background: "#181818",
            padding: "0.2em 0.6em",
            borderRadius: 4,
                }}
              >
                {winner === "red" ? "Red" : "Blue"}
              </span>
            </div>
          </li>
              );
            })}
          </ul>
        </div>
      </main>
      <LogoButton />
    </div>
  );
}
