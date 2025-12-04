import { TeamDataType } from "@/app/lib/event";

export type MatchPredictions = {
  [key: string]: {
    preds: string[];
    red: string[];
    blue: string[];
    result: number[];
  };
};

export type TeamData = TeamDataType;

export interface AllianceData {
  declines: string[];
  picks: string[];
  status?: {
    current_level_record: Record<string, unknown>;
    double_elim_round: string;
    level: string;
    playoff_type: number;
    record: Record<string, unknown>;
    status: string;
  };
}

export interface NexusScheduleData {
  scheduledTime: string | null;
  actualTime: string | null;
  status: string;
  label: string;
}

import {
  UnluckyMetric,
  SOSZScoreMetric,
} from "@/app/lib/unlucky";

export interface ClientPageProps {
  havePreds: boolean;
  eventCode: string;
  teams: TeamData[];
  matchPredictions: MatchPredictions;
  playedMatches: number;
  actualAlliances: AllianceData[] | null;
  nexusSchedule: { [key: string]: NexusScheduleData };
  unluckyMetrics: UnluckyMetric;
  sosZScoreMetrics: SOSZScoreMetric;
}

export interface AlliancePredictionsProps {
  teams: TeamData[];
  playedMatches: number;
  actualAlliances: AllianceData[] | null;
  sessionReady: boolean;
  runOnnxModel: (inputData: Float32Array) => Promise<number>;
  makeInput: (
    alliance: {
      fsm: number;
      algae: number;
      coral: number;
      auto: number;
      climb: number;
    }[],
    compLevel: number,
    match: { match_number: number }
  ) => Float32Array;
}
