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

  // Memoizes saved evaluations to prevent unnecessary re-evaluations
  const memoizedSavedEvalsRef = useRef(JSON.stringify(savedEvals));
  memoizedSavedEvalsRef.current = JSON.stringify(savedEvals);

  // Stores the previous currentPosition to detect changes and avoid unnecessary updates
  const previousPositionRef = useRef(currentPosition);

  useEffect(() => {
    // Return early if the engine is not ready or no engine name is provided
    if (!engine?.isReady() || !engineName) return;

    // Creates a new position object with the last move and current move index
    const position: CurrentPosition = {
      lastMove: board.history({ verbose: true }).at(-1), // Retrieves the last move from the board history
      currentMoveIdx: currentPosition.currentMoveIdx, // Keeps the current move index unchanged
    };

    // Synchronizes evaluations if the board history matches the game history
    const boardHistory = board.history();
    const gameHistory = game.history();

    if (
      boardHistory.length <= gameHistory.length &&
      gameHistory.slice(0, boardHistory.length).join() === boardHistory.join() &&
      gameEval
    ) {
      const evalIndex = boardHistory.length;
      position.eval = gameEval.positions[evalIndex]; // Sets the current evaluation
      position.lastEval =
        evalIndex > 0 ? gameEval.positions[evalIndex - 1] : undefined; // Sets the previous evaluation if available
    }

    // Updates currentPosition only if there are changes
    const prevPosition = previousPositionRef.current;
    if (
      prevPosition.lastMove !== position.lastMove || // Checks if the last move has changed
      prevPosition.currentMoveIdx !== position.currentMoveIdx || // Checks if the move index has changed
      JSON.stringify(prevPosition.eval) !== JSON.stringify(position.eval) // Checks if the evaluation has changed
    ) {
      setCurrentPosition(position); // Updates the current position
      previousPositionRef.current = position; // Updates the ref with the new position
    }

    // Checks if the position needs evaluation and starts the evaluation if necessary
    if (
      !position.eval &&
      engine?.isReady() &&
      engineName &&
      !board.isCheckmate() &&
      !board.isStalemate()
    ) {
      // Evaluates a position using the engine or retrieves a saved evaluation
      const getFenEngineEval = async (
        fen: string,
        setPartialEval?: (positionEval: PositionEval) => void,
        timeout: number = 30000, // Maximum time allowed for evaluation
      ): Promise<PositionEval> => {
        if (!engine?.isReady() || !engineName)
          throw new Error("Engine not ready");

        // Tries to use a saved evaluation if it meets the criteria
        const savedEval = JSON.parse(memoizedSavedEvalsRef.current)[fen];
        if (
          savedEval &&
          savedEval.engine === engineName &&
          savedEval.lines[0]?.depth >= depth
        ) {
          setPartialEval?.(savedEval); // Sets a partial evaluation if provided
          return savedEval;
        }

        // Evaluates the position using the engine and retries if needed
        const start = Date.now();
        while (Date.now() - start < timeout) {
          const rawPositionEval = await engine.evaluatePositionWithUpdate({
            fen,
            depth,
            multiPv,
            setPartialEval,
          });

          // Saves and returns the new evaluation if it is valid
          if (
            rawPositionEval.lines &&
            rawPositionEval.lines.length > 0 &&
            savedEval !== rawPositionEval
          ) {
            setSavedEvals((prev) => ({
              ...prev,
              [fen]: { ...rawPositionEval, engine: engineName },
            }));
            return rawPositionEval;
          }

          // Waits briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Returns a default evaluation if the timeout is reached
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

      // Main function to evaluate the current position and classify the moves
      const getPositionEval = async () => {
        const setPartialEval = (positionEval: PositionEval) => {
          setCurrentPosition((prev) => ({
            ...prev,
            eval: positionEval,
          }));
        };

        // Evaluates the current position
        const rawPositionEval = await getFenEngineEval(
          board.fen(),
          setPartialEval,
        );

        if (boardHistory.length === 0) return; // Exits if the board history is empty

        // Prepares parameters for evaluating the game and extracts recent moves
        const params = getEvaluateGameParams(board);
        const fens = params.fens.slice(board.turn() === "w" ? -3 : -4);
        const uciMoves = params.uciMoves.slice(board.turn() === "w" ? -2 : -3);

        // Evaluates recent positions and creates a list of evaluations
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

        // Classifies the moves and updates the current position with the results
        const positionsWithMoveClassification = getMovesClassification(
          rawPositions,
          uciMoves,
          fens,
        );

        setCurrentPosition((prev) => ({
          ...prev,
          eval: positionsWithMoveClassification.slice(-1)[0],
          lastEval: positionsWithMoveClassification.slice(-2)[0],
        }));
      };

      getPositionEval();
    }

    // Stops the engine's search when the component unmounts or dependencies change
    return () => {
      engine?.stopSearch();
    };
  }, [
    engine,
    engineName,
    board,
    game,
    gameEval,
    depth,
    multiPv,
    currentPosition.currentMoveIdx,
    setCurrentPosition,
    setSavedEvals,
  ]);

  return currentPosition;
};
