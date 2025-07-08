import styles from "../../page.module.css";
import { getTeamStats, EventDataType, getTeamInfo } from "../../lib/team";
import LogoButton from "../../components/LogoButton";
import { getGlobalStats } from "@/app/lib/global";

export default async function TeamPage({ params }: { params: Promise<{ teamAndYear: string }> }) {
  const { teamAndYear } = await params;
  const [teamKey, year] = teamAndYear.split("-");
  const yearprov = year ?? "2025"
  const teamStats = await getTeamStats(teamKey, Number(yearprov));
  const teamInfo = await getTeamInfo(teamKey);

  const gstats = await getGlobalStats(Number(yearprov));

  let teamIndex = -1;

  let sum = 0.0;

  for (const [index, team] of Object.entries(gstats)) {
    if (team.teamKey === teamKey) {
      teamIndex = Number(index) + 1;
    }
    sum += team.bestFSM;
  }
  const mean = sum / gstats.length;

  let sum_variance = 0.0;
  for (const team of gstats) {
    const diff = team.bestFSM - mean;
    sum_variance += diff * diff;
  }
  const variance = sum_variance / gstats.length;
  const stddev = Math.sqrt(variance);

  console.log(`Mean: ${mean}, Variance: ${variance}, StdDev: ${stddev}`);

  const pct = (Number(teamIndex) / gstats.length * 100.0).toFixed(1);

  const normalizedFSM = ((teamStats.bestFSM - mean) / stddev * 100.0 + 1500.0).toFixed(0);

  return (
    <div className={styles.page} style={{ position: "relative", minHeight: "100vh" }}>
      <main className={styles.main}>
        <h1 className={styles.title}>FunkyStats: Team FSM</h1>
        <p className={styles.smallheader}>{teamKey}, {teamInfo.nickname}</p>
        <p className={styles.smallheader}>{teamInfo.state_prov}, {teamInfo.city}, {teamInfo.country}</p>
        <div className={styles.table}>
        <div className={styles.fsmtitle}>FSM: {teamStats.bestFSM}, Global Rank: {teamIndex}, Top {pct}%</div>
        <div className={styles.fsmtitle}>Normalized FSM: {normalizedFSM}</div>
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
