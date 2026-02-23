import { Chess, Square } from "chess.js";
import { Atom, PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import {
  Arrow,
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  SquareHandlerArgs,
  SquareRenderer,
} from "react-chessboard";

import { useChessActions } from "../../hooks/useChessActions";
import {
  boardAtom,
  clickedSquaresAtom,
  playableSquaresAtom,
} from "../../stores/states";
import { Color, MoveClassification } from "../../types/enums";
import { CurrentPosition } from "../../types/eval";
import { moveClassificationColors } from "../../utils/chessUtils";
import CapturedPieces from "./CapturedPieces";
import Clock from "./Clock";
import EvaluationBar from "./EvaluationBar";
import { getSquareRenderer } from "./SquareRenderer";

export interface Props {
  id: string;
  canPlay?: Color | boolean;
  gameAtom: PrimitiveAtom<Chess>;
  boardSize?: number;
  whitePlayer?: string;
  blackPlayer?: string;
  boardOrientation?: Color;
  currentPositionAtom?: Atom<CurrentPosition>;
  showBestMoveArrow?: boolean;
  isShowMoveClassificationEnabledAtom?: PrimitiveAtom<boolean>;
  showEvaluationBar?: boolean;
}

export default function Board({
  id: boardId,
  canPlay,
  whitePlayer,
  blackPlayer,
  boardOrientation = Color.White,
  currentPositionAtom = atom({}),
  showBestMoveArrow = false,
  isShowMoveClassificationEnabledAtom,
  showEvaluationBar = false,
}: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const game = useAtomValue(boardAtom);
  const { makeMove: makeGameMove } = useChessActions(boardAtom);
  const setClickedSquares = useSetAtom(clickedSquaresAtom);
  const setPlayableSquares = useSetAtom(playableSquaresAtom);
  const position = useAtomValue(currentPositionAtom);
  const [moveClickFrom, setMoveClickFrom] = useState<Square | null>(null);

  const gameFen = game.fen();

  const isPiecePlayable = useCallback(
    ({ piece }: PieceHandlerArgs): boolean => {
      if (game.isGameOver() || !canPlay) return false;
      if (canPlay === true || canPlay === piece.pieceType[0]) return true;
      return false;
    },
    [canPlay, game],
  );

  const onPieceDrop = ({
    piece,
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) return false;
    if (!isPiecePlayable({ isSparePiece: false, piece, square: sourceSquare }))
      return false;

    const result = makeGameMove(
      { from: sourceSquare, to: targetSquare, promotion: "q" },
      true,
    );
    return !!result;
  };

  const resetMoveClick = (square?: Square | null) => {
    setMoveClickFrom(square ?? null);
    if (square) {
      const moves = game.moves({ square, verbose: true });
      setPlayableSquares(moves.map((m) => m.to));
    } else {
      setPlayableSquares([]);
    }
  };

  const handleSquareLeftClick = ({ piece, square: sq }: SquareHandlerArgs) => {
    setClickedSquares([]);
    const square = sq as Square;
    const pieceStr = piece?.pieceType;

    if (moveClickFrom === square) {
      resetMoveClick();
      return;
    }

    if (!moveClickFrom) {
      if (
        pieceStr &&
        !isPiecePlayable({
          isSparePiece: false,
          piece: { pieceType: pieceStr },
          square,
        })
      )
        return;
      resetMoveClick(square);
      return;
    }

    const validMoves = game.moves({ square: moveClickFrom, verbose: true });
    const move = validMoves.find((m) => m.to === square);

    if (!move) {
      resetMoveClick(square);
      return;
    }

    const result = makeGameMove({
      from: moveClickFrom,
      to: square,
      promotion: "q",
    });

    resetMoveClick(result ? undefined : square);
  };

  const handleSquareRightClick = ({ square: sq }: SquareHandlerArgs) => {
    const square = sq as Square;
    setClickedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square],
    );
  };

  const handlePieceDrag = ({ square }: PieceHandlerArgs) => {
    if (square) resetMoveClick(square as Square);
  };

  const customArrows: Arrow[] = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    const moveClassification = position?.eval?.moveClassification;

    if (
      bestMove &&
      showBestMoveArrow &&
      moveClassification !== MoveClassification.Book
    ) {
      return [
        {
          startSquare: bestMove.slice(0, 2),
          endSquare: bestMove.slice(2, 4),
          color: moveClassificationColors[MoveClassification.Best],
        },
      ];
    }

    return [];
  }, [position, showBestMoveArrow]);

  const squareRenderer: SquareRenderer = useMemo(() => {
    return getSquareRenderer({
      currentPositionAtom,
      clickedSquaresAtom,
      playableSquaresAtom,
      isShowMoveClassificationEnabledAtom,
    });
  }, [currentPositionAtom, isShowMoveClassificationEnabledAtom]);

  return (
    <div className="flex w-full items-center justify-center">
      {showEvaluationBar && (
        <div className="h-[90vw] sm:h-120 md:h-160 2xl:h-200">
          <EvaluationBar
            boardOrientation={boardOrientation}
            currentPositionAtom={currentPositionAtom}
          />
        </div>
      )}

      <div
        className={`flex flex-col items-center gap-1 ${
          showEvaluationBar ? "pl-2" : ""
        }`}
      >
        <div className="flex w-full items-center justify-between">
          <div className="w-full items-start">
            <div>
              <p>
                {boardOrientation === Color.White ? blackPlayer : whitePlayer}
              </p>
            </div>
            <div className="ml-auto flex items-end">
              <CapturedPieces
                gameAtom={boardAtom}
                color={
                  boardOrientation === Color.White ? Color.Black : Color.White
                }
              />
            </div>
          </div>
          <Clock
            boardOrientation={
              boardOrientation === Color.White ? Color.Black : Color.White
            }
          />
        </div>

        <div
          ref={boardRef}
          className="flex h-[90vw] w-[90vw] items-center justify-center select-none sm:h-120 sm:w-120 md:h-160 md:w-160 xl:h-160 xl:w-160 2xl:h-200 2xl:w-200"
        >
          <Chessboard
            options={{
              id: `${boardId}-${canPlay}`,
              position: gameFen,
              boardOrientation:
                boardOrientation === Color.White ? "white" : "black",
              boardStyle: {
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                width: "100%",
                height: "100%",
              },
              arrows: customArrows,
              canDragPiece: isPiecePlayable,
              squareRenderer,
              onSquareClick: handleSquareLeftClick,
              onSquareRightClick: handleSquareRightClick,
              onPieceDrag: handlePieceDrag,
              onPieceDrop,
              animationDurationInMs: 200,
            }}
          />
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="w-full items-start">
            <div>
              <p>
                {boardOrientation === Color.White ? whitePlayer : blackPlayer}
              </p>
            </div>
            <div className="ml-auto flex items-end">
              <CapturedPieces gameAtom={boardAtom} color={boardOrientation} />
            </div>
          </div>
          <Clock boardOrientation={boardOrientation} />
        </div>
      </div>
    </div>
  );
}
