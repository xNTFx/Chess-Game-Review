import { useAtomValue } from "jotai";
import { capitalize } from "lodash";

import { useChessActions } from "../../../../hooks/useChessActions";
import { useGetPlayersNamesAndElo } from "../../../../hooks/useGetPlayersNamesAndElo";
import { boardAtom, gameAtom, gameEvalAtom } from "../../../../stores/states";
import { Color, MoveClassification } from "../../../../types/enums";
import {
  moveClassificationColors,
  sortedMoveClassifications,
} from "../../../../utils/chessUtils";

const classificationDescriptions: Record<MoveClassification, string> = {
  [MoveClassification.Book]: "A known move from opening theory.",
  [MoveClassification.Brilliant]:
    "A strategically exceptional move involving a sacrifice, that shifts the game in the player's favor.",
  [MoveClassification.Great]:
    "A strong and insightful move that avoids substantial loss and may be the best or only good option.",
  [MoveClassification.Best]: "The best possible move in the position.",
  [MoveClassification.Excellent]: "An accurate and solid move.",
  [MoveClassification.Good]: "A good move that maintains an advantage.",
  [MoveClassification.Inaccuracy]:
    "A less accurate move that misses a better option.",
  [MoveClassification.Mistake]: "A move that reduces advantage significantly.",
  [MoveClassification.Missed_win]: "A move that misses a winning opportunity.",
  [MoveClassification.Blunder]: "A critical mistake that often loses the game.",
};

export default function ClassificationCount() {
  const { whiteName, blackName } = useGetPlayersNamesAndElo(gameAtom);
  const evaluation = useAtomValue(gameEvalAtom);
  const currentBoard = useAtomValue(boardAtom);
  const currentGame = useAtomValue(gameAtom);
  const { goToMove } = useChessActions(boardAtom);

  if (!evaluation?.positions.length) return null;

  const getMovesCount = (classification: MoveClassification, color: Color) => {
    return evaluation.positions.filter(
      (pos, index) =>
        (color === Color.White ? index % 2 !== 0 : index % 2 === 0) &&
        pos.moveClassification === classification,
    ).length;
  };

  const handleMoveClick = (
    classification: MoveClassification,
    color: Color,
    moveCount: number,
  ) => {
    if (!evaluation || moveCount === 0) return;

    const isColorMatch = (index: number) =>
      (index % 2 !== 0 && color === Color.White) ||
      (index % 2 === 0 && color === Color.Black);
    const currentMoveIndex = currentBoard.history().length;

    const nextPositionIndex = evaluation.positions.findIndex(
      (pos, index) =>
        isColorMatch(index) &&
        pos.moveClassification === classification &&
        index > currentMoveIndex,
    );

    if (nextPositionIndex > 0) {
      goToMove(nextPositionIndex, currentGame);
    } else {
      const firstPositionIndex = evaluation.positions.findIndex(
        (pos, index) =>
          isColorMatch(index) && pos.moveClassification === classification,
      );
      if (firstPositionIndex > 0 && firstPositionIndex !== currentMoveIndex) {
        goToMove(firstPositionIndex, currentGame);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="mb-2 flex w-full items-center justify-around">
        <span className="text-lg font-semibold">{whiteName}</span>
        <span className="text-lg font-semibold">vs</span>
        <span className="text-lg font-semibold">{blackName}</span>
      </div>
      {sortedMoveClassifications.map((classification) => {
        const whiteMovesCount = getMovesCount(classification, Color.White);
        const blackMovesCount = getMovesCount(classification, Color.Black);

        return (
          <div
            key={classification}
            className={`flex flex-row items-center justify-between text-${moveClassificationColors[classification]} w-[20rem]`}
            title={classificationDescriptions[classification]}
          >
            <div
              className={`flex w-12 select-none items-center justify-center cursor-${
                whiteMovesCount ? "pointer" : "default"
              }`}
              onClick={() =>
                handleMoveClick(classification, Color.White, whiteMovesCount)
              }
            >
              <span className="text-sm">{whiteMovesCount}</span>
            </div>

            <div className="flex w-24 items-center justify-start gap-2">
              <img
                src={`/icons/${classification}.png`}
                alt="move-icon"
                className="h-4 max-h-[3.5vw] w-4 max-w-[3.5vw]"
              />
              <span className="text-sm">
                {capitalize(classification.replace("_", " "))}
              </span>
            </div>

            <div
              className={`flex w-12 select-none items-center justify-center cursor-${
                blackMovesCount ? "pointer" : "default"
              }`}
              onClick={() =>
                handleMoveClick(classification, Color.Black, blackMovesCount)
              }
            >
              <span className="text-sm">{blackMovesCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
