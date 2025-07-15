import { getEventTeams, getMatchPredictions, getNumberPlayedMatches } from "../../lib/event";
import { getGlobalStats } from "@/app/lib/global";
import ClientPage from "./clientpage";

export default async function EventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event: eventCode } = await params;
  const teams = await getEventTeams("2025" + eventCode, true);

  const playedMatches = await getNumberPlayedMatches("2025" + eventCode);

  let FSMs: { [key: string]: number } = {};
  teams.forEach((team) => {
    FSMs[team.key] = Number(team.fsm);
  });

  if (playedMatches < 15) {
    const globalStats = await getGlobalStats();
    FSMs = {};
    globalStats.forEach(({ teamKey, bestFSM }) => {
      FSMs[teamKey] = Number(bestFSM);
    });
  }

  const matchPredictions = await getMatchPredictions("2025" + eventCode, FSMs);
  const havePreds = matchPredictions && Object.keys(matchPredictions).length > 0;

  return (
    <ClientPage
      havePreds={havePreds}
      eventCode={eventCode}
      teams={teams}
      matchPredictions={matchPredictions}
    />
  );
}
