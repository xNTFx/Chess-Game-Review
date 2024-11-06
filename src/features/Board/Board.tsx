import { Chess } from "chess.js";
import { PrimitiveAtom, atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import {
  Arrow,
  CustomSquareRenderer,
  PromotionPieceOption,
  Square,
} from "react-chessboard/dist/chessboard/types";

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
  currentPositionAtom?: PrimitiveAtom<CurrentPosition>;
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
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [moveClickFrom, setMoveClickFrom] = useState<Square | null>(null);
  const [moveClickTo, setMoveClickTo] = useState<Square | null>(null);

  const gameFen = game.fen();

  const isPiecePlayable = useCallback(
    ({ piece }: { piece: string }): boolean => {
      if (game.isGameOver() || !canPlay) return false;
      if (canPlay === true || canPlay === piece[0]) return true;
      return false;
    },
    [canPlay, game],
  );

  const onPieceDrop = (
    source: Square,
    target: Square,
    piece: string,
  ): boolean => {
    if (!isPiecePlayable({ piece })) return false;

    const result = makeGameMove(
      {
        from: source,
        to: target,
        promotion: piece[1]?.toLowerCase() ?? "q",
      },
      true,
    );

    return !!result;
  };

  const resetMoveClick = (square?: Square | null) => {
    setMoveClickFrom(square ?? null);
    setMoveClickTo(null);
    setShowPromotionDialog(false);
    if (square) {
      const moves = game.moves({ square, verbose: true });
      setPlayableSquares(moves.map((m) => m.to));
    } else {
      setPlayableSquares([]);
    }
  };

  const handleSquareLeftClick = (square: Square, piece?: string) => {
    setClickedSquares([]);

    if (moveClickFrom === square) {
      resetMoveClick();
      return;
    }

    if (!moveClickFrom) {
      if (piece && !isPiecePlayable({ piece })) return;
      resetMoveClick(square);
      return;
    }

    const validMoves = game.moves({ square: moveClickFrom, verbose: true });
    const move = validMoves.find((m) => m.to === square);

    if (!move) {
      resetMoveClick(square);
      return;
    }

    setMoveClickTo(square);

    if (
      move.piece === "p" &&
      ((move.color === "w" && square[1] === "8") ||
        (move.color === "b" && square[1] === "1"))
    ) {
      setShowPromotionDialog(true);
      return;
    }

    const result = makeGameMove({
      from: moveClickFrom,
      to: square,
    });

    resetMoveClick(result ? undefined : square);
  };
  const handleSquareRightClick = (square: Square) => {
    setClickedSquares((prev) =>
      prev.includes(square)
        ? prev.filter((s) => s !== square)
        : [...prev, square],
    );
  };

  const handlePieceDragBegin = (_: string, square: Square) => {
    resetMoveClick(square);
  };

  const handlePieceDragEnd = () => {
    resetMoveClick();
  };

  const onPromotionPieceSelect = (
    piece?: PromotionPieceOption,
    from?: Square,
    to?: Square,
  ) => {
    if (!piece) return false;
    const promotionPiece = piece[1]?.toLowerCase() ?? "q";

    if (moveClickFrom && moveClickTo) {
      const result = makeGameMove({
        from: moveClickFrom,
        to: moveClickTo,
        promotion: promotionPiece,
      });
      resetMoveClick();
      return !!result;
    }

    if (from && to) {
      const result = makeGameMove({
        from,
        to,
        promotion: promotionPiece,
      });
      resetMoveClick();
      return !!result;
    }

    resetMoveClick(moveClickFrom);
    return false;
  };

  const customArrows: Arrow[] = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    const moveClassification = position?.eval?.moveClassification;

    if (
      bestMove &&
      showBestMoveArrow &&
      moveClassification !== MoveClassification.Book
    ) {
      const bestMoveArrow = [
        bestMove.slice(0, 2),
        bestMove.slice(2, 4),
        moveClassificationColors[MoveClassification.Best],
      ] as Arrow;

      return [bestMoveArrow];
    }

    return [];
  }, [position, showBestMoveArrow]);

  const SquareRenderer: CustomSquareRenderer = useMemo(() => {
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
        <div className="h-[90vw] sm:h-[30rem] md:h-[40rem] 2xl:h-[50rem]">
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
          className="flex h-[90vw] w-[90vw] select-none items-center justify-center sm:h-[30rem] sm:w-[30rem] md:h-[40rem] md:w-[40rem] xl:h-[40rem] xl:w-[40rem] 2xl:h-[50rem] 2xl:w-[50rem]"
        >
          <Chessboard
            id={`${boardId}-${canPlay}`}
            position={gameFen}
            onPieceDrop={onPieceDrop}
            boardOrientation={
              boardOrientation === Color.White ? "white" : "black"
            }
            customBoardStyle={{
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
              width: "100%",
              height: "100%",
            }}
            customArrows={customArrows}
            isDraggablePiece={isPiecePlayable}
            customSquare={SquareRenderer}
            onSquareClick={handleSquareLeftClick}
            onSquareRightClick={handleSquareRightClick}
            onPieceDragBegin={handlePieceDragBegin}
            onPieceDragEnd={handlePieceDragEnd}
            onPromotionPieceSelect={onPromotionPieceSelect}
            showPromotionDialog={showPromotionDialog}
            promotionToSquare={moveClickTo}
            animationDuration={200}
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
