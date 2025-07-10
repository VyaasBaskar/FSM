import styles from "../../page.module.css";
import { getEventTeams, TeamDataType } from "../../lib/event";
import LogoButton from "../../components/LogoButton";
import Link from "next/link";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode);

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
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Team</th>
              <th className={styles.th}>Rank</th>
              <th className={styles.th}>FSM</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team: TeamDataType) => (
              <tr key={team.key}>
                <td className={styles.td}>{team.key}</td>
                <td className={styles.td}>{team.rank}</td>
                <td className={styles.td}>{team.fsm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      <LogoButton />
    </div>
  );
}
