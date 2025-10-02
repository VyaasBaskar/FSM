"use client";
import PredEventTable from "../../components/PredEventTable";
import styles from "../../page.module.css";

function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z >= 0 ? 1 - prob : prob;
}

function estimateWinRate(dataset: number[], x: number): number {
  const mean = dataset.reduce((a, b) => a + b, 0) / dataset.length;
  const stdDev = Math.sqrt(
    dataset.reduce((a, b) => a + (b - mean) ** 2, 0) / dataset.length
  );
  return 1 - normalCDF((mean - x) / (Math.sqrt(5) * stdDev));
}

interface ClientPageProps {
  code: string;
  fsms: { [key: string]: number };
}

export default function ClientPage({ code, fsms }: ClientPageProps) {
  const filteredFsms = [];

  const sortedFsms = Object.entries(fsms).sort((a, b) => b[1] - a[1]);

  let fsmRank = 1;
  for (const [teamKey, fsmValue] of sortedFsms) {
    if (fsmValue > 0) {
      filteredFsms.push({
        key: teamKey,
        fsm: fsmValue.toFixed(2),
        rank: fsmRank,
      });
      fsmRank++;
    }
  }

  const RPs: { [key: string]: number } = {};

  for (const [teamKey, fsmValue] of Object.entries(fsms)) {
    RPs[teamKey] =
      estimateWinRate(
        filteredFsms.map((f) => Number(f.fsm)),
        fsmValue
      ) * 3;
  }

  console.log(RPs);
  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>Event FSM</h1>
        <h2 className={styles.table}>2025{code}</h2>
        <h3
          style={{ fontWeight: "normal", margin: "1rem", textAlign: "center" }}
        >
          Complete event information is unavailable because the match schedule
          is not present on The Blue Alliance.
        </h3>
        <PredEventTable teams={filteredFsms} />
      </main>
    </div>
  );
}
