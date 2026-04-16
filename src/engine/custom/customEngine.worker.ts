import { EngineName } from "../../types/enums";
import {
  EvaluateGameParams,
  EvaluatePositionWithUpdateParams,
  GameEval,
  PositionEval,
} from "../../types/eval";
import getMovesClassification from "../../utils/MoveClassification/moveClassification";
import { getWhoIsCheckmated } from "../../utils/chessUtils";
import { computeAccuracy } from "../../utils/computeAccuracy";
import { buildEvaluationBenchmark } from "../benchmark";
import {
  CustomEngineWorkerRequest,
  CustomEngineWorkerResponse,
} from "./customEngineWorkerMessages";
import {
  analyzeWithCustomEngine,
  clearCustomEngineSearchCache,
} from "./search";

let searchId = 0;
let skillLevel = 20;

const postResponse = (response: CustomEngineWorkerResponse) => {
  self.postMessage(response);
};

self.onmessage = (event: MessageEvent<CustomEngineWorkerRequest>) => {
  void handleMessage(event.data);
};

async function handleMessage(message: CustomEngineWorkerRequest) {
  try {
    switch (message.type) {
      case "init":
        postResponse({ id: message.id, type: "ready" });
        return;

      case "shutdown":
        searchId += 1;
        clearCustomEngineSearchCache();
        postResponse({ id: message.id, type: "shutdown" });
        return;

      case "stop":
        searchId += 1;
        postResponse({ id: message.id, type: "stopped" });
        return;

      case "setSkillLevel":
        setSkillLevel(message.skillLevel);
        postResponse({ id: message.id, type: "skillLevelSet" });
        return;

      case "evaluateGame":
        postResponse({
          id: message.id,
          type: "gameResult",
          result: await evaluateGame(message.id, message.params),
        });
        return;

      case "evaluatePositionWithUpdate":
        postResponse({
          id: message.id,
          type: "positionResult",
          result: await evaluatePositionWithUpdate(message.id, message.params),
        });
        return;
    }
  } catch (error) {
    postResponse({
      id: message.id,
      type: "error",
      message: error instanceof Error ? error.message : "Custom engine failed",
    });
  }
}

async function evaluateGame(
  requestId: number,
  {
    fens,
    uciMoves,
    depth = 16,
    multiPv = 3,
  }: Omit<EvaluateGameParams, "setEvaluationProgress">,
): Promise<GameEval> {
  postResponse({ id: requestId, type: "progress", value: 1 });

  const currentSearchId = searchId + 1;
  searchId = currentSearchId;
  const startedAt = performance.now();
  const positions: PositionEval[] = [];

  for (let index = 0; index < fens.length; index += 1) {
    const fen = fens[index];
    const whoIsCheckmated = getWhoIsCheckmated(fen);

    if (whoIsCheckmated) {
      positions.push({
        lines: [
          {
            pv: [],
            depth: 0,
            multiPv: 1,
            mate: whoIsCheckmated === "w" ? -1 : 1,
          },
        ],
      });
    } else {
      const result = await analyzeWithCustomEngine({
        fen,
        depth: getSkillAdjustedDepth(depth),
        multiPv,
        shouldStop: () => currentSearchId !== searchId,
      });
      positions.push(result);
    }

    postResponse({
      id: requestId,
      type: "progress",
      value:
        index === fens.length - 1 ? 100 : ((index + 1) / fens.length) * 100,
    });
  }

  const positionsWithClassification = getMovesClassification(
    positions,
    uciMoves,
    fens,
  );
  const endedAt = performance.now();
  const accuracy = computeAccuracy(positions);

  return {
    positions: positionsWithClassification,
    accuracy,
    settings: {
      engine: EngineName.Custom,
      date: new Date().toISOString(),
      depth,
      multiPv,
    },
    benchmark: buildEvaluationBenchmark({
      engine: EngineName.Custom,
      positions: positionsWithClassification,
      requestedDepth: depth,
      requestedMultiPv: multiPv,
      startedAt,
      endedAt,
    }),
  };
}

function evaluatePositionWithUpdate(
  requestId: number,
  {
    fen,
    depth = 16,
    multiPv = 3,
  }: Omit<EvaluatePositionWithUpdateParams, "setPartialEval">,
): Promise<PositionEval> {
  const currentSearchId = searchId + 1;
  searchId = currentSearchId;

  return analyzeWithCustomEngine({
    fen,
    depth: getSkillAdjustedDepth(depth),
    multiPv,
    onUpdate: (position) =>
      postResponse({ id: requestId, type: "partial", position }),
    shouldStop: () => currentSearchId !== searchId,
  });
}

function setSkillLevel(newSkillLevel: number) {
  if (newSkillLevel < 0 || newSkillLevel > 20) {
    throw new Error(`Invalid SkillLevel value: ${newSkillLevel}`);
  }

  skillLevel = newSkillLevel;
}

function getSkillAdjustedDepth(depth: number): number {
  if (skillLevel >= 20) return depth;
  const penalty = Math.ceil((20 - skillLevel) / 6);

  return Math.max(1, depth - penalty);
}
