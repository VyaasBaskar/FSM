import styles from "../../page.module.css";
import { getEventTeams } from "../../lib/event";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams(eventCode);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Event FSM</h1>
        <h2 className={styles.table}>{eventCode}</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Team</th>
              <th className={styles.th}>Rank</th>
              <th className={styles.th}>FSM</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team: any) => (
              <tr key={team.key}>
                <td className={styles.td}>{team.key}</td>
                <td className={styles.td}>{team.rank}</td>
                <td className={styles.td}>{team.fsm}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
