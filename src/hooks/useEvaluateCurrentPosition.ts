import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

import {
  boardAtom,
  currentPositionAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
} from "../stores/states";
import { EngineName } from "../types/enums";
import { CurrentPosition, PositionEval } from "../types/eval";
import getMovesClassification from "../utils/MoveClassification/moveClassification";
import { getEvaluateGameParams } from "../utils/chessUtils";
import { useChessEngine } from "./useChessEngine";

export const useEvaluateCurrentPosition = (engineName?: EngineName) => {
  const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
  const engine = useChessEngine();
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);
  const depth = useAtomValue(engineDepthAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  const [savedEvals, setSavedEvals] = useAtom(savedEvalsAtom);

  // Store the serialized saved evaluations in a ref for memoization
  const memoizedSavedEvalsRef = useRef(JSON.stringify(savedEvals));
  memoizedSavedEvalsRef.current = JSON.stringify(savedEvals);

  useEffect(() => {
    // Early return if the engine is not ready or no engine name is provided
    if (!engine?.isReady() || !engineName) return;

    // Set up the current position object with the last move and evaluation details
    const position: CurrentPosition = {
      lastMove: board.history({ verbose: true }).at(-1),
    };

    // Check if the board history aligns with the game history to synchronize evaluations
    const boardHistory = board.history();
    const gameHistory = game.history();

    if (
      boardHistory.length <= gameHistory.length &&
      gameHistory.slice(0, boardHistory.length).join() === boardHistory.join()
    ) {
      if (gameEval) {
        const evalIndex = boardHistory.length;

        // Assign evaluation details from the game evaluation data
        position.eval = gameEval.positions[evalIndex];
        position.lastEval =
          evalIndex > 0 ? gameEval.positions[evalIndex - 1] : undefined;
      }
    }

    // Preserve the current move index
    position.currentMoveIdx = currentPosition.currentMoveIdx;
    setCurrentPosition(position);

    // Check if the position needs evaluation and set up the logic to evaluate using the engine
    if (
      !position.eval &&
      engine?.isReady() &&
      engineName &&
      !board.isCheckmate() &&
      !board.isStalemate()
    ) {
      // Function to evaluate a position using the engine or retrieve a saved evaluation
      const getFenEngineEval = async (
        fen: string,
        setPartialEval?: (positionEval: PositionEval) => void,
        timeout: number = 30000,
      ): Promise<PositionEval> => {
        // Throw an error if the engine is not ready
        if (!engine?.isReady() || !engineName)
          throw new Error("Engine not ready");

        // Attempt to use a saved evaluation if it matches the current engine and depth
        const savedEval = JSON.parse(memoizedSavedEvalsRef.current)[fen];
        if (
          savedEval &&
          savedEval.engine === engineName &&
          savedEval.lines[0]?.depth >= depth
        ) {
          setPartialEval?.(savedEval); // Optionally set a partial evaluation
          return savedEval;
        }

        // Evaluate the position using the engine within the timeout period
        const start = Date.now();
        while (Date.now() - start < timeout) {
          const rawPositionEval = await engine.evaluatePositionWithUpdate({
            fen,
            depth,
            multiPv,
            setPartialEval,
          });

          // Save and return the new evaluation if it's valid
          if (
            rawPositionEval.lines &&
            rawPositionEval.lines.length > 0 &&
            savedEval !== rawPositionEval
          ) {
            setSavedEvals((prev) => {
              return {
                ...prev,
                [fen]: { ...rawPositionEval, engine: engineName },
              };
            });
            return rawPositionEval;
          }

          // Wait briefly before retrying to avoid blocking
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Log an error if the evaluation times out
        console.error(
          `Failed to calculate lines for FEN ${fen} within the time limit`,
        );
        return {
          lines: [
            {
              pv: [],
              depth: 0,
              multiPv: 1,
              cp: 1,
            },
          ],
        };
      };

      // Main function to evaluate the current position and classify moves
      const getPositionEval = async () => {
        const setPartialEval = (positionEval: PositionEval) => {
          setCurrentPosition({ ...position, eval: positionEval });
        };
        const rawPositionEval = await getFenEngineEval(
          board.fen(),
          setPartialEval,
        );

        // Return if the board history is empty (no moves to evaluate)
        if (boardHistory.length === 0) return;

        // Prepare the parameters for evaluating the game using multiple FENs and UCI moves
        const params = getEvaluateGameParams(board);
        const fens = params.fens.slice(board.turn() === "w" ? -3 : -4);
        const uciMoves = params.uciMoves.slice(board.turn() === "w" ? -2 : -3);

        // Evaluate recent positions and classify the moves
        const lastRawEval = await getFenEngineEval(fens.slice(-2)[0]);
        const rawPositions: PositionEval[] = fens.map((_, idx) => {
          if (idx === fens.length - 2) return lastRawEval;
          if (idx === fens.length - 1) return rawPositionEval;
          return {
            lines: [
              {
                pv: [],
                depth: 0,
                multiPv: 1,
                cp: 1,
              },
            ],
          };
        });

        // Classify the moves using the provided utility function
        const positionsWithMoveClassification = getMovesClassification(
          rawPositions,
          uciMoves,
          fens,
        );

        // Update the current position with the classified evaluation
        setCurrentPosition({
          ...position,
          eval: positionsWithMoveClassification.slice(-1)[0],
          lastEval: positionsWithMoveClassification.slice(-2)[0],
        });
      };

      getPositionEval();
    }

    // Stop the engine's search when the component is unmounted or dependencies change
    return () => {
      engine?.stopSearch();
    };
  }, [
    gameEval,
    board,
    game,
    engine,
    depth,
    multiPv,
    engineName,
    currentPosition.currentMoveIdx,
    setCurrentPosition,
    setSavedEvals,
  ]);

  return currentPosition;
};
