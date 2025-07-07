import styles from "../../page.module.css";
import { getTeamStats, EventDataType, getTeamInfo } from "../../lib/team";
import LogoButton from "../../components/LogoButton";

export default async function TeamPage({ params }: { params: Promise<{ teamAndYear: string }> }) {
  const { teamAndYear } = await params;
  const [teamKey, year] = teamAndYear.split("-");
  const yearprov = year ?? "2025"
  const teamStats = await getTeamStats(teamKey, Number(yearprov));
  const teamInfo = await getTeamInfo(teamKey);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Team FSM</h1>
        <p className={styles.smallheader}>{teamKey}, {teamInfo.nickname}</p>
        <p className={styles.smallheader}>{teamInfo.state_prov}, {teamInfo.city}, {teamInfo.country}</p>
        <div className={styles.table}>
        <div className={styles.fsmtitle}>FSM: {teamStats.bestFSM}</div>
        <table>
          <thead>
            <tr>
              <th className={styles.th}>Event Code</th>
              <th className={styles.th}>Rank</th>
              <th className={styles.th}>Team FSM</th>
            </tr>
          </thead>
          <tbody>
            {teamStats.teamData.map((event: EventDataType) => (
              <tr key={event.event}>
                <td className={styles.td}>{event.event}</td>
                <td className={styles.td}>{event.teamrank}</td>
                <td className={styles.td}>{event.teamfsm}</td>
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
