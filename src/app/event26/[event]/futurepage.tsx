"use client";
import { useMemo } from "react";
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
  const filteredFsms: Array<{ key: string; fsm: string; rank: number }> = [];

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

  const { topQuarterRms, overallRms, topDecileRms } = useMemo(() => {
    const fsmValues = filteredFsms
      .map((team) => Number(team.fsm))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (fsmValues.length === 0) {
      return { topQuarterRms: 0, overallRms: 0, topDecileRms: 0 };
    }

    const sorted = [...fsmValues].sort((a, b) => b - a);

    const computeRms = (values: number[]) => {
      if (values.length === 0) return 0;
      const sumSquares = values.reduce((acc, value) => acc + value * value, 0);
      return Math.sqrt(sumSquares / values.length);
    };

    const top25Count = Math.max(1, Math.ceil(sorted.length * 0.25));
    const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));

    return {
      topQuarterRms: computeRms(sorted.slice(0, top25Count)),
      overallRms: computeRms(sorted),
      topDecileRms: computeRms(sorted.slice(0, top10Count)),
    };
  }, [filteredFsms]);

  const summaryCards = useMemo(
    () => [
      { label: "Top 10% RMS FSM", value: topDecileRms },
      { label: "Top 25% RMS FSM", value: topQuarterRms },
      { label: "RMS FSM", value: overallRms },
    ],
    [topQuarterRms, overallRms, topDecileRms]
  );

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>Event FSM</h1>
        <h2 className={styles.table}>2026{code}</h2>
        <h3
          style={{ fontWeight: "normal", margin: "1rem", textAlign: "center" }}
        >
          Complete event information is unavailable because the match schedule
          is not present on The Blue Alliance.
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "1rem",
            width: "100%",
            marginBottom: "1.5rem",
          }}
        >
          {summaryCards.map(({ label, value }) => (
            <div
              key={label}
              style={{
                minWidth: "200px",
                padding: "1rem 1.5rem",
                background: "var(--background-pred)",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.9rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--gray-less)",
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                {value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <PredEventTable teams={filteredFsms} />
      </main>
    </div>
  );
}
