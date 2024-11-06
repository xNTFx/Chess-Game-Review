import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { useChessActions } from "../../../hooks/useChessActions";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom,
} from "../../../stores/states";
import { MoveClassification } from "../../../types/enums";
import { moveClassificationColors } from "../../../utils/chessUtils";

export default function MovesTab() {
  const currentGame = useAtomValue(gameAtom);
  const evaluation = useAtomValue(gameEvalAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);

  const moveHistory = useMemo(() => {
    const history = currentGame.history();
    if (!history.length) return undefined;

    const classifiedMoves = [];

    for (let i = 0; i < history.length; i += 2) {
      const movesList = [
        {
          san: history[i],
          moveClassification: evaluation?.positions[i + 1]?.moveClassification,
          moveIdx: i + 1,
        },
      ];

      if (history[i + 1]) {
        movesList.push({
          san: history[i + 1],
          moveClassification: evaluation?.positions[i + 2]?.moveClassification,
          moveIdx: i + 2,
        });
      }

      classifiedMoves.push(movesList);
    }

    return classifiedMoves;
  }, [currentGame, evaluation]);

  const determineMoveColor = (
    moveClassification: MoveClassification | undefined,
  ) => {
    return moveClassification
      ? (moveClassificationColors[moveClassification] as MoveClassification)
      : undefined;
  };

  const handleMoveClick = (moveIdx: number, isCurrentMove: boolean) => {
    if (!isCurrentMove) goToMove(moveIdx, currentGame);
  };

  return (
    <div
      className="scrollbar-thin flex w-60 flex-col items-start gap-2 overflow-y-auto"
      id="moves-panel"
    >
      {moveHistory?.map((moves, index) => (
        <div
          key={`${index}`}
          className="flex h-full w-full items-center justify-start"
        >
          <span className="w-8 text-sm">{index + 1}.</span>
          {moves.map(({ san, moveClassification, moveIdx }) => {
            const isCurrentMove = currentPosition?.currentMoveIdx === moveIdx;
            const highlightColor = determineMoveColor(moveClassification);

            return (
              <div
                key={moveIdx}
                className={`flex h-full w-20 items-center justify-center gap-2 rounded border border-transparent py-1 hover:bg-gray-600 ${
                  isCurrentMove ? "border bg-gray-900" : "cursor-pointer"
                }`}
                onClick={() => handleMoveClick(moveIdx, isCurrentMove)}
                id={`move-${moveIdx}`}
              >
                {highlightColor && (
                  <img
                    src={`/icons/${moveClassification}.png`}
                    alt="move-icon"
                    className="h-3.5 w-3.5"
                  />
                )}
                <span
                  className="text-sm leading-none"
                  style={{ color: highlightColor || undefined }}
                >
                  {san}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
