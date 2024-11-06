import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useChessEngine } from "../../../../hooks/useChessEngine";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
} from "../../../../stores/states";
import { SavedEvals } from "../../../../types/eval";
import { getEvaluateGameParams } from "../../../../utils/chessUtils";

export default function useAnalyze() {
  const currentEngineName = useAtomValue(engineNameAtom);
  const chessEngine = useChessEngine();
  const [evalProgress, setEvalProgress] = useAtom(evaluationProgressAtom);
  const depthSetting = useAtomValue(engineDepthAtom);
  const multiPvSetting = useAtomValue(engineMultiPvAtom);
  const [evalResult, setEvalResult] = useAtom(gameEvalAtom);
  const currentGame = useAtomValue(gameAtom);
  const saveEvaluations = useSetAtom(savedEvalsAtom);

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
          engine: currentEngineName,
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
