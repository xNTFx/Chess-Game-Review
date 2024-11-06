import { Move } from "chess.js";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { boardAtom, currentPositionAtom } from "../../../../stores/states";
import { MoveClassification } from "../../../../types/enums";
import {
  moveClassificationIcons,
  moveLineUciToSan,
} from "../../../../utils/chessUtils";

export default function MoveInfo() {
  const position = useAtomValue(currentPositionAtom);
  const game = useAtomValue(boardAtom);

  const bestMove = position?.lastEval?.bestMove;

  const bestMoveSan = useMemo(() => {
    if (!bestMove) return undefined;

    const history = game.history({ verbose: true }) as Move[];
    const lastPosition =
      history.length > 0 ? history[history.length - 1].before : undefined;
    if (!lastPosition) return undefined;

    return moveLineUciToSan(lastPosition)(bestMove);
  }, [bestMove, game]);

  if (!bestMoveSan) return null;

  const moveClassification = position.eval?.moveClassification;
  const moveLabel = moveClassification
    ? `${position.lastMove?.san} is ${moveClassificationLabels[moveClassification]}`
    : null;

  const bestMoveLabel =
    moveClassification === MoveClassification.Best ||
    moveClassification === MoveClassification.Book ||
    moveClassification === MoveClassification.Brilliant ||
    moveClassification === MoveClassification.Great
      ? null
      : `${bestMoveSan} was the best move`;

  const textColorClass = getMoveClassificationColor(moveClassification);
  const iconSrc = moveClassification
    ? moveClassificationIcons[moveClassification]
    : null;

  return (
    <div className="flex w-full items-center justify-center gap-5">
      {moveLabel && !game.isCheckmate() && (
        <div className="flex items-center">
          {iconSrc && (
            <img
              src={iconSrc}
              alt={
                moveClassification
                  ? `${moveClassificationLabels[moveClassification]} icon`
                  : ""
              }
              className="mr-2 h-6 w-6"
            />
          )}
          <p className={`text-center text-sm font-bold ${textColorClass}`}>
            {moveLabel}
          </p>
        </div>
      )}
      {bestMoveLabel && !game.isCheckmate() && (
        <p className={`text-center text-sm font-bold text-[#4caf50]`}>
          {bestMoveLabel}
        </p>
      )}
    </div>
  );
}

const moveClassificationLabels: Record<MoveClassification, string> = {
  [MoveClassification.Book]: "a book move",
  [MoveClassification.Brilliant]: "brilliant!!",
  [MoveClassification.Great]: "a great move!",
  [MoveClassification.Best]: "the best move",
  [MoveClassification.Excellent]: "excellent",
  [MoveClassification.Good]: "good",
  [MoveClassification.Inaccuracy]: "an inaccuracy",
  [MoveClassification.Mistake]: "a mistake",
  [MoveClassification.Missed_win]: "a missed win",
  [MoveClassification.Blunder]: "a blunder",
};

function getMoveClassificationColor(
  moveClassification?: MoveClassification,
): string {
  switch (moveClassification) {
    case MoveClassification.Brilliant:
      return "text-[#00b2b2]";
    case MoveClassification.Great:
      return "text-[#5088c7]";
    case MoveClassification.Best:
      return "text-[#9bbc22]";
    case MoveClassification.Excellent:
      return "text-[#6cab49]";
    case MoveClassification.Good:
      return "text-[#b0c4aa]";
    case MoveClassification.Book:
      return "text-[#a67c52]";
    case MoveClassification.Inaccuracy:
      return "text-[#dfb945]";
    case MoveClassification.Mistake:
      return "text-[#e79437]";
    case MoveClassification.Missed_win:
      return "text-[#DBAC16]";
    case MoveClassification.Blunder:
      return "text-[#be2d30]";
    default:
      return "text-gray-600";
  }
}
