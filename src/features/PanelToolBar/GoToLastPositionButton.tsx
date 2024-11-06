import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { FaAnglesRight } from "react-icons/fa6";

import { useChessActions } from "../../hooks/useChessActions";
import { boardAtom, gameAtom } from "../../stores/states";

export default function GoToLastPositionButton() {
  const { setPgn: updateBoardPgn } = useChessActions(boardAtom);
  const gameState = useAtomValue(gameAtom);
  const boardState = useAtomValue(boardAtom);

  const gameMoves = gameState.history();
  const boardMoves = boardState.history();

  const isButtonDisabled = boardMoves >= gameMoves;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && !isButtonDisabled) {
        updateBoardPgn(gameState.pgn());
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isButtonDisabled, updateBoardPgn, gameState]);

  return (
    <div>
      <button
        onClick={() => {
          if (isButtonDisabled) return;
          updateBoardPgn(gameState.pgn());
        }}
        className={`rounded p-2 transition-colors hover:bg-gray-500 ${
          isButtonDisabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        disabled={isButtonDisabled}
        title="Final position"
      >
        <FaAnglesRight className="text-white" />
      </button>
    </div>
  );
}
