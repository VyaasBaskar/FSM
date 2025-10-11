/* eslint-disable */
import styles from "../../page.module.css";
import {
  getTeamStats,
  EventDataType,
  getTeamInfo,
  getTeamMedia,
} from "../../lib/team";
import { getGlobalStats } from "@/app/lib/global";
import Link from "next/link";
import InteractiveChart from "../../components/Graph";

import StatCard from "./StatCard";
import EventCard from "./EventCard";
import TeamImageGallery from "./TeamImageGallery";

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
        gap: "0.5rem",
        marginTop: "1rem",
        marginBottom: "2rem",
        padding: "0 1rem",
      }}
    >
      {years.map((y) => (
        <Link
          key={y}
          href={`/team/${teamKey}-${y}`}
          style={{
            padding: "0.65rem 1.25rem",
            borderRadius: 8,
            border:
              y.toString() === currentYear
                ? "2px solid var(--yellow-color)"
                : "2px solid var(--border-color)",
            backgroundColor:
              y.toString() === currentYear
                ? "var(--yellow-color)"
                : "var(--background-pred)",
            color: y.toString() === currentYear ? "#000" : "var(--foreground)",
            fontWeight: "bold",
            textDecoration: "none",
            transition: "all 0.2s ease",
            boxShadow:
              y.toString() === currentYear
                ? "0 4px 12px rgba(253, 224, 71, 0.3)"
                : "0 2px 4px rgba(0, 0, 0, 0.1)",
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

    const yearResults = await Promise.allSettled(
      years.map((y) => getGlobalStats(y))
    );

    yearResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        const y = years[idx];
        const globalStats = result.value;

        const teamGlobalData = globalStats.find(
          (t: any) => t.teamKey === teamKey
        );
        if (!teamGlobalData) return;

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
      }
    });
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
          <h1 className={styles.title}>10-Year Team Analysis</h1>
          <h2
            style={{
              color: "var(--yellow-color)",
              textAlign: "center",
              fontSize: "2rem",
              marginTop: "-1rem",
            }}
          >
            {teamKey}
          </h2>
          <YearButtons teamKey={teamKey} currentYear={"general"} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
              padding: "0 1rem",
              marginBottom: "2rem",
            }}
          >
            <StatCard
              label="RMS NORMALIZED FSM"
              value={Number(avgNormFSM).toFixed(0)}
              subtitle="2013–2025"
            />
            <StatCard
              label="PERCENTILE"
              value={`${(100 - teamPercentile).toFixed(1)}%`}
              subtitle={`Top ${(100 - teamPercentile).toFixed(1)}%`}
              color="#22c55e"
            />
          </div>

          <div
            style={{
              background: "var(--background-pred)",
              border: "2px solid var(--border-color)",
              borderRadius: 12,
              padding: "2rem",
              margin: "0 auto 2rem",
              maxWidth: "1000px",
              boxShadow:
                "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h3
              style={{
                color: "var(--foreground)",
                textAlign: "center",
                marginBottom: "1.5rem",
                fontSize: "1.25rem",
              }}
            >
              Historical Performance
            </h3>
            <InteractiveChart
              allStats={allStats}
              minPossibleFSM={minPossibleFSM}
              maxPossibleFSM={maxPossibleFSM}
            />
          </div>

          <div
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              overflowX: "auto",
              borderRadius: 12,
              border: "2px solid var(--border-color)",
              boxShadow:
                "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "400px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--gray-more)",
                    borderBottom: "2px solid var(--border-color)",
                  }}
                >
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "700",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      color: "var(--yellow-color)",
                    }}
                  >
                    YEAR
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      fontWeight: "700",
                      fontSize: "0.875rem",
                      letterSpacing: "0.05em",
                      color: "var(--yellow-color)",
                    }}
                  >
                    NORMALIZED FSM
                  </th>
                </tr>
              </thead>
              <tbody>
                {allStats
                  .slice()
                  .reverse()
                  .map((s, idx) => (
                    <tr
                      key={s.year}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        background: "var(--background-pred)",
                      }}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          fontWeight: "600",
                        }}
                      >
                        {s.year}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontWeight: "bold",
                          fontSize: "1.125rem",
                          color: "var(--yellow-color)",
                        }}
                      >
                        {s.normFSM.toFixed(0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
  let teamInfo;
  let gstats;
  let teamMedia;

  try {
    [teamStats, teamInfo, gstats, teamMedia] = await Promise.all([
      getTeamStats(teamKey, Number(yearprov)),
      getTeamInfo(teamKey),
      getGlobalStats(Number(yearprov)),
      getTeamMedia(teamKey, Number(yearprov)),
    ]);
  } catch {
    return (
      <div
        className={styles.page}
        style={{ position: "relative", minHeight: "100vh", width: "100%" }}
      >
        <main className={styles.main}>
          <h1 className={styles.title}>Team Not Found</h1>
          <YearDropdown teamKey={teamKey} currentYear={yearprov} />
          <div
            style={{
              background: "var(--background-pred)",
              border: "2px solid var(--border-color)",
              borderRadius: 12,
              padding: "3rem",
              maxWidth: "600px",
              margin: "0 auto",
              textAlign: "center",
              boxShadow:
                "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⚠️</div>
            <h2
              style={{
                color: "var(--foreground)",
                marginBottom: "1rem",
              }}
            >
              No Data Available
            </h2>
            <p
              style={{
                color: "var(--gray-less)",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              The team "{teamKey}" does not have data for the year {yearprov}.
              <br />
              Please check the team key and year, or select a different year
              above.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
            textAlign: "center",
            marginTop: "-1rem",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              color: "var(--yellow-color)",
              fontSize: "2rem",
              marginBottom: "0.5rem",
            }}
          >
            {teamKey}
          </h2>
          <p
            style={{
              color: "var(--foreground)",
              fontSize: "1.25rem",
              fontWeight: "600",
            }}
          >
            {teamInfo.nickname}
          </p>
          <p style={{ color: "var(--gray-less)", fontSize: "1rem" }}>
            {teamInfo.city}, {teamInfo.state_prov}, {teamInfo.country}
          </p>
        </div>

        <YearButtons teamKey={teamKey} currentYear={yearprov} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: teamMedia.length > 0 ? "1fr 400px" : "1fr",
            gap: "1.5rem",
            padding: "0 1rem",
            alignItems: "start",
          }}
          className="team-layout-grid"
        >
          {/* Main Content Column */}
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                justifyContent: "center",
                marginBottom: "2rem",
              }}
            >
              <StatCard label="FSM" value={fsm.toFixed(1)} />
              <StatCard
                label="GLOBAL RANK"
                value={`#${teamIndex}`}
                color="#22c55e"
              />
              <StatCard
                label="TOP PERCENTILE"
                value={`${pct}%`}
                color="#10b981"
              />
              <StatCard
                label="NORMALIZED FSM"
                value={normalizedFSM}
                color="#84cc16"
              />
            </div>

            <div>
              <h3
                style={{
                  color: "var(--foreground)",
                  textAlign: "center",
                  marginBottom: "1.5rem",
                  fontSize: "1.5rem",
                }}
              >
                Event Performance
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                  gap: "1rem",
                }}
              >
                {teamStats.teamData.map((event: EventDataType) => (
                  <EventCard
                    key={event.event}
                    event={event}
                    yearprov={yearprov}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Media Gallery Column */}
          {teamMedia.length > 0 && (
            <div>
              <TeamImageGallery
                images={teamMedia}
                teamKey={teamKey}
                year={yearprov}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
