import { Chess } from "chess.js";
import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { Chessboard } from "react-chessboard";

import { useChessActions } from "../../../../hooks/useChessActions";
import { boardAtom } from "../../../../stores/states";
import { LineEval } from "../../../../types/eval";
import {
  getLineEvalLabel,
  moveLineUciToSan,
} from "../../../../utils/chessUtils";

interface Props {
  line: LineEval;
}

export default function LineEvaluation({ line }: Props) {
  const chessBoard = useAtomValue(boardAtom);
  const evaluationLabel = getLineEvalLabel(line);
  const { makeMovesFromLine } = useChessActions(boardAtom);

  const fen = chessBoard.fen();

  const isNegativeEval =
    (line.cp !== undefined && line.cp < 0) ||
    (line.mate !== undefined && line.mate < 0);

  const showPlaceholder = line.depth < 6;

  const [hoveredMoveFen, setHoveredMoveFen] = useState<string | null>(null);
  const [customSquareStyles, setCustomSquareStyles] = useState({});
  const isMoving = useRef(false);

  // Function to generate the FEN after applying a sequence of moves
  const getFenAfterMoves = (initialFen: string, moves: string[]) => {
    const chess = new Chess(initialFen);

    try {
      moves.forEach((move) => {
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const promotion = move.length === 5 ? move[4] : undefined;

        const result = chess.move({ from, to, promotion });
        if (!result) throw new Error(`Invalid move: ${move}`);
      });
      return chess.fen();
    } catch {
      return initialFen;
    }
  };

  const handleMouseEnterMove = (move: string, index: number) => {
    if (isMoving.current) return;

    const movesToPreview = line.pv.slice(0, index + 1);
    const fenAfterMoves = getFenAfterMoves(fen, movesToPreview);
    setHoveredMoveFen(fenAfterMoves);

    const fromSquare = move.slice(0, 2);
    const toSquare = move.slice(2, 4);

    setCustomSquareStyles({
      [fromSquare]: { backgroundColor: "rgba(255, 255, 0, 0.6)" },
      [toSquare]: { backgroundColor: "rgba(255, 255, 0, 0.6)" },
    });
  };

  const handleOnClick = (index: number) => {
    const movesToMake = line.pv.slice(0, index + 1).map((move) => ({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move.length === 5 ? move[4] : undefined,
    }));

    isMoving.current = true;
    makeMovesFromLine(movesToMake, true);
    isMoving.current = false;

    setCustomSquareStyles({});
    setHoveredMoveFen(null);
  };

  return (
    <div className="relative flex h-[2.563rem] items-center text-center text-sm">
      <div
        className={`mr-4 min-w-[4rem] rounded-md p-1 text-center font-bold ${
          isNegativeEval ? "bg-black text-white" : "bg-white text-black"
        }`}
        style={{
          border: "1px solid #424242",
        }}
      >
        {showPlaceholder ? (
          <div className="h-5 animate-pulse rounded-md bg-gray-200"></div>
        ) : (
          evaluationLabel
        )}
      </div>

      <div className="max-w-[30rem] flex-grow overflow-x-auto whitespace-nowrap pb-1 text-sm">
        {showPlaceholder ? (
          <div className="h-5 w-60 animate-pulse rounded-md bg-gray-200"></div>
        ) : (
          <div className="flex flex-row">
            {line.pv.map((move, index) => (
              <button
                key={index}
                onMouseEnter={() => handleMouseEnterMove(move, index)}
                onMouseLeave={() => {
                  setHoveredMoveFen(null);
                  setCustomSquareStyles({});
                }}
                onClick={() => handleOnClick(index)}
                className="pr-2"
              >
                {moveLineUciToSan(fen)(move)}
              </button>
            ))}
          </div>
        )}
      </div>

      {hoveredMoveFen && (
        <div
          onMouseEnter={() => {
            setHoveredMoveFen(null);
            setCustomSquareStyles({});
          }}
          className="absolute left-0 top-10 z-50 rounded border border-gray-300 bg-white p-1 shadow-lg"
        >
          <Chessboard
            position={hoveredMoveFen}
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
  );
}
