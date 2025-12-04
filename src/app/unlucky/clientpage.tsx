"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../page.module.css";
import UnluckyTable from "./UnluckyTable";

interface UnluckyData {
  teamKey: string;
  unluckyPoints: number;
  eventCount: number;
  unluckyPerEvent?: number;
  rmsFsm?: number;
}

const years = [2022, 2023, 2024, 2025];

export default function UnluckyClientPage() {
  const [unluckyData, setUnluckyData] = useState<UnluckyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentYearProgress, setCurrentYearProgress] = useState({
    processed: 0,
    total: 0,
  });
  const [isComplete, setIsComplete] = useState(false);
  const [completedYears, setCompletedYears] = useState(0);
  const [filterMinFsm, setFilterMinFsm] = useState(false);
  const [rmsFsmMap, setRmsFsmMap] = useState<{ [key: string]: number }>({});

  const yearIndexRef = useRef(0);
  const isProcessingRef = useRef(false);
  const allDataRef = useRef<{ [key: string]: UnluckyData }>({});

  useEffect(() => {
    async function fetchRmsFsm() {
      try {
        const response = await fetch("/api/rms-fsm", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch RMS FSM");
        }
        const fsmMap = await response.json();
        console.log(
          "RMS FSM map sample:",
          Object.keys(fsmMap).slice(0, 5),
          Object.values(fsmMap).slice(0, 5)
        );
        setRmsFsmMap(fsmMap);
      } catch (error) {
        console.error("Error fetching RMS FSM:", error);
      }
    }
    fetchRmsFsm();
  }, []);

  useEffect(() => {
    let mounted = true;
    const batchSize = 100;
    const concurrentYears = 2;

    async function processYear(
      year: number,
      yearBatchStart: number
    ): Promise<void> {
      try {
        const response = await fetch(
          `/api/unlucky?year=${year}&batchStart=${yearBatchStart}&batchSize=${batchSize}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data for year ${year}`);
        }

        const result = await response.json();

        if (mounted) {
          result.data.forEach((item: UnluckyData) => {
            if (allDataRef.current[item.teamKey]) {
              allDataRef.current[item.teamKey].unluckyPoints +=
                item.unluckyPoints;
              allDataRef.current[item.teamKey].eventCount += item.eventCount;
            } else {
              allDataRef.current[item.teamKey] = { ...item };
            }
          });

          const sorted = Object.values(allDataRef.current)
            .map((item) => {
              const normalizedKey = item.teamKey.replace(/^frc/, "");
              const rmsFsm = rmsFsmMap[normalizedKey];
              return {
                ...item,
                unluckyPerEvent:
                  item.unluckyPoints / Math.max(item.eventCount, 10),
                rmsFsm: rmsFsm,
              };
            })
            .sort((a, b) => b.unluckyPerEvent - a.unluckyPerEvent)
            .slice(0, 200);

          const filtered = sorted.filter(
            (item) =>
              !filterMinFsm ||
              (item.rmsFsm !== undefined && item.rmsFsm >= 1650)
          );

          setUnluckyData(filtered);

          if (mounted && year === years[yearIndexRef.current]) {
            setCurrentYearProgress({
              processed: result.processed + result.batchStart,
              total: result.total,
            });
          }

          if (result.hasMore) {
            await processYear(year, yearBatchStart + result.processed);
          }
        }
      } catch (error) {
        console.error(`Error processing year ${year}:`, error);
      }
    }

    async function processNextBatch() {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      if (yearIndexRef.current >= years.length) {
        if (mounted) {
          setIsComplete(true);
          setIsLoading(false);
        }
        isProcessingRef.current = false;
        return;
      }

      const yearPromises: Promise<void>[] = [];
      const yearsToProcess = years.slice(
        yearIndexRef.current,
        yearIndexRef.current + concurrentYears
      );

      if (mounted && yearsToProcess.length > 0) {
        setCurrentYear(yearsToProcess[0]);
      }

      for (const year of yearsToProcess) {
        yearPromises.push(processYear(year, 0));
      }

      await Promise.all(yearPromises);

      if (mounted) {
        yearIndexRef.current += yearsToProcess.length;
        setCompletedYears(yearIndexRef.current);
        isProcessingRef.current = false;
        processNextBatch();
      }
    }

    processNextBatch();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Object.keys(allDataRef.current).length === 0) return;

    const sorted = Object.values(allDataRef.current)
      .map((item) => {
        const normalizedKey = item.teamKey.replace(/^frc/, "");
        const rmsFsm = rmsFsmMap[normalizedKey];
        return {
          ...item,
          unluckyPerEvent: item.unluckyPoints / Math.max(item.eventCount, 10),
          rmsFsm: rmsFsm,
        };
      })
      .filter(
        (item) =>
          !filterMinFsm || (item.rmsFsm !== undefined && item.rmsFsm >= 1650)
      )
      .sort((a, b) => b.unluckyPerEvent - a.unluckyPerEvent)
      .slice(0, 200);

    setUnluckyData(sorted);
  }, [filterMinFsm, rmsFsmMap]);

  const totalYears = years.length;
  const progressPercent =
    totalYears > 0 ? (completedYears / totalYears) * 100 : 0;

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>Most Unlucky Teams (2022-2025)</h1>
        <p
          style={{
            margin: "1rem 0",
            textAlign: "center",
            opacity: 0.85,
            maxWidth: "800px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          This page calculates unluckiness for all teams from 2022 to 2025.
          Unluckiness is a combination of strength-of-schedule (75%), ranking
          lower than expected (20%), and being picked by a low-strength captain
          that ranked abnormally high (5%). &quot;Unlucky points&quot; are
          accumulated across all in-season events between 2022 and 2025.
        </p>

        {isLoading && (
          <div
            style={{
              margin: "2rem auto",
              maxWidth: "600px",
              padding: "1.5rem",
              background: "var(--gray-more)",
              borderRadius: "12px",
              border: "2px solid var(--border-color)",
            }}
          >
            <div style={{ marginBottom: "1rem", fontWeight: 600 }}>
              Calculating unluckiness...
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              Processing year: {currentYear || "..."}
            </div>
            {currentYearProgress.total > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Events: {currentYearProgress.processed} /{" "}
                  {currentYearProgress.total}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "var(--border-color)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (currentYearProgress.processed /
                          currentYearProgress.total) *
                        100
                      }%`,
                      height: "100%",
                      background: "var(--yellow-color)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            )}
            <div style={{ marginTop: "1rem" }}>
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                Overall progress: {completedYears} / {totalYears} years
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "var(--border-color)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "var(--yellow-color)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!isLoading && isComplete && (
          <div
            style={{
              margin: "1rem auto",
              maxWidth: "600px",
              padding: "1rem",
              background: "var(--gray-more)",
              borderRadius: "12px",
              border: "2px solid var(--border-color)",
              textAlign: "center",
              color: "var(--yellow-color)",
              fontWeight: 600,
            }}
          >
            ✓ Calculation complete!
          </div>
        )}

        {!isLoading && isComplete && (
          <div
            style={{
              margin: "1rem auto",
              maxWidth: "1200px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={filterMinFsm}
                onChange={(e) => setFilterMinFsm(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer",
                }}
              />
              <span>Filter out teams with less than 1650 RMS FSM</span>
            </label>
          </div>
        )}

        {unluckyData.length > 0 && <UnluckyTable data={unluckyData} />}
      </main>
    </div>
  );
}
