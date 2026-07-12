import { isKingInCheck } from "../core/attacks";
import { ChessBoard } from "../core/board";
import { NO_PIECE } from "../core/constants";
import { evaluateBoardFromSideToMove, getPieceValue } from "../core/evaluate";
import { makeMove, undoMove } from "../core/makeMove";
import {
  getMoveCapturedPiece,
  getMovePromotionPiece,
  isCaptureMove,
  isPromotionMove,
} from "../core/move";
import { generateLegalMoves } from "../core/movegen";
import { getCaptureGain, orderMoves } from "./moveOrdering";
import { shouldStopSearch } from "./timeManager";
import { MATE_SCORE, MAX_PLY, SearchContext, SearchNode } from "./types";

const MAX_QUIESCENCE_DEPTH = 8;
const DELTA_MARGIN = 200;

export function quiescence(
  board: ChessBoard,
  alpha: number,
  beta: number,
  ply: number,
  context: SearchContext,
  remainingDepth = MAX_QUIESCENCE_DEPTH,
): SearchNode {
  context.stats.nodes += 1;
  context.stats.quiescenceNodes += 1;
  context.stats.selectiveDepth = Math.max(context.stats.selectiveDepth, ply);

  const inCheck = isKingInCheck(board, board.sideToMove);
  const standPat = evaluateBoardFromSideToMove(board);

  if (remainingDepth <= 0 || ply >= MAX_PLY) {
    return { score: standPat, pv: [] };
  }

  if (context.stats.nodes % 2048 === 0 && shouldStopSearch(context)) {
    return { score: standPat, pv: [] };
  }

  let searchAlpha = alpha;

  if (!inCheck) {
    if (standPat >= beta) return { score: standPat, pv: [] };
    if (standPat > searchAlpha) searchAlpha = standPat;
  }

  const legalMoves = generateLegalMoves(board, { capturesOnly: !inCheck }).filter(
    (move) => inCheck || isCaptureMove(move) || isPromotionMove(move),
  );

  if (legalMoves.length === 0) {
    return inCheck
      ? { score: -MATE_SCORE + ply, pv: [] }
      : { score: standPat, pv: [] };
  }

  const moves = orderMoves(board, legalMoves, context, ply);
  let bestScore = inCheck ? -MATE_SCORE + ply : standPat;
  let bestPv: number[] = [];

  for (const move of moves) {
    if (!inCheck && shouldDeltaPrune(move, standPat, searchAlpha)) continue;
    if (!inCheck && isCaptureMove(move) && getCaptureGain(move) < -350) continue;
    if (!makeMove(board, move)) continue;

    const child = quiescence(
      board,
      -beta,
      -searchAlpha,
      ply + 1,
      context,
      remainingDepth - 1,
    );
    const score = -child.score;
    undoMove(board);

    if (score > bestScore) {
      bestScore = score;
      bestPv = [move, ...child.pv];
    }

    if (score > searchAlpha) {
      searchAlpha = score;
      if (searchAlpha >= beta) {
        context.stats.cutoffs += 1;
        context.stats.betaCutoffs += 1;
        break;
      }
    }
  }

  return { score: bestScore, pv: bestPv };
}

function shouldDeltaPrune(
  move: number,
  standPat: number,
  alpha: number,
): boolean {
  const capturedPiece = getMoveCapturedPiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const capturedValue =
    capturedPiece === NO_PIECE ? 0 : getPieceValue(capturedPiece);
  const promotionValue =
    promotionPiece === NO_PIECE ? 0 : getPieceValue(promotionPiece);

  return standPat + capturedValue + promotionValue + DELTA_MARGIN < alpha;
}
