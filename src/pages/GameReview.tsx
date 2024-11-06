import { useAtomValue } from "jotai";

import Board from "../features/Board/Board";
import ReviewPanel from "../features/ReviewPanel/ReviewPanel";
import { useGetPlayersNamesAndElo } from "../hooks/useGetPlayersNamesAndElo";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  gameAtom,
  isShowArrowBestMoveEnabledAtom,
  isShowMoveClassificationEnabledAtom,
} from "../stores/states";
import { Color } from "../types/enums";

export default function GameReview() {
  const chessGame = useAtomValue(gameAtom);

  const boardOrientation = useAtomValue(boardOrientationAtom);
  const isShowArrowBestMoveEnabled = useAtomValue(
    isShowArrowBestMoveEnabledAtom,
  );
  const { whiteName, whiteElo, blackName, blackElo } =
    useGetPlayersNamesAndElo(gameAtom);

  const isGameDataLoaded = chessGame.history().length > 0;

  return (
    <div className="flex h-full min-h-screen w-screen flex-col items-start justify-center gap-4 overflow-auto xl:flex-row">
      <div className="h-full w-fullflex w-full flex-col justify-center p-2">
        <Board
          id="AnalysisBoard"
          canPlay={true}
          gameAtom={boardAtom}
          whitePlayer={whiteElo ? `${whiteName} (${whiteElo})` : whiteName}
          blackPlayer={blackElo ? `${blackName} (${blackElo})` : blackName}
          boardOrientation={boardOrientation ? Color.White : Color.Black}
          currentPositionAtom={currentPositionAtom}
          showBestMoveArrow={isShowArrowBestMoveEnabled}
          isShowMoveClassificationEnabledAtom={
            isShowMoveClassificationEnabledAtom
          }
          showEvaluationBar={true}
        />
      </div>
      <div className="w-full xl:static xl:h-auto xl:rounded-b-lg overflow-auto">
        <ReviewPanel isGameDataLoaded={isGameDataLoaded} />
      </div>
    </div>
  );
}
