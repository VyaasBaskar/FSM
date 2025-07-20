"use server";

import styles from "../../page.module.css";
import LogoButton from "../../components/LogoButton";
import Link from "next/link";
import { getEventQualMatches } from "@/app/lib/event";
import { getScoutingData } from "@/app/lib/supabase";
import CompleteClientPage from "./clientpage";

export default async function ScoutingPage({
  params,
}: {
  params: Promise<{ event: string }>;
}) {
  const { event: eventCode } = await params;
  const qms = await getEventQualMatches(eventCode);

  const scoutingData: { [key: string]: any } = {};
  const sideAutoGoodRate: { [key: string]: number[] } = {};
  const centerAutoGoodRate: { [key: string]: number[] } = {};
  const climbRate: { [key: string]: number[] } = {};
  const coralScores: { [key: string]: number[] } = {};
  const algaeScores: { [key: string]: number[] } = {};
  const sd = await getScoutingData(eventCode);

  for (const d of sd) {
    const j = String(d.team_match.split("-")[1].slice(3));
    scoutingData[j] = JSON.parse(d.data);
    if (!climbRate[j]) {
      climbRate[j] = [0, 0];
    }
    climbRate[j][0] += scoutingData[j].climbed ? 1 : 0;
    climbRate[j][1] += 1;

    if (!sideAutoGoodRate[j]) {
      sideAutoGoodRate[j] = [0, 0];
    }
    sideAutoGoodRate[j][0] +=
      scoutingData[j].autoIsGood && scoutingData[j].autoIsSide ? 1 : 0;
    sideAutoGoodRate[j][1] += scoutingData[j].autoIsSide ? 1 : 0;

    if (!centerAutoGoodRate[j]) {
      centerAutoGoodRate[j] = [0, 0];
    }
    centerAutoGoodRate[j][0] +=
      scoutingData[j].autoIsGood && !scoutingData[j].autoIsSide ? 1 : 0;
    centerAutoGoodRate[j][1] += scoutingData[j].autoIsSide ? 0 : 1;

    if (!coralScores[j]) {
      coralScores[j] = [0, 0];
    }
    coralScores[j][0] += Number(scoutingData[j].coralScore || 0);
    coralScores[j][1] += 1;

    if (!algaeScores[j]) {
      algaeScores[j] = [0, 0];
    }
    algaeScores[j][0] += Number(scoutingData[j].algaeScore || 0);
    algaeScores[j][1] += 1;
  }

  const realClimbRate: { [key: string]: number } = {};
  for (const team in climbRate) {
    if (climbRate[team][1] === 0) {
      realClimbRate[team] = 0;
    } else {
      realClimbRate[team] = climbRate[team][0] / climbRate[team][1];
    }
  }
  const realCenterAutoGoodRate: { [key: string]: number } = {};
  for (const team in centerAutoGoodRate) {
    if (centerAutoGoodRate[team][1] === 0) {
      realCenterAutoGoodRate[team] = 0;
    } else {
      realCenterAutoGoodRate[team] =
        centerAutoGoodRate[team][0] / centerAutoGoodRate[team][1];
    }
  }
  const realSideAutoGoodRate: { [key: string]: number } = {};
  for (const team in sideAutoGoodRate) {
    if (sideAutoGoodRate[team][1] === 0) {
      realSideAutoGoodRate[team] = 0;
    } else {
      realSideAutoGoodRate[team] =
        sideAutoGoodRate[team][0] / sideAutoGoodRate[team][1];
    }
  }
  const realCoralScore: { [key: string]: number } = {};
  for (const team in coralScores) {
    if (coralScores[team][1] === 0) {
      realCoralScore[team] = 0;
    } else {
      realCoralScore[team] =
        (0.25 * coralScores[team][0]) / coralScores[team][1];
    }
  }
  const realAlgaeScore: { [key: string]: number } = {};
  for (const team in algaeScores) {
    if (algaeScores[team][1] === 0) {
      realAlgaeScore[team] = 0;
    } else {
      realAlgaeScore[team] =
        (0.25 * algaeScores[team][0]) / algaeScores[team][1];
    }
  }

  const formattedData: { [key: string]: string }[] = [];
  for (const team in scoutingData) {
    formattedData.push({
      key: team,
      cauto: realCenterAutoGoodRate[team].toFixed(2),
      sauto: realSideAutoGoodRate[team].toFixed(2),
      climb: realClimbRate[team].toFixed(2),
      coral: realCoralScore[team].toFixed(2),
      algae: realAlgaeScore[team].toFixed(2),
    });
  }

  return (
    <div
      className={styles.page}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          textDecoration: "none",
          color: "inherit",
          fontSize: "4rem",
          display: "flex",
          alignItems: "center",
          zIndex: 10,
        }}
        aria-label="Back to Home"
      >
        &#8592;
      </Link>
      <main className={styles.main}>
        <div
          style={{
            textAlign: "center",
            gap: 12,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h1 className={styles.title}>FunkyStats: Scouting</h1>
          <h2 className={styles.table}>{eventCode}</h2>
        </div>
        <CompleteClientPage
          matches={qms}
          eventCode={eventCode}
          jsonData={formattedData}
          rawData={sd}
        />
      </main>
      <LogoButton />
    </div>
  );
}
