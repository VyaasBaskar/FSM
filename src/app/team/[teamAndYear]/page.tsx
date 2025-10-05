/* eslint-disable */
import styles from "../../page.module.css";
import { getTeamStats, EventDataType, getTeamInfo } from "../../lib/team";
import { getGlobalStats } from "@/app/lib/global";
import Link from "next/link";

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
      .filter(y => y !== 2020 && y !== 2021)
      .slice(0, 10) 
      .reverse(); 

    let normSum = 0, normCount = 0;
    let allStats: { year: number, normFSM: number }[] = [];
    for (const y of years) {
      try {
        const globalStats = await getGlobalStats(y);
      
        const teamGlobalData = globalStats.find((t: any) => t.teamKey === teamKey);
        if (!teamGlobalData) continue;
        
        const fsms = globalStats.map((t: any) => Number(t.bestFSM));
        const mean = fsms.reduce((a, b) => a + b, 0) / fsms.length;
        const variance = fsms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fsms.length;
        const stddev = Math.sqrt(variance);
        const fsm = Number(teamGlobalData.bestFSM);
        if (!isNaN(fsm) && stddev > 0) {
          const normFSM = ((fsm - mean) / stddev * 100.0 + 1500.0);
          normSum += normFSM;
          normCount++;
          allStats.push({ year: y, normFSM });
        }
      } catch {}
    }
    const avgNormFSM = (normCount > 0) ? (normSum / normCount).toFixed(0) : "N/A";

    const minTeamFSM = Math.min(...allStats.map(s => s.normFSM));
    const maxTeamFSM = Math.max(...allStats.map(s => s.normFSM));

    const minPossibleFSM = Math.floor(minTeamFSM / 50) * 50 - 50;
    const maxPossibleFSM = Math.ceil(maxTeamFSM / 50) * 50 + 50;

    const leftPadding = 70 + (maxPossibleFSM > 999 ? 10 : 0);
    const rightPadding = 30;
    const topPadding = 30;
    const bottomPadding = 35;
    
    const width = 500;
    const height = 260;
    
    const points = allStats.map((s, i) => {
      const x = leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1);
      const y = height - bottomPadding - ((s.normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding);
      return `${x},${y}`;
    }).join(" ");
    return (
      <div className={styles.page} style={{ position: "relative", minHeight: "100vh", width: "100%" }}>
        <a
          href="/"
          style={{ position: "absolute", top: 24, left: 24, textDecoration: "none", color: "inherit", fontSize: "4rem", display: "flex", alignItems: "center", zIndex: 10 }}
          aria-label="Back to Home"
        >
          &#8592;
        </a>
        <main className={styles.main}>
          <h1 className={styles.title}>FunkyStats Team FSM: General (10-Year Analysis)</h1>
          <div style={{ width: "100%", textAlign: "center", justifyContent: "center", marginBottom: 12, marginTop: 12 }}>
            <p className={styles.smallheader}>{teamKey}</p>
            <div className={styles.table}>
              <div className={styles.fsmtitle}>Average Normalized FSM (2013–2025): {avgNormFSM}</div>
              <div style={{ margin: "24px auto", maxWidth: width }}>
                <svg width={width} height={height}>
                  {Array.from({length: (maxPossibleFSM-minPossibleFSM)/50+1}, (_, i) => {
                    const v = minPossibleFSM + i*50;
                    const y = height - bottomPadding - ((v - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM)) * (height - topPadding - bottomPadding);
                    return (
                      <g key={v}>
                        <line x1={leftPadding} y1={y} x2={width-rightPadding} y2={y} stroke="#bbb" strokeDasharray="4 2" />
                        <text x={leftPadding-12} y={y+5} fontSize="13" textAnchor="end" fill="#fff">{v}</text>
                      </g>
                    );
                  })}
                  <text x={leftPadding-45} y={height/2 - 10} fontSize="14" textAnchor="middle" fill="#fff" transform={`rotate(-90,${leftPadding-45},${height/2})`}>Normalized FSM</text>
                  <path
                    fill="none"
                    stroke="#0070f3"
                    strokeWidth="3"
                    d={(() => {
                      if (allStats.length === 0) return "";
                      if (allStats.length === 1) {
                        const x = leftPadding;
                        const y = height - bottomPadding - ((allStats[0].normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding);
                        return `M ${x},${y}`;
                      }
                      
                      let path = "";
                      const coords = allStats.map((s, i) => ({
                        x: leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1),
                        y: height - bottomPadding - ((s.normFSM - minPossibleFSM) / (maxPossibleFSM - minPossibleFSM || 1)) * (height - topPadding - bottomPadding)
                      }));
                      
                      path += `M ${coords[0].x},${coords[0].y}`;
                      
                      for (let i = 1; i < coords.length; i++) {
                        const prev = coords[i - 1];
                        const curr = coords[i];
                        const next = coords[i + 1];
                        
                        
                        const tension = 0.15;
                        const dx1 = next ? (next.x - prev.x) * tension : (curr.x - prev.x) * tension;
                        const dy1 = next ? (next.y - prev.y) * tension : (curr.y - prev.y) * tension;
                        
                        const cp1x = prev.x + dx1;
                        const cp1y = prev.y + dy1;
                        const cp2x = curr.x - dx1;
                        const cp2y = curr.y - dy1;
                        
                        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
                      }
                      
                      return path;
                    })()}
                  />
                  <line x1={leftPadding} y1={height-bottomPadding} x2={width-rightPadding} y2={height-bottomPadding} stroke="#bbb" />
                  <line x1={leftPadding} y1={topPadding} x2={leftPadding} y2={height-bottomPadding} stroke="#bbb" />
                  {allStats.map((s, i) => {
                    const x = leftPadding + (i * (width - leftPadding - rightPadding)) / (allStats.length-1);
                    return <text key={s.year} x={x} y={height-bottomPadding+20} fontSize="15" textAnchor="middle" fill="#fff">{(s.year % 100).toString().padStart(2, '0')}</text>;
                  })}
                </svg>
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
                    {allStats.slice().reverse().map(s => (
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
        <LogoButton />
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
  const teamStats = await getTeamStats(teamKey, Number(yearprov));
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
