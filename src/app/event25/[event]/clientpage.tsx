"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../../page.module.css";
import dynamic from "next/dynamic";
import type * as ort from "onnxruntime-web";
import { ClientPageProps } from "./types";
import AlliancePredictions from "./AlliancePredictions";
import MatchPredictions from "./MatchPredictions";

const loadOnnxRuntime = () => import("onnxruntime-web");

const Event25TeamsTable = dynamic(
  () => import("../../components/Event25TeamsTable"),
  {
    loading: () => <div>Loading team stats...</div>,
    ssr: false,
  }
);

export default function ClientPage({
  havePreds,
  eventCode,
  teams,
  matchPredictions,
  playedMatches,
  actualAlliances,
  nexusSchedule,
}: ClientPageProps) {
  console.log("actualAlliances received:", actualAlliances);
  console.log("Event code:", eventCode);

  const [activeTab, setActiveTab] = useState<"stats" | "preds" | "alliances">(
    "stats"
  );
  const [sessionReady, setSessionReady] = useState(false);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const ort = await loadOnnxRuntime();
        const session = await ort.InferenceSession.create("/matchpred.onnx");
        sessionRef.current = session;
        setSessionReady(true);
      } catch (err) {
        console.error("Failed to load ONNX model:", err);
      }
    }
    if (havePreds) {
      loadModel();
    }
  }, [havePreds]);

  async function runOnnxModel(inputData: Float32Array) {
    if (!sessionRef.current) throw new Error("ONNX session not loaded.");

    const ort = await loadOnnxRuntime();
    const inputTensor = new ort.Tensor("float32", inputData, [1, 17]);
    const feeds: Record<string, typeof inputTensor> = {
      [sessionRef.current.inputNames[0]]: inputTensor,
    };

    const results = await sessionRef.current.run(feeds);
    const output = results[sessionRef.current.outputNames[0]].data;
    return Number(output[0]);
  }

  const makeInput = (
    alliance: {
      fsm: number;
      algae: number;
      coral: number;
      auto: number;
      climb: number;
    }[],
    compLevel: number,
    match: { match_number: number }
  ) =>
    new Float32Array([
      ...alliance.flatMap((t) => [
        Number(t.fsm),
        Number(t.algae),
        Number(t.coral),
        Number(t.auto),
        Number(t.climb),
      ]),
      compLevel,
      Number(match.match_number),
    ]);

  return (
    <div
      className={styles.page}
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100%",
      }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>Event FSM</h1>
        <h2 className={styles.table}>2025{eventCode}</h2>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => setActiveTab("stats")}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "stats" ? "#333" : "#222",
              color: activeTab === "stats" ? "#fff" : "#ccc",
              border: "1px solid #555",
              cursor: "pointer",
            }}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab("preds")}
            disabled={!havePreds}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "preds" ? "#333" : "#222",
              color: havePreds
                ? activeTab === "preds"
                  ? "#fff"
                  : "#ccc"
                : "#888",
              border: "1px solid #555",
              cursor: havePreds ? "pointer" : "not-allowed",
            }}
          >
            Matches
          </button>
          <button
            onClick={() => setActiveTab("alliances")}
            disabled={!havePreds}
            style={{
              padding: "0.5rem 1rem",
              fontWeight: "bold",
              borderRadius: 6,
              background: activeTab === "alliances" ? "#333" : "#222",
              color: havePreds
                ? activeTab === "alliances"
                  ? "#fff"
                  : "#ccc"
                : "#888",
              border: "1px solid #555",
              cursor: havePreds ? "pointer" : "not-allowed",
            }}
          >
            Alliances
          </button>
        </div>

        {activeTab === "stats" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "var(--foreground)",
              width: "100%",
              padding: "1rem 0",
            }}
          >
            <h2
              style={{
                color: "var(--foreground)",
                textAlign: "center",
                marginBottom: "2rem",
              }}
            >
              Team Statistics
            </h2>
            <Event25TeamsTable teams={teams} />
          </div>
        )}

        {activeTab === "preds" && havePreds && (
          <MatchPredictions
            matchPredictions={matchPredictions}
            nexusSchedule={nexusSchedule}
          />
        )}

        {activeTab === "alliances" && (
          <AlliancePredictions
            teams={teams}
            playedMatches={playedMatches}
            actualAlliances={actualAlliances}
            sessionReady={sessionReady}
            runOnnxModel={runOnnxModel}
            makeInput={makeInput}
          />
        )}
      </main>
    </div>
  );
}
