import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { FaAngleRight } from "react-icons/fa6";

import { useChessActions } from "../../hooks/useChessActions";
import { boardAtom, gameAtom } from "../../stores/states";

export default function NextMoveButton() {
  const { makeMove: moveOnBoard } = useChessActions(boardAtom);
  const currentGame = useAtomValue(gameAtom);
  const currentBoard = useAtomValue(boardAtom);

  const gameMoves = currentGame.history();
  const boardMoves = currentBoard.history();

  const isButtonEnabled =
    boardMoves.length < gameMoves.length &&
    gameMoves.slice(0, boardMoves.length).join() === boardMoves.join();

  const playNextGameMove = useCallback(() => {
    if (!isButtonEnabled) return;

    const nextMoveIndex = boardMoves.length;
    const nextMove = currentGame.history({ verbose: true })[nextMoveIndex];

    if (nextMove) {
      moveOnBoard({
        from: nextMove.from,
        to: nextMove.to,
        promotion: nextMove.promotion,
      });
    }
  }, [isButtonEnabled, boardMoves, currentGame, moveOnBoard]);

  const [isHoldingRight, setIsHoldingRight] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isHoldingRight && isButtonEnabled) {
      intervalId = setInterval(playNextGameMove, 50);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isHoldingRight, isButtonEnabled, playNextGameMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIsHoldingRight(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setIsHoldingRight(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div>
      <button
        onClick={playNextGameMove}
        className={`rounded p-2 transition-colors hover:bg-gray-500 ${
          !isButtonEnabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        disabled={!isButtonEnabled}
        title="Next move"
      >
        <FaAngleRight className="text-white" size={30} />
      </button>
    </div>
  );
}
