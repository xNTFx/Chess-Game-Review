import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { FaAngleLeft, FaAnglesLeft } from "react-icons/fa6";

import { useChessActions } from "../../hooks/useChessActions";
import { boardAtom } from "../../stores/states";
import { getStartingFen } from "../../utils/chessUtils";
import EngineSettingsDialog from "../EngineSettingsDialog/EngineSettingsDialog";
import FlipBoardButton from "./FlipBoardButton";
import GoToLastPositionButton from "./GoToLastPositionButton";
import NextMoveButton from "./NextMoveButton";

export default function PanelToolBar() {
  const currentBoard = useAtomValue(boardAtom);
  const { resetBoardPosition, undoMove: undoLastMove } =
    useChessActions(boardAtom);

  const boardMovesHistory = currentBoard.history();

  const [isHoldingLeft, setIsHoldingLeft] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isHoldingLeft && boardMovesHistory.length > 0) {
      intervalId = setInterval(undoLastMove, 50);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isHoldingLeft, boardMovesHistory, undoLastMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (boardMovesHistory.length === 0) return;

      if (e.key === "ArrowLeft") {
        setIsHoldingLeft(true);
      } else if (e.key === "ArrowDown") {
        resetBoardPosition({ fen: getStartingFen({ game: currentBoard }) });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setIsHoldingLeft(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [boardMovesHistory, resetBoardPosition, currentBoard]);

  return (
    <div className="flex items-center justify-center gap-2">
      <FlipBoardButton />

      <button
        onClick={() =>
          resetBoardPosition({ fen: getStartingFen({ game: currentBoard }) })
        }
        disabled={boardMovesHistory.length === 0}
        className={`rounded p-2 transition-colors hover:bg-gray-500 ${
          boardMovesHistory.length === 0 ? "cursor-not-allowed opacity-50" : ""
        }`}
        title="Start position"
      >
        <FaAnglesLeft className="text-white" />
      </button>

      <button
        onClick={() => undoLastMove()}
        disabled={boardMovesHistory.length === 0}
        className={`rounded p-2 transition-colors hover:bg-gray-500 ${
          boardMovesHistory.length === 0 ? "cursor-not-allowed opacity-50" : ""
        }`}
        title="Previous move"
      >
        <FaAngleLeft className="text-white" size={30} />
      </button>

      <NextMoveButton />

      <GoToLastPositionButton />
      <EngineSettingsDialog />
    </div>
  );
}
