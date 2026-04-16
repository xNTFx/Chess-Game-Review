import { useEffect, useState } from "react";

import { buildEvaluationBenchmark } from "../engine/benchmark";
import { createCustomChessEngine } from "../engine/custom/createCustomChessEngine";
import { ChessEngine } from "../engine/types";
import { EngineName } from "../types/enums";
import {
  EvaluateGameParams,
  EvaluatePositionWithUpdateParams,
  GameEval,
  PositionEval,
} from "../types/eval";
import getMovesClassification from "../utils/MoveClassification/moveClassification";
import { getWhoIsCheckmated } from "../utils/chessUtils";
import { computeAccuracy } from "../utils/computeAccuracy";
import { parseEvaluationResults } from "../utils/parseEvaluationResults";
import { gameAnalysisCompleted } from "../utils/soundEffects";

// Check if WebAssembly is supported in the current environment
const isWasmSupported = () =>
  typeof WebAssembly === "object" &&
  WebAssembly.validate(
    Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
  );

// Check if multi-threading is supported (important for performance optimization)
const isMultiThreadSupported = () => SharedArrayBuffer !== undefined;

// Creates an engine instance with methods to interact with a chess engine worker
function createEngine(
  engineName: EngineName,
  enginePath: string,
  customEngineInit?: () => Promise<void>,
) {
  let worker: Worker; // Worker used to offload engine tasks
  let ready = false; // Indicates if the engine is ready for use
  let multiPv = 3; // Default number of principal variations to calculate
  let skillLevel: number | undefined = undefined;

  // Initialize the engine and prepare it for analysis
  const init = async () => {
    worker = new Worker(enginePath);
    await sendCommands(["uci"], "uciok"); // Send UCI initialization command
    await setMultiPv(multiPv, true); // Set MultiPV option on initialization
    if (customEngineInit) await customEngineInit(); // Execute custom initialization logic if provided
    ready = true;
    console.info(`${engineName} initialized`);
  };

  // Set the number of principal variations (lines) the engine calculates
  const setMultiPv = async (newMultiPv: number, initCase = false) => {
    if (!initCase && newMultiPv === multiPv) return; // No change needed
    if (!initCase) throwErrorIfNotReady();
    if (newMultiPv < 2 || newMultiPv > 6)
      throw new Error(`Invalid MultiPV value: ${newMultiPv}`);

    await sendCommands(
      [`setoption name MultiPV value ${newMultiPv}`, "isready"],
      "readyok",
    );
    multiPv = newMultiPv;
  };

  // Set the engine's skill level (used for limiting strength in some engines)
  const setSkillLevel = async (newSkillLevel: number, initCase = false) => {
    if (!initCase && newSkillLevel === skillLevel) return; // No change needed
    if (!initCase) throwErrorIfNotReady();
    if (newSkillLevel < 0 || newSkillLevel > 20)
      throw new Error(`Invalid SkillLevel value: ${newSkillLevel}`);

    await sendCommands(
      [`setoption name Skill Level value ${newSkillLevel}`, "isready"],
      "readyok",
    );
    skillLevel = newSkillLevel;
  };

  // Throws an error if the engine is not ready, ensuring methods aren't called prematurely
  const throwErrorIfNotReady = () => {
    if (!ready) throw new Error(`${engineName} is not ready`);
  };

  // Shuts down the engine by terminating the worker
  const shutdown = () => {
    ready = false;
    worker.postMessage("quit");
    worker.terminate();
    console.info(`${engineName} shutdown`);
  };

  // Returns the readiness status of the engine
  const isReady = () => ready;
  const getName = () => engineName;

  // Stops the engine's current search
  const stopSearch = async () => {
    await sendCommands(["stop", "isready"], "readyok");
  };

  // Sends commands to the engine and waits for a specific response
  const sendCommands = async (
    commands: string[],
    finalMessage: string,
    onNewMessage?: (messages: string[]) => void,
  ) => {
    return new Promise<string[]>((resolve) => {
      const messages: string[] = [];
      worker.onmessage = (event) => {
        const messageData: string = event.data;
        messages.push(messageData);
        if (onNewMessage) onNewMessage(messages); // Callback for handling new messages
        if (messageData.startsWith(finalMessage)) resolve(messages); // Resolve when the expected message is received
      };
      commands.forEach((command) => worker.postMessage(command)); // Send each command to the worker
    });
  };

  // Evaluates a series of game positions and returns a comprehensive evaluation
  const evaluateGame = async ({
    fens,
    uciMoves,
    depth = 16,
    multiPv = 3,
    setEvaluationProgress,
  }: EvaluateGameParams): Promise<GameEval> => {
    throwErrorIfNotReady();
    setEvaluationProgress?.(1); // Initialize progress
    await setMultiPv(multiPv);
    ready = false;
    const startedAt = performance.now();

    // Reset engine state for a new game
    await sendCommands(["ucinewgame", "isready"], "readyok");
    worker.postMessage("position startpos");

    const positions: PositionEval[] = [];
    for (let index = 0; index < fens.length; index += 1) {
      const fen = fens[index];
      const whoIsCheckmated = getWhoIsCheckmated(fen);
      if (whoIsCheckmated) {
        // Add mate information if a checkmate situation is detected
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
        continue;
      }
      const result = await evaluatePosition(fen, depth); // Evaluate the position
      positions.push(result);
      setEvaluationProgress?.(
        index === fens.length - 1
          ? 100
          : (1 - Math.exp(-6 * (index / fens.length))) * 100, // Smooth non-linear progress update
      );
    }

    gameAnalysisCompleted(); // Play sound when analysis is complete

    // Classify moves and calculate accuracy
    const positionsWithClassification = getMovesClassification(
      positions,
      uciMoves,
      fens,
    );
    const endedAt = performance.now();
    const accuracy = computeAccuracy(positions);

    ready = true;
    return {
      positions: positionsWithClassification,
      accuracy,
      settings: {
        engine: engineName,
        date: new Date().toISOString(),
        depth,
        multiPv,
      },
      benchmark: buildEvaluationBenchmark({
        engine: engineName,
        positions: positionsWithClassification,
        requestedDepth: depth,
        requestedMultiPv: multiPv,
        startedAt,
        endedAt,
      }),
    };
  };

  // Evaluates a single position and parses the results
  const evaluatePosition = async (
    fen: string,
    depth = 16,
  ): Promise<PositionEval> => {
    console.info(`Evaluating position: ${fen}`);
    const results = await sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove",
    );
    const whiteToPlay = fen.split(" ")[1] === "w"; // Determine if it's White's turn
    return parseEvaluationResults(results, whiteToPlay);
  };

  // Evaluates a position with periodic updates, useful for partial evaluations
  const evaluatePositionWithUpdate = async ({
    fen,
    depth = 16,
    multiPv = 3,
    setPartialEval,
  }: EvaluatePositionWithUpdateParams): Promise<PositionEval> => {
    throwErrorIfNotReady();

    await stopSearch(); // Ensure previous search is stopped
    await setMultiPv(multiPv);

    const whiteToPlay = fen.split(" ")[1] === "w";

    // Handle incoming messages for partial evaluation updates
    const onNewMessage = (messages: string[]) => {
      if (!setPartialEval) return;
      const parsedResults = parseEvaluationResults(messages, whiteToPlay);
      setPartialEval(parsedResults); // Update partial evaluation
    };

    console.info(`Evaluating position with update: ${fen}`);

    const results = await sendCommands(
      [`position fen ${fen}`, `go depth ${depth}`],
      "bestmove",
      onNewMessage,
    );

    return parseEvaluationResults(results, whiteToPlay);
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

// Factory function to create a Stockfish engine with WebAssembly support checks
const createStockfishEngine = (
  engineName: EngineName.Stockfish16_1Lite | EngineName.Stockfish11,
) => {
  if (engineName === EngineName.Stockfish11) {
    return createEngine(EngineName.Stockfish11, "engines/stockfish-11.js");
  }

  if (!isWasmSupported()) {
    console.info(
      "Stockfish 16.1 is not supported, because WASM is not supported",
    );
    return createEngine(EngineName.Stockfish11, "engines/stockfish-11.js"); // Fallback to older engine
  }

  const multiThreadIsSupported = isMultiThreadSupported();
  if (!multiThreadIsSupported) console.info("Single thread mode"); // Log if multi-threading is not available

  // Use appropriate engine path based on multi-threading support
  const enginePath = `engines/stockfish-16.1/stockfish-16.1-lite${
    multiThreadIsSupported ? "" : "-single"
  }.js`;

  return createEngine(EngineName.Stockfish16_1Lite, enginePath);
};

const createSelectedEngine = (engineName: EngineName): ChessEngine => {
  if (engineName === EngineName.Custom) {
    return createCustomChessEngine();
  }

  return createStockfishEngine(engineName);
};

export const useChessEngine = (
  engineName = EngineName.Stockfish16_1Lite,
): ChessEngine | null => {
  const [engineState, setEngineState] = useState<{
    selectedEngine: EngineName;
    engine: ChessEngine;
  } | null>(null);

  useEffect(() => {
    const newEngine = createSelectedEngine(engineName);
    let disposed = false;

    newEngine
      .init()
      .then(() => {
        if (disposed) {
          newEngine.shutdown();
          return;
        }

        setEngineState({
          selectedEngine: engineName,
          engine: newEngine,
        });
      })
      .catch((error) => {
        console.error(`Failed to initialize ${engineName}`, error);
      });

    return () => {
      disposed = true;
      newEngine.shutdown();
    };
  }, [engineName]);

  return engineState?.selectedEngine === engineName ? engineState.engine : null;
};
