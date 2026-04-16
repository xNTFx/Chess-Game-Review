import {
  EvaluateGameParams,
  EvaluatePositionWithUpdateParams,
  GameEval,
  PositionEval,
} from "../../types/eval";

export type CustomEngineWorkerRequest =
  | { id: number; type: "init" }
  | { id: number; type: "shutdown" }
  | { id: number; type: "stop" }
  | { id: number; type: "setSkillLevel"; skillLevel: number }
  | {
      id: number;
      type: "evaluateGame";
      params: Omit<EvaluateGameParams, "setEvaluationProgress">;
    }
  | {
      id: number;
      type: "evaluatePositionWithUpdate";
      params: Omit<EvaluatePositionWithUpdateParams, "setPartialEval">;
    };

export type CustomEngineWorkerRequestInput =
  CustomEngineWorkerRequest extends infer Request
    ? Request extends { id: number }
      ? Omit<Request, "id">
      : never
    : never;

export type CustomEngineWorkerResponse =
  | { id: number; type: "ready" }
  | { id: number; type: "stopped" }
  | { id: number; type: "shutdown" }
  | { id: number; type: "progress"; value: number }
  | { id: number; type: "partial"; position: PositionEval }
  | { id: number; type: "gameResult"; result: GameEval }
  | { id: number; type: "positionResult"; result: PositionEval }
  | { id: number; type: "skillLevelSet" }
  | { id: number; type: "error"; message: string };
