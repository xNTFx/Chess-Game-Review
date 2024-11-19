import { useAtomValue } from "jotai";
import { useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";

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
  const [hoveredMoveIdx, setHoveredMoveIdx] = useState<number | null>(null);
  const [customSquareStyles, setCustomSquareStyles] = useState({});
  const [chessboardPosition, setChessboardPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentGame = useAtomValue(gameAtom);
  const evaluation = useAtomValue(gameEvalAtom);
  const currentPosition = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);
  const detailedHistory = currentGame.history({ verbose: true });

  const moveHistory = useMemo(() => {
    const history = currentGame.history();
    if (!history.length) return [];

    return history.reduce<
      {
        san: string;
        moveClassification?: MoveClassification;
        moveIdx: number;
      }[][]
    >((acc, move, index) => {
      if (index % 2 === 0) acc.push([]);

      acc[acc.length - 1].push({
        san: move,
        moveClassification:
          evaluation?.positions[index + 1]?.moveClassification,
        moveIdx: index + 1,
      });

      return acc;
    }, []);
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

  const handleMouseEnter = (
    moveIdx: number,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const detailedCurrentMove = detailedHistory[moveIdx];
    const buttonRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();

    // Get container dimensions
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const chessboardHeight = 210; // Approximate height of the chessboard (including padding and shadow)
      const chessboardWidth = 210; // Approximate width of the chessboard (including padding and shadow)
      const offset = 10; // Offset for better visibility and smooth transition between move chessboards

      let topPosition = buttonRect.bottom + window.scrollY;
      console.log(topPosition);

      // Check if the chessboard would be outside the container bottom
      if (
        topPosition + chessboardHeight >
        containerRect.bottom + window.scrollY
      ) {
        // Place the chessboard above the button
        topPosition =
          buttonRect.top + window.scrollY - chessboardHeight - offset;
      }

      setHoveredMoveIdx(moveIdx);

      setChessboardPosition({
        top: topPosition,
        left: Math.min(
          buttonRect.left + window.scrollX,
          containerRect.right - chessboardWidth + window.scrollX,
        ),
      });
      setCustomSquareStyles({
        [detailedCurrentMove.from]: {
          backgroundColor: "rgba(255, 255, 0, 0.6)",
        },
        [detailedCurrentMove.to]: {
          backgroundColor: "rgba(255, 255, 0, 0.6)",
        },
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredMoveIdx(null);
    setCustomSquareStyles({});
    setChessboardPosition(null);
  };

  return (
    <div ref={containerRef} className="flex w-full items-center justify-center">
      <div className="scrollbar-thin flex h-[39rem] flex-col items-start overflow-y-auto px-2">
        {moveHistory.map((moves, index) => (
          <div
            key={`${index}`}
            className="relative flex items-center justify-start"
          >
            <span className="h-8 w-8 pb-2">{index + 1}.</span>
            {moves.map(({ san, moveClassification, moveIdx }) => {
              const isCurrentMove = currentPosition?.currentMoveIdx === moveIdx;
              const highlightColor = determineMoveColor(moveClassification);

              return (
                <div
                  key={moveIdx}
                  onMouseEnter={(event) => handleMouseEnter(moveIdx - 1, event)}
                  onMouseLeave={handleMouseLeave}
                  className="relative pb-2"
                >
                  <button
                    className={`flex h-8 w-20 items-center justify-center gap-1 rounded border border-transparent hover:bg-gray-600 focus:outline-none ${
                      isCurrentMove ? "border bg-gray-900" : "cursor-pointer"
                    }`}
                    onClick={() => handleMoveClick(moveIdx, isCurrentMove)}
                  >
                    {highlightColor && (
                      <img
                        src={`/icons/${moveClassification}.png`}
                        alt="move-icon"
                        className="h-4 w-4"
                      />
                    )}
                    <span
                      className="w-10 text-sm leading-none"
                      style={{ color: highlightColor || undefined }}
                    >
                      {san}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {hoveredMoveIdx !== null && chessboardPosition && (
          <div
            style={{
              position: "absolute",
              top: chessboardPosition.top,
              left: chessboardPosition.left,
              zIndex: 1000,
            }}
            className="rounded border border-gray-300 bg-white p-1 shadow-lg"
          >
            <Chessboard
              position={detailedHistory[hoveredMoveIdx].after}
              boardWidth={200}
              customSquareStyles={customSquareStyles}
              arePiecesDraggable={false}
              areArrowsAllowed={false}
              onSquareClick={() => {}}
              onPieceClick={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
