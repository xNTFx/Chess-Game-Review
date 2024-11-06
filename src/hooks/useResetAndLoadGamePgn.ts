import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

import {
  boardAtom,
  boardOrientationAtom,
  currentTabAtom,
  gameAtom,
  gameEvalAtom,
} from "../stores/states";
import { getStartingFen } from "../utils/chessUtils";
import { useChessActions } from "./useChessActions";

export default function useResetAndLoadGamePgn() {
  const { setPgn: updateGamePgn } = useChessActions(gameAtom);
  const { resetBoardPosition } = useChessActions(boardAtom);
  const setEvaluation = useSetAtom(gameEvalAtom);
  const updateBoardOrientation = useSetAtom(boardOrientationAtom);
  const [, setCurrentTab] = useAtom(currentTabAtom);

  return useCallback(
    (pgn: string) => {
      resetBoardPosition({ fen: getStartingFen({ pgn }) });
      setEvaluation(undefined);
      updateBoardOrientation(true);
      updateGamePgn(pgn);
      setCurrentTab(0);
    },
    [
      resetBoardPosition,
      updateGamePgn,
      setEvaluation,
      updateBoardOrientation,
      setCurrentTab,
    ],
  );
}
