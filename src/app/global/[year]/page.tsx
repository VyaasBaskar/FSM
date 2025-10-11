/* eslint-disable */
import styles from "../../page.module.css";
import { getGlobalStats } from "../../lib/global";
import OffseasonCheck from "./offseason";
import PaginatedGlobalTable from "@/app/components/PaginatedGlobalTable";

export async function generateStaticParams() {
  return [
    { year: "2025" },
    { year: "2024" },
    { year: "2023" },
    { year: "2022" },
    { year: "2019" },
    { year: "2018" },
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

  const globalStats = await getGlobalStats(Number(year), includeOffseason);

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>{year} Global FSM Rankings</h1>
        <div style={{ margin: "1rem 0" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1.1rem",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <OffseasonCheck year={year} checked={includeOffseason} />
            Include Offseason
          </label>
        </div>
        <PaginatedGlobalTable stats={globalStats} year={year} />
      </main>
    </div>
  );
}
