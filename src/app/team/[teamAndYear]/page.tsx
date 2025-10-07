/* eslint-disable */
import styles from "../../page.module.css";
import { getTeamStats, EventDataType, getTeamInfo } from "../../lib/team";
import { getGlobalStats } from "@/app/lib/global";
import Link from "next/link";
import InteractiveChart from "../../components/Graph";

function YearButtons({
  teamKey,
  currentYear,
}: {
  teamKey: string;
  currentYear: string;
}) {
  const years = [
    "general",
    ...Array.from({ length: 13 }, (_, i) => 2013 + i).filter(
      (y) => y !== 2020 && y !== 2021
    ),
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
        marginTop: "16px",
        marginBottom: "24px",
      }}
    >
      {years.map((y) => (
        <Link
          key={y}
          href={`/team/${teamKey}-${y}`}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor:
              y.toString() === currentYear ? "#0070f3" : "var(--yellow-color)",
            color: y.toString() === currentYear ? "white" : "black",
            fontWeight: "bold",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
        >
          {y}
        </Link>
      ))}
    </div>
  );
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamAndYear: string }>;
}) {
  const { teamAndYear } = await params;
  const [teamKey, year] = teamAndYear.split("-");

  if (year === "general") {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i)
      .filter((y) => y !== 2020 && y !== 2021 && y >= 2013)
      .reverse();

    let normSumSq = 0,
      normCount = 0;
    let allStats: { year: number; normFSM: number }[] = [];
    for (const y of years) {
      try {
        const globalStats = await getGlobalStats(y);

        const teamGlobalData = globalStats.find(
          (t: any) => t.teamKey === teamKey
        );
        if (!teamGlobalData) continue;

        const fsms = globalStats.map((t: any) => Number(t.bestFSM));
        const mean = fsms.reduce((a, b) => a + b, 0) / fsms.length;
        const variance =
          fsms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fsms.length;
        const stddev = Math.sqrt(variance);
        const fsm = Number(teamGlobalData.bestFSM);
        if (!isNaN(fsm) && stddev > 0) {
          const normFSM = ((fsm - mean) / stddev) * 100.0 + 1500.0;
          allStats.push({ year: y, normFSM });
        }
      } catch {}
    }
    const statsForAvg =
      allStats.length > 1
        ? allStats.filter(
            (s) => s.normFSM !== Math.min(...allStats.map((a) => a.normFSM))
          )
        : allStats;

    for (const s of statsForAvg) {
      normSumSq += s.normFSM * s.normFSM;
      normCount++;
    }

    const avgNormFSM =
      normCount > 0 ? Math.sqrt(normSumSq / normCount).toFixed(0) : 1500;

    const minTeamFSM = Math.min(...allStats.map((s) => s.normFSM));
    const maxTeamFSM = Math.max(...allStats.map((s) => s.normFSM));

    const minPossibleFSM = Math.floor(minTeamFSM / 50) * 50 - 50;
    const maxPossibleFSM = Math.ceil(maxTeamFSM / 50) * 50 + 50;

    const teamPercentile = (() => {
      const globalAvg = 1500.0;
      const globalStdDev = 100.0;
      const z = (Number(avgNormFSM) - globalAvg) / globalStdDev;
      function erf(x: number): number {
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        const t = 1.0 / (1.0 + p * x);
        const y =
          1.0 -
          ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
      }
      const percentile = 0.5 * (1 + erf(z / Math.sqrt(2)));
      return Math.round(percentile * 100);
    })();

    return (
      <div
        className={styles.page}
        style={{ position: "relative", minHeight: "100vh", width: "100%" }}
      >
        <main className={styles.main}>
          <h1 className={styles.title}>10-Year Team FSM Analysis</h1>
          <YearButtons teamKey={teamKey} currentYear={"general"} />
          <div
            style={{
              width: "100%",
              textAlign: "center",
              justifyContent: "center",
              marginBottom: 12,
              marginTop: 12,
            }}
          >
            <p className={styles.smallheader}>{teamKey}</p>
            <div className={styles.table}>
              <div className={styles.fsmtitle}>
                RMS normalized FSM (2013–2025): {Number(avgNormFSM).toFixed(1)}{" "}
                <br></br>
                Top {(100 - teamPercentile).toFixed(2)}%
              </div>
              <div
                style={{
                  margin: "24px auto",
                  width: "100%",
                  maxWidth: "900px",
                  padding: "0 10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <InteractiveChart
                  allStats={allStats}
                  minPossibleFSM={minPossibleFSM}
                  maxPossibleFSM={maxPossibleFSM}
                />
              </div>
              <div style={{ marginTop: 24 }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Year</th>
                      <th className={styles.th}>Normalized FSM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStats
                      .slice()
                      .reverse()
                      .map((s) => (
                        <tr key={s.year}>
                          <td className={styles.td}>{s.year}</td>
                          <td className={styles.td}>{s.normFSM.toFixed(0)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  let yearprov = year ?? "2025";
  if (
    Number(yearprov) < 2013 ||
    Number(yearprov) === 2021 ||
    Number(yearprov) === 2020 ||
    Number(yearprov) > 2025
  ) {
    yearprov = "2025";
  }
  let teamStats;
  try {
    teamStats = await getTeamStats(teamKey, Number(yearprov));
  } catch {
    return (
      <div
        className={styles.page}
        style={{ position: "relative", minHeight: "100vh", width: "100%" }}
      >
        <main className={styles.main} style={{ marginTop: "-8rem" }}>
          <h1 className={styles.title}>Team Not Found</h1>
          <YearButtons teamKey={teamKey} currentYear={yearprov} />
          <div
            style={{
              width: "100%",
              textAlign: "center",
              justifyContent: "center",
              marginBottom: 12,
              marginTop: 12,
            }}
          >
            <p className={styles.smallheader}>
              The team "{teamKey}" does not have data for the year {yearprov}.
            </p>
            <p className={styles.smallheader}>
              Please check the team key and year, or select a different year.
            </p>
          </div>
        </main>
      </div>
    );
  }
  const teamInfo = await getTeamInfo(teamKey);

  const gstats = await getGlobalStats(Number(yearprov));

  let teamIndex = -1;

  let fsm = 0.0;

  let sum = 0.0;

  for (const [index, team] of Object.entries(gstats)) {
    if (team.teamKey === teamKey) {
      teamIndex = Number(index) + 1;
      fsm = Number(team.bestFSM);
    }
    sum += Number(team.bestFSM);
  }
  const mean = sum / gstats.length;

  let sum_variance = 0.0;
  for (const team of gstats) {
    const diff = Number(team.bestFSM) - mean;
    sum_variance += diff * diff;
  }
  const variance = sum_variance / gstats.length;
  const stddev = Math.sqrt(variance);

  console.log(`Mean: ${mean}, Variance: ${variance}, StdDev: ${stddev}`);

  const pct = ((Number(teamIndex) / gstats.length) * 100.0).toFixed(1);

  const normalizedFSM = (((fsm - mean) / stddev) * 100.0 + 1500.0).toFixed(0);

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh", width: "100%" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>{yearprov} Team FSM</h1>
        <YearButtons teamKey={teamKey} currentYear={yearprov} />
        <div
          style={{
            width: "100%",
            textAlign: "center",
            justifyContent: "center",
            marginBottom: 12,
            marginTop: 12,
          }}
        >
          <p className={styles.smallheader}>
            {teamKey}, {teamInfo.nickname}
          </p>
          <p className={styles.smallheader}>
            {teamInfo.state_prov}, {teamInfo.city}, {teamInfo.country}
          </p>
          <div className={styles.table}>
            <div className={styles.fsmtitle}>
              FSM: {fsm}, Global Rank: {teamIndex}, Top {pct}%
            </div>
            <div className={styles.fsmtitle}>
              Normalized FSM: {normalizedFSM}
            </div>
            <div>
              <table className={styles.table}>
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
                      <td className={styles.td}>
                        <Link
                          href={
                            Number(yearprov) === 2025
                              ? `/event25/${event.event.slice(4)}`
                              : `/event/${event.event}`
                          }
                          style={{
                            textDecoration: "underline",
                            textDecorationThickness: "1px",
                            textUnderlineOffset: "4px",
                          }}
                        >
                          {event.event}
                        </Link>
                      </td>
                      <td className={styles.td}>{event.teamrank}</td>
                      <td className={styles.td}>{event.teamfsm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
