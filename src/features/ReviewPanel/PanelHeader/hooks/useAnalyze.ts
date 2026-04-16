import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useChessEngine } from "../../../../hooks/useChessEngine";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  liveEvalCacheAtom,
  savedEvalsAtom,
} from "../../../../stores/states";
import { SavedEvals } from "../../../../types/eval";
import { getEvaluateGameParams } from "../../../../utils/chessUtils";

export default function useAnalyze() {
  const currentEngineName = useAtomValue(engineNameAtom);
  const chessEngine = useChessEngine(currentEngineName);
  const [evalProgress, setEvalProgress] = useAtom(evaluationProgressAtom);
  const depthSetting = useAtomValue(engineDepthAtom);
  const multiPvSetting = useAtomValue(engineMultiPvAtom);
  const [evalResult, setEvalResult] = useAtom(gameEvalAtom);
  const currentGame = useAtomValue(gameAtom);
  const saveEvaluations = useSetAtom(savedEvalsAtom);
  const setLiveEvalCache = useSetAtom(liveEvalCacheAtom);

  const canAnalyze =
    chessEngine?.isReady() && currentGame.history().length > 0 && !evalProgress;

  const handleAnalyzeClick = async () => {
    const evaluateParams = getEvaluateGameParams(currentGame);
    if (
      !chessEngine?.isReady() ||
      evaluateParams.fens.length === 0 ||
      evalProgress
    ) {
      return;
    }

    // Clear stale partial live-eval entries so that the fresh gameEval result
    // (computed below) is not overridden by an incomplete cached partial eval.
    setLiveEvalCache({});

    const newEvaluation = await chessEngine.evaluateGame({
      ...evaluateParams,
      depth: depthSetting,
      multiPv: multiPvSetting,
      setEvaluationProgress: setEvalProgress,
    });

    setEvalResult(newEvaluation);
    setEvalProgress(null);

    const savedEvaluations: SavedEvals = evaluateParams.fens.reduce(
      (acc, fen, idx) => {
        acc[fen] = {
          ...newEvaluation.positions[idx],
          engine: newEvaluation.settings.engine,
        };
        return acc;
      },
      {} as SavedEvals,
    );

    saveEvaluations((prevEvals) => ({
      ...prevEvals,
      ...savedEvaluations,
    }));
  };
  return { canAnalyze, handleAnalyzeClick, evalResult };
}
