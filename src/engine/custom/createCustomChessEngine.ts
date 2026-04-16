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
import { gameAnalysisCompleted } from "../../utils/soundEffects";
import { buildEvaluationBenchmark } from "../benchmark";
import { ChessEngine } from "../types";
import {
  CustomEngineWorkerRequest,
  CustomEngineWorkerRequestInput,
  CustomEngineWorkerResponse,
} from "./customEngineWorkerMessages";

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  onProgress?: (value: number) => void;
  onPartial?: (position: PositionEval) => void;
}

export function createCustomChessEngine(): ChessEngine {
  let workers = [createWorker()];
  let ready = false;
  let requestId = 0;
  let skillLevel = 20;
  const pendingRequests = new Map<number, PendingRequest<unknown>>();

  const init = async () => {
    await initializeWorker(workers[0]);
    console.info(`${EngineName.Custom} initialized`);
  };

  const shutdown = () => {
    ready = false;
    rejectPendingRequests("Custom engine shutdown");
    workers.forEach((worker) => {
      worker.postMessage(buildRequest({ type: "shutdown" }));
      worker.terminate();
    });
    console.info(`${EngineName.Custom} shutdown`);
  };

  const stopSearch = async () => {
    await restartWorker("Custom engine search stopped");
  };

  const isReady = () => ready;
  const getName = () => EngineName.Custom;

  const setSkillLevel = async (newSkillLevel: number) => {
    throwErrorIfNotReady();
    skillLevel = newSkillLevel;

    await Promise.all(
      workers.map((worker) =>
        sendRequest<void>(worker, {
          type: "setSkillLevel",
          skillLevel: newSkillLevel,
        }),
      ),
    );
  };

  const evaluateGame = async ({
    setEvaluationProgress,
    ...params
  }: EvaluateGameParams): Promise<GameEval> => {
    throwErrorIfNotReady();
    ready = false;
    setEvaluationProgress?.(1);

    try {
      const result = await evaluateGameInParallel(
        params,
        setEvaluationProgress,
      );
      gameAnalysisCompleted();

      return result;
    } finally {
      ready = true;
    }
  };

  const evaluatePositionWithUpdate = async ({
    setPartialEval,
    ...params
  }: EvaluatePositionWithUpdateParams): Promise<PositionEval> => {
    throwErrorIfNotReady();

    return sendRequest<PositionEval>(
      workers[0],
      {
        type: "evaluatePositionWithUpdate",
        params,
      },
      { onPartial: setPartialEval },
    );
  };

  async function restartWorker(reason: string) {
    rejectPendingRequests(reason);
    workers.forEach((worker) => worker.terminate());
    workers = [createWorker()];
    ready = true;

    try {
      await initializeWorker(workers[0]);
    } catch (error) {
      ready = false;
      throw error;
    }
  }

  async function initializeWorker(worker: Worker) {
    await sendRequest<void>(worker, { type: "init" });
    if (skillLevel !== 20) {
      await sendRequest<void>(worker, {
        type: "setSkillLevel",
        skillLevel,
      });
    }
    ready = true;
  }

  async function ensureWorkerPool(workerCount: number) {
    while (workers.length < workerCount) {
      const worker = createWorker();
      workers.push(worker);
      await initializeWorker(worker);
    }
  }

  function createWorker() {
    const newWorker = new Worker(
      new URL("./customEngine.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    newWorker.onmessage = (event: MessageEvent<CustomEngineWorkerResponse>) => {
      handleWorkerMessage(event.data);
    };
    newWorker.onerror = (event) => {
      ready = false;
      rejectPendingRequests(event.message || "Custom engine worker crashed");
    };

    return newWorker;
  }

  function sendRequest<T>(
    worker: Worker,
    request: CustomEngineWorkerRequestInput,
    handlers: Pick<PendingRequest<T>, "onProgress" | "onPartial"> = {},
  ): Promise<T> {
    const message = buildRequest(request);

    return new Promise<T>((resolve, reject) => {
      pendingRequests.set(message.id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        ...handlers,
      });
      worker.postMessage(message);
    });
  }

  async function evaluateGameInParallel(
    {
      fens,
      uciMoves,
      depth = 16,
      multiPv = 3,
    }: Omit<EvaluateGameParams, "setEvaluationProgress">,
    setEvaluationProgress?: (value: number) => void,
  ): Promise<GameEval> {
    const startedAt = performance.now();
    const positions: Array<PositionEval | undefined> = new Array(fens.length);
    const tasks: Array<{ fen: string; index: number; complexity: number }> = [];
    let completedPositions = 0;

    fens.forEach((fen, index) => {
      const whoIsCheckmated = getWhoIsCheckmated(fen);

      if (whoIsCheckmated) {
        positions[index] = {
          lines: [
            {
              pv: [],
              depth: 0,
              multiPv: 1,
              mate: whoIsCheckmated === "w" ? -1 : 1,
            },
          ],
        };
        completedPositions += 1;
      } else {
        tasks.push({
          fen,
          index,
          complexity: estimatePositionComplexity(fen),
        });
      }
    });
    tasks.sort((a, b) => b.complexity - a.complexity);

    const workerCount = getGameAnalysisWorkerCount(tasks.length);
    await ensureWorkerPool(workerCount);

    let nextTaskIndex = 0;
    const runWorkerQueue = async (worker: Worker) => {
      while (nextTaskIndex < tasks.length) {
        const task = tasks[nextTaskIndex];
        nextTaskIndex += 1;

        positions[task.index] = await sendRequest<PositionEval>(worker, {
          type: "evaluatePositionWithUpdate",
          params: {
            fen: task.fen,
            depth,
            multiPv,
          },
        });

        completedPositions += 1;
        setEvaluationProgress?.(
          completedPositions === fens.length
            ? 100
            : (completedPositions / fens.length) * 100,
        );
      }
    };

    await Promise.all(workers.slice(0, workerCount).map(runWorkerQueue));

    const rawPositions = positions as PositionEval[];
    const positionsWithClassification = getMovesClassification(
      rawPositions,
      uciMoves,
      fens,
    );
    const endedAt = performance.now();

    return {
      positions: positionsWithClassification,
      accuracy: computeAccuracy(rawPositions),
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

  function buildRequest(
    request: CustomEngineWorkerRequestInput,
  ): CustomEngineWorkerRequest {
    requestId += 1;

    return { id: requestId, ...request } as CustomEngineWorkerRequest;
  }

  function handleWorkerMessage(response: CustomEngineWorkerResponse) {
    const pending = pendingRequests.get(response.id);

    switch (response.type) {
      case "progress":
        pending?.onProgress?.(response.value);
        return;

      case "partial":
        pending?.onPartial?.(response.position);
        return;

      case "ready":
      case "stopped":
      case "shutdown":
      case "skillLevelSet":
        pendingRequests.delete(response.id);
        pending?.resolve(undefined);
        return;

      case "gameResult":
        pendingRequests.delete(response.id);
        pending?.resolve(response.result);
        return;

      case "positionResult":
        pendingRequests.delete(response.id);
        pending?.resolve(response.result);
        return;

      case "error":
        pendingRequests.delete(response.id);
        pending?.reject(new Error(response.message));
        return;
    }
  }

  function rejectPendingRequests(reason: string) {
    pendingRequests.forEach((pending) => {
      pending.reject(new Error(reason));
    });
    pendingRequests.clear();
  }

  const throwErrorIfNotReady = () => {
    if (!ready) throw new Error(`${EngineName.Custom} is not ready`);
  };

  return {
    init,
    shutdown,
    stopSearch,
    isReady,
    getName,
    evaluateGame,
    evaluatePositionWithUpdate,
    setSkillLevel,
  };
}

function getGameAnalysisWorkerCount(taskCount: number): number {
  if (taskCount <= 1) return 1;

  const cpuCount =
    typeof navigator === "undefined" ? 4 : navigator.hardwareConcurrency || 4;

  return Math.max(1, Math.min(3, Math.floor(cpuCount / 2), taskCount));
}

function estimatePositionComplexity(fen: string): number {
  const piecePlacement = fen.split(" ")[0];
  let complexity = 0;

  for (const char of piecePlacement) {
    switch (char.toLowerCase()) {
      case "q":
        complexity += 9;
        break;
      case "r":
        complexity += 5;
        break;
      case "b":
      case "n":
        complexity += 3;
        break;
      case "p":
        complexity += 1;
        break;
    }
  }

  return complexity;
}
