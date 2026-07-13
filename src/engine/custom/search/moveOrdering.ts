import { ChessBoard } from "../core/board";
import {
  NO_PIECE,
  getEncodedPieceColor,
  getEncodedPieceType,
} from "../core/constants";
import { getPieceValue } from "../core/evaluate";
import {
  getMoveCapturedPiece,
  getMoveFlag,
  getMoveFrom,
  getMovePiece,
  getMovePromotionPiece,
  getMoveTo,
  isCaptureMove,
  isPromotionMove,
  MOVE_FLAG_CASTLE,
} from "../core/move";
import { SearchContext } from "./types";

const TT_MOVE_SCORE = 2_000_000;
const WINNING_CAPTURE_SCORE = 1_000_000;
const PROMOTION_SCORE = 800_000;
const KILLER_SCORE = 600_000;
const HISTORY_LIMIT = 16000;
const CENTER_SQUARES = new Set([27, 28, 35, 36]);

export function orderMoves(
  board: ChessBoard,
  moves: number[],
  context: SearchContext,
  ply: number,
  ttMove?: number,
): number[] {
  if (!context.config.useMoveOrdering) return moves;

  return moves.sort(
    (a, b) =>
      scoreMove(board, b, context, ply, ttMove) -
      scoreMove(board, a, context, ply, ttMove),
  );
}

export function scoreMove(
  board: ChessBoard,
  move: number,
  context: SearchContext,
  ply: number,
  ttMove?: number,
): number {
  if (ttMove !== undefined && move === ttMove) return TT_MOVE_SCORE;

  let score = 0;
  const promotionPiece = getMovePromotionPiece(move);

  if (isCaptureMove(move)) {
    const gain = getCaptureGain(move);

    score += WINNING_CAPTURE_SCORE + gain * 32;
  }

  if (promotionPiece !== NO_PIECE) {
    score += PROMOTION_SCORE + getPieceValue(promotionPiece);
  }

  if (isKillerMove(context, ply, move)) score += KILLER_SCORE;
  if (CENTER_SQUARES.has(getMoveTo(move))) score += 20;

  score += getHistoryScore(board, context, move);

  return score;
}

export function addKillerMove(
  context: SearchContext,
  ply: number,
  move: number,
) {
  if (!context.killerMoves[ply]) context.killerMoves[ply] = [];
  if (context.killerMoves[ply].includes(move)) return;

  context.killerMoves[ply] = [move, ...context.killerMoves[ply]].slice(0, 2);
}

export function addHistoryScore(
  board: ChessBoard,
  context: SearchContext,
  move: number,
  depth: number,
) {
  const index = getHistoryIndex(board, move);
  const bonus = depth * depth;

  context.history[index] = Math.min(HISTORY_LIMIT, context.history[index] + bonus);
}

export function isQuietSearchMove(move: number): boolean {
  return (
    !isCaptureMove(move) &&
    !isPromotionMove(move) &&
    getMoveFlag(move) !== MOVE_FLAG_CASTLE
  );
}

export function getCaptureGain(move: number): number {
  const capturedPiece = getMoveCapturedPiece(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const capturedValue =
    capturedPiece === NO_PIECE ? 0 : getPieceValue(capturedPiece);
  const promotionGain =
    promotionPiece === NO_PIECE
      ? 0
      : getPieceValue(promotionPiece) - getPieceValue(movingPiece);

  return capturedValue + promotionGain - getPieceValue(movingPiece);
}

export function getCapturedPieceOnBoard(
  board: ChessBoard,
  move: number,
): number {
  const targetPiece = board.pieceBySquare[getMoveTo(move)];

  if (
    targetPiece !== NO_PIECE &&
    getEncodedPieceColor(targetPiece) !== board.sideToMove
  ) {
    return getEncodedPieceType(targetPiece);
  }

  return getMoveCapturedPiece(move);
}

function isKillerMove(
  context: SearchContext,
  ply: number,
  move: number,
): boolean {
  return context.killerMoves[ply]?.includes(move) ?? false;
}

function getHistoryScore(
  board: ChessBoard,
  context: SearchContext,
  move: number,
): number {
  return context.history[getHistoryIndex(board, move)] ?? 0;
}

function getHistoryIndex(board: ChessBoard, move: number): number {
  return board.sideToMove * 4096 + getMoveFrom(move) * 64 + getMoveTo(move);
}
