import { EngineName } from "../types/enums";
import {
  EvaluateGameParams,
  EvaluatePositionWithUpdateParams,
  GameEval,
  PositionEval,
} from "../types/eval";

export interface ChessEngine {
  init: () => Promise<void>;
  shutdown: () => void;
  stopSearch: () => Promise<void>;
  isReady: () => boolean;
  getName: () => EngineName;
  evaluateGame: (params: EvaluateGameParams) => Promise<GameEval>;
  evaluatePositionWithUpdate: (
    params: EvaluatePositionWithUpdateParams,
  ) => Promise<PositionEval>;
  setSkillLevel: (newSkillLevel: number, initCase?: boolean) => Promise<void>;
}
