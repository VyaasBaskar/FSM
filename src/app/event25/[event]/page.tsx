import styles from "../../page.module.css";
import { getEventTeams, TeamDataType } from "../../lib/event";
import LogoButton from "../../components/LogoButton";
import Link from "next/link";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode, true);

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
        <div style={{justifyContent: "center"}}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Team</th>
              <th className={styles.th}>Rank</th>
              <th className={styles.th}>FSM</th>
              <th className={styles.th}>Auto</th>
              <th className={styles.th}>Coral</th>
              <th className={styles.th}>Algae</th>
              <th className={styles.th}>CYP</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team: TeamDataType) => (
              <tr key={team.key}>
                <td className={styles.td}>{team.key}</td>
                <td className={styles.td}>{team.rank}</td>
                <td className={styles.td}>{team.fsm}</td>
                <td className={styles.td}>{team.auto}</td>
                <td className={styles.td}>{team.coral}</td>
                <td className={styles.td}>{team.algae}</td>
                <td className={styles.td}> {(Number(team.algae) * 1.4 + Number(team.auto) + Number(team.coral)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </main>
      <LogoButton />
    </div>
  );
}
