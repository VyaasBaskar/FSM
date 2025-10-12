import styles from "../../page.module.css";
import { getGlobalStatsWithoutLocation } from "../../lib/global";
import OffseasonCheck from "./offseason";
import ProgressiveGlobalTable from "@/app/components/ProgressiveGlobalTable";
import YearDropdown from "@/app/components/YearDropdown";

export async function generateStaticParams() {
  return [
    { year: "2025" },
    { year: "2024" },
    { year: "2023" },
    { year: "2022" },
    { year: "2019" },
    { year: "2018" },
    { year: "2017" },
    { year: "2016" },
    { year: "2015" },
    { year: "2014" },
    { year: "2013" },
  ];
}

export default async function GlobalPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  let { year } = await params;

  let includeOffseason = true;
  if (year.split("-").length > 1 && year.split("-")[1] === "no") {
    includeOffseason = false;
  }

  year = year.split("-")[0];
  if (
    Number(year) < 2013 ||
    Number(year) === 2021 ||
    Number(year) === 2020 ||
    Number(year) > 2025
  ) {
    year = "2025";
  }

  const yearNum = Number(year);
  const rankingId = yearNum * 10 + (includeOffseason ? 1 : 0);

  // Fetch just FSM rankings (fast) - locations will load progressively
  const globalStats = await getGlobalStatsWithoutLocation(
    yearNum,
    includeOffseason
  );

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>{year} Global FSM Rankings</h1>
        <div
          style={{
            margin: "1rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <YearDropdown
            currentYear={year}
            includeOffseason={includeOffseason}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1.1rem",
              justifyContent: "center",
            }}
          >
            <OffseasonCheck year={year} checked={includeOffseason} />
            Include Offseason
          </label>
        </div>
        <ProgressiveGlobalTable
          initialStats={globalStats}
          year={year}
          rankingId={rankingId}
        />
      </main>
    </div>
  );
}
