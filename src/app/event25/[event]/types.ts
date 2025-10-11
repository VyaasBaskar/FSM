export type MatchPredictions = {
  [key: string]: {
    preds: string[];
    red: string[];
    blue: string[];
    result: number[];
  };
};

export interface ClientPageProps {
  havePreds: boolean;
  eventCode: string;
  teams: any[];
  teamsf: { [key: string]: any };
  matchPredictions: MatchPredictions;
  matches: any[];
  playedMatches: number;
  actualAlliances: any[] | null;
}

export interface AlliancePredictionsProps {
  teams: any[];
  playedMatches: number;
  actualAlliances: any[] | null;
  sessionReady: boolean;
  runOnnxModel: (inputData: Float32Array) => Promise<number>;
  makeInput: (alliance: any[], compLevel: any, match: any) => Float32Array;
}
