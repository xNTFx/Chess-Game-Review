import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import {
  boardAtom,
  currentPositionAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  liveEvalCacheAtom,
  savedEvalsAtom,
} from "../stores/states";
import { EngineName } from "../types/enums";
import { PositionEval, SavedEvals } from "../types/eval";
import getMovesClassification from "../utils/MoveClassification/moveClassification";
import { getEvaluateGameParams } from "../utils/chessUtils";
import { useChessEngine } from "./useChessEngine";

const DEFAULT_EVAL: PositionEval = {
  lines: [{ pv: [], depth: 0, multiPv: 1, cp: 1 }],
};

/**
 * Stable callback to evaluate a FEN using the engine or the saved eval cache.
 */
function useFenEval(
  engine: ReturnType<typeof useChessEngine>,
  engineName: EngineName | undefined,
  depth: number,
  multiPv: number,
) {
  const savedEvalsRef = useRef<SavedEvals>({});
  const savedEvals = useAtomValue(savedEvalsAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  // Keep ref in sync using useLayoutEffect so the callback always reads the
  // latest savedEvals without being listed as a useCallback dependency.
  useLayoutEffect(() => {
    savedEvalsRef.current = savedEvals;
  });

  return useCallback(
    async (
      fen: string,
      setPartialEval?: (positionEval: PositionEval) => void,
      timeout = 30000,
    ): Promise<PositionEval> => {
      if (!engine?.isReady() || !engineName)
        throw new Error("Engine not ready");

      const savedEval = savedEvalsRef.current[fen];
      if (
        savedEval &&
        savedEval.engine === engineName &&
        savedEval.lines[0]?.depth >= depth
      ) {
        setPartialEval?.(savedEval);
        return savedEval;
      }

      const start = Date.now();
      while (Date.now() - start < timeout) {
        const rawEval = await engine.evaluatePositionWithUpdate({
          fen,
          depth,
          multiPv,
          setPartialEval,
        });

        if (
          rawEval.lines &&
          rawEval.lines.length > 0 &&
          savedEval !== rawEval
        ) {
          setSavedEvals((prev) => ({
            ...prev,
            [fen]: { ...rawEval, engine: engineName },
          }));
          return rawEval;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.error(
        `Failed to calculate lines for FEN ${fen} within the time limit`,
      );
      return DEFAULT_EVAL;
    },
    [engine, engineName, depth, multiPv, setSavedEvals],
  );
}

export const useEvaluateCurrentPosition = (engineName?: EngineName) => {
  const engine = useChessEngine();
  const board = useAtomValue(boardAtom);
  const depth = useAtomValue(engineDepthAtom);
  const multiPv = useAtomValue(engineMultiPvAtom);
  const setLiveEvalCache = useSetAtom(liveEvalCacheAtom);

  // Derived position — computed by the atom, no sync needed
  const currentPosition = useAtomValue(currentPositionAtom);

  // Stable evaluation callback (encapsulates cache + engine interaction)
  const evalFen = useFenEval(engine, engineName, depth, multiPv);

  const boardFen = board.fen();

  const currentEvalRef = useRef(currentPosition.eval);
  useLayoutEffect(() => {
    currentEvalRef.current = currentPosition.eval;
  });

  useEffect(() => {
    if (
      currentEvalRef.current ||
      !engine?.isReady() ||
      !engineName ||
      board.isCheckmate() ||
      board.isStalemate()
    ) {
      return;
    }

    let cancelled = false;

    const evaluate = async () => {
      const setPartialEval = (positionEval: PositionEval) => {
        if (cancelled) return;
        setLiveEvalCache((prev) => ({
          ...prev,
          [boardFen]: { eval: positionEval },
        }));
      };

      const rawPositionEval = await evalFen(boardFen, setPartialEval);
      if (cancelled) return;

      const boardHistory = board.history();
      if (boardHistory.length === 0) {
        setLiveEvalCache((prev) => ({
          ...prev,
          [boardFen]: { eval: rawPositionEval },
        }));
        return;
      }

      const params = getEvaluateGameParams(board);
      const fens = params.fens.slice(board.turn() === "w" ? -3 : -4);
      const uciMoves = params.uciMoves.slice(board.turn() === "w" ? -2 : -3);

      const lastRawEval = await evalFen(fens.slice(-2)[0]);
      if (cancelled) return;

      const rawPositions: PositionEval[] = fens.map((_, idx) => {
        if (idx === fens.length - 2) return lastRawEval;
        if (idx === fens.length - 1) return rawPositionEval;
        return DEFAULT_EVAL;
      });

      const classified = getMovesClassification(rawPositions, uciMoves, fens);

      setLiveEvalCache((prev) => ({
        ...prev,
        [boardFen]: {
          eval: classified.slice(-1)[0],
          lastEval: classified.slice(-2)[0],
        },
      }));
    };

    evaluate();

    return () => {
      cancelled = true;
      engine?.stopSearch();
    };
  }, [boardFen, engine, engineName, evalFen, board, setLiveEvalCache]);

  return currentPosition;
};
