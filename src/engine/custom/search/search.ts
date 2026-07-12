import { PositionEval } from "../../../types/eval";
import { isKingInCheck } from "../core/attacks";
import { ChessBoard } from "../core/board";
import {
  BISHOP,
  Color,
  KNIGHT,
  QUEEN,
  ROOK,
  WHITE,
  oppositeColor,
} from "../core/constants";
import { evaluateBoardFromSideToMove } from "../core/evaluate";
import { parseFen } from "../core/fen";
import {
  makeMove,
  makeNullMove,
  undoMove,
  undoNullMove,
} from "../core/makeMove";
import { moveToUci } from "../core/move";
import { generateLegalMoves } from "../core/movegen";
import { popcountParts } from "../core/bitboard";
import {
  addHistoryScore,
  addKillerMove,
  isQuietSearchMove,
  orderMoves,
} from "./moveOrdering";
import { quiescence } from "./quiescence";
import {
  getSearchTimeLimitMs,
  shouldStopSearch,
  yieldToWorkerQueue,
} from "./timeManager";
import { sharedTranspositionTable } from "./transpositionTable";
import {
  INF,
  MATE_SCORE,
  MATE_THRESHOLD,
  MAX_PLY,
  PvsParams,
  RootLine,
  SearchContext,
  SearchNode,
  SearchOptions,
  SearchStats,
  TranspositionFlag,
} from "./types";

const ASPIRATION_WINDOW = 45;
const MAX_EFFECTIVE_DEPTH = 8;

export async function analyzeWithNewCustomEngine({
  fen,
  depth,
  multiPv,
  onUpdate,
  shouldStop,
}: SearchOptions): Promise<PositionEval> {
  const board = parseFen(fen);
  const effectiveDepth = getNewCustomEffectiveDepth(depth);
  const startedAt = performance.now();
  const context = createSearchContext(startedAt, effectiveDepth, shouldStop);
  const rootLegalMoves = generateLegalMoves(board);

  sharedTranspositionTable.nextGeneration();

  if (rootLegalMoves.length === 0) {
    return buildTerminalPosition(board, effectiveDepth, startedAt, context.stats);
  }

  let bestEval = buildPositionEval(
    rootLegalMoves.map((move) => ({ move, score: 0, pv: [move] })),
    0,
    board.sideToMove,
    startedAt,
    context.stats,
    rootLegalMoves.length,
    multiPv,
  );
  let previousScore = 0;

  for (let currentDepth = 1; currentDepth <= effectiveDepth; currentDepth += 1) {
    if (shouldStopSearch(context)) break;

    const searchWindow =
      currentDepth >= 4 && multiPv <= 1
        ? {
            alpha: previousScore - ASPIRATION_WINDOW,
            beta: previousScore + ASPIRATION_WINDOW,
          }
        : { alpha: -INF, beta: INF };

    let rootLines = searchRoot(
      board,
      currentDepth,
      multiPv,
      searchWindow.alpha,
      searchWindow.beta,
      context,
    );

    if (
      rootLines[0] &&
      (rootLines[0].score <= searchWindow.alpha ||
        rootLines[0].score >= searchWindow.beta)
    ) {
      rootLines = searchRoot(board, currentDepth, multiPv, -INF, INF, context);
    }

    if (rootLines.length > 0) {
      previousScore = rootLines[0].score;
      bestEval = buildPositionEval(
        rootLines,
        currentDepth,
        board.sideToMove,
        startedAt,
        context.stats,
        rootLegalMoves.length,
        multiPv,
      );
      onUpdate?.(bestEval);
    }

    await yieldToWorkerQueue();
  }

  return bestEval;
}

export function clearNewCustomEngineSearchCache() {
  sharedTranspositionTable.clear();
}

export function getNewCustomEffectiveDepth(requestedDepth: number): number {
  if (requestedDepth <= 5) return Math.max(1, Math.floor(requestedDepth));
  if (requestedDepth <= 10) return 5;
  if (requestedDepth <= 18) return 6;
  if (requestedDepth <= 24) return 7;

  return MAX_EFFECTIVE_DEPTH;
}

function searchRoot(
  board: ChessBoard,
  depth: number,
  multiPv: number,
  alpha: number,
  beta: number,
  context: SearchContext,
): RootLine[] {
  const ttMove = sharedTranspositionTable.getBestMove(board);
  const legalMoves = orderMoves(
    board,
    generateLegalMoves(board),
    context,
    0,
    ttMove,
  );
  const rootLines: RootLine[] = [];
  let bestScore = -INF;
  let bestMove: number | undefined;
  let searchAlpha = multiPv > 1 ? -INF : alpha;
  const searchBeta = multiPv > 1 ? INF : beta;

  for (const move of legalMoves) {
    if (shouldStopSearch(context)) break;
    if (!makeMove(board, move)) continue;

    const forcedMate = isKingInCheck(board, board.sideToMove)
      ? findForcedMate(board, 6, oppositeColor(board.sideToMove), context)
      : undefined;
    const child = forcedMate
      ? {
          score: -(MATE_SCORE - forcedMate.length - 1),
          pv: forcedMate,
        }
      : pvs(
          {
            board,
            depth: depth - 1,
            alpha: -searchBeta,
            beta: -searchAlpha,
            ply: 1,
            allowNullMove: true,
          },
          context,
        );
    const score = -child.score;
    undoMove(board);

    rootLines.push({ move, score, pv: [move, ...child.pv] });

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    if (multiPv <= 1 && score > searchAlpha) searchAlpha = score;
  }

  if (bestMove !== undefined) {
    sharedTranspositionTable.store(
      board,
      depth,
      bestScore,
      "exact",
      bestMove,
    );
  }

  return rootLines.sort((a, b) => b.score - a.score).slice(0, multiPv);
}

function pvs(params: PvsParams, context: SearchContext): SearchNode {
  const { board, depth, alpha, beta, ply, allowNullMove } = params;
  context.stats.nodes += 1;
  context.stats.selectiveDepth = Math.max(context.stats.selectiveDepth, ply);

  if (ply >= MAX_PLY) {
    return { score: evaluateBoardFromSideToMove(board), pv: [] };
  }

  if (context.stats.nodes % 2048 === 0 && shouldStopSearch(context)) {
    return { score: evaluateBoardFromSideToMove(board), pv: [] };
  }

  if (depth <= 0) return quiescence(board, alpha, beta, ply, context);
  if (board.halfmoveClock >= 100) return { score: 0, pv: [] };

  const alphaOriginal = alpha;
  let searchAlpha = alpha;
  const inCheck = isKingInCheck(board, board.sideToMove);
  const ttProbe = sharedTranspositionTable.probe(
    board,
    depth,
    searchAlpha,
    beta,
    context.stats,
  );

  if (ttProbe.score !== undefined) {
    return {
      score: ttProbe.score,
      pv: ttProbe.bestMove !== undefined ? [ttProbe.bestMove] : [],
    };
  }

  const staticEval = evaluateBoardFromSideToMove(board);

  if (
    !inCheck &&
    depth <= 2 &&
    Math.abs(beta) < MATE_THRESHOLD &&
    staticEval - depth * 120 >= beta
  ) {
    return { score: staticEval, pv: [] };
  }

  if (
    allowNullMove &&
    depth >= 3 &&
    !inCheck &&
    Math.abs(beta) < MATE_THRESHOLD &&
    hasNonPawnMaterial(board, board.sideToMove)
  ) {
    const undo = makeNullMove(board);
    const reduction = depth >= 6 ? 3 : 2;
    const nullResult = pvs(
      {
        board,
        depth: depth - 1 - reduction,
        alpha: -beta,
        beta: -beta + 1,
        ply: ply + 1,
        allowNullMove: false,
      },
      context,
    );
    const score = -nullResult.score;
    undoNullMove(board, undo);

    if (score >= beta) {
      context.stats.nullMoveCutoffs += 1;
      sharedTranspositionTable.store(board, depth, score, "lower");
      return { score, pv: [] };
    }
  }

  const legalMoves = orderMoves(
    board,
    generateLegalMoves(board),
    context,
    ply,
    ttProbe.bestMove,
  );

  if (legalMoves.length === 0) {
    return {
      score: inCheck ? -MATE_SCORE + ply : 0,
      pv: [],
    };
  }

  let bestScore = -INF;
  let bestMove: number | undefined;
  let bestPv: number[] = [];
  let searchedMoves = 0;

  for (let moveIndex = 0; moveIndex < legalMoves.length; moveIndex += 1) {
    const move = legalMoves[moveIndex];
    const isQuiet = isQuietSearchMove(move);

    if (
      !inCheck &&
      isQuiet &&
      depth <= 2 &&
      moveIndex > 0 &&
      staticEval + depth * 90 <= searchAlpha
    ) {
      continue;
    }

    if (!makeMove(board, move)) continue;

    const reduction = getLateMoveReduction(depth, moveIndex, isQuiet, inCheck);
    const childDepth = depth - 1;
    let child: SearchNode;

    if (searchedMoves === 0) {
      child = pvs(
        {
          board,
          depth: childDepth,
          alpha: -beta,
          beta: -searchAlpha,
          ply: ply + 1,
          allowNullMove: true,
        },
        context,
      );
    } else {
      child = pvs(
        {
          board,
          depth: Math.max(0, childDepth - reduction),
          alpha: -searchAlpha - 1,
          beta: -searchAlpha,
          ply: ply + 1,
          allowNullMove: true,
        },
        context,
      );

      if (reduction > 0 && -child.score > searchAlpha) {
        context.stats.lmrReductions += 1;
        child = pvs(
          {
            board,
            depth: childDepth,
            alpha: -searchAlpha - 1,
            beta: -searchAlpha,
            ply: ply + 1,
            allowNullMove: true,
          },
          context,
        );
      }

      if (-child.score > searchAlpha && -child.score < beta) {
        child = pvs(
          {
            board,
            depth: childDepth,
            alpha: -beta,
            beta: -searchAlpha,
            ply: ply + 1,
            allowNullMove: true,
          },
          context,
        );
      }
    }

    const score = -child.score;
    undoMove(board);
    searchedMoves += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      bestPv = [move, ...child.pv];
    }

    if (score > searchAlpha) {
      searchAlpha = score;

      if (searchAlpha >= beta) {
        context.stats.cutoffs += 1;
        context.stats.betaCutoffs += 1;
        if (isQuiet) {
          addKillerMove(context, ply, move);
          addHistoryScore(board, context, move, depth);
        }
        break;
      }
    }
  }

  if (searchedMoves === 0) {
    return { score: staticEval, pv: [] };
  }

  sharedTranspositionTable.store(
    board,
    depth,
    bestScore,
    getTranspositionFlag(bestScore, alphaOriginal, beta),
    bestMove,
  );

  return { score: bestScore, pv: bestPv };
}

function findForcedMate(
  board: ChessBoard,
  depth: number,
  matingColor: Color,
  context: SearchContext,
): number[] | undefined {
  if (depth < 0 || shouldStopSearch(context)) return undefined;

  const legalMoves = generateLegalMoves(board);
  const sideToMoveIsMating = board.sideToMove === matingColor;

  if (legalMoves.length === 0) {
    return isKingInCheck(board, board.sideToMove) && !sideToMoveIsMating
      ? []
      : undefined;
  }

  if (depth === 0) return undefined;

  const orderedMoves = legalMoves.sort(
    (first, second) =>
      getMateMovePriority(board, second) - getMateMovePriority(board, first),
  );

  if (sideToMoveIsMating) {
    for (const move of orderedMoves) {
      if (!makeMove(board, move)) continue;

      const childPv = findForcedMate(board, depth - 1, matingColor, context);
      undoMove(board);

      if (childPv) return [move, ...childPv];
    }

    return undefined;
  }

  let longestDefensePv: number[] | undefined = [];
  let defenseMove: number | undefined;

  for (const move of orderedMoves) {
    if (!makeMove(board, move)) continue;

    const childPv = findForcedMate(board, depth - 1, matingColor, context);
    undoMove(board);

    if (!childPv) return undefined;

    if (!longestDefensePv || childPv.length > longestDefensePv.length) {
      longestDefensePv = childPv;
      defenseMove = move;
    }
  }

  return defenseMove === undefined ? undefined : [defenseMove, ...longestDefensePv];
}

function getMateMovePriority(board: ChessBoard, move: number): number {
  if (!makeMove(board, move)) return -INF;

  const givesCheck = isKingInCheck(board, board.sideToMove);
  const isMate = givesCheck && generateLegalMoves(board).length === 0;
  undoMove(board);

  if (isMate) return 2;
  if (givesCheck) return 1;

  return 0;
}

function getLateMoveReduction(
  depth: number,
  moveIndex: number,
  isQuiet: boolean,
  inCheck: boolean,
): number {
  if (!isQuiet || inCheck || depth < 3 || moveIndex < 4) return 0;
  if (depth >= 6 && moveIndex >= 10) return 2;

  return 1;
}

function getTranspositionFlag(
  score: number,
  alphaOriginal: number,
  beta: number,
): TranspositionFlag {
  if (score <= alphaOriginal) return "upper";
  if (score >= beta) return "lower";

  return "exact";
}

function buildTerminalPosition(
  board: ChessBoard,
  depth: number,
  startedAt: number,
  stats: SearchStats,
): PositionEval {
  const inCheck = isKingInCheck(board, board.sideToMove);
  const mate = inCheck ? (board.sideToMove === WHITE ? -1 : 1) : undefined;

  return {
    lines: [
      {
        pv: [],
        cp: mate === undefined ? 0 : undefined,
        mate,
        depth,
        multiPv: 1,
      },
    ],
    benchmark: buildBenchmark(depth, startedAt, stats, 0),
  };
}

function buildPositionEval(
  rootLines: RootLine[],
  depth: number,
  rootColor: Color,
  startedAt: number,
  stats: SearchStats,
  legalMoves: number,
  multiPv: number,
): PositionEval {
  const selectedLines = rootLines.slice(0, multiPv);

  return {
    bestMove: selectedLines[0] ? moveToUci(selectedLines[0].move) : undefined,
    lines: selectedLines.map((line, index) => {
      const whiteScore = rootColor === WHITE ? line.score : -line.score;
      const mate = getMateScore(whiteScore);

      return {
        pv: line.pv.map(moveToUci),
        cp: mate === undefined ? clampCentipawns(whiteScore) : undefined,
        mate,
        depth,
        multiPv: index + 1,
      };
    }),
    benchmark: buildBenchmark(depth, startedAt, stats, legalMoves),
  };
}

function buildBenchmark(
  depth: number,
  startedAt: number,
  stats: SearchStats,
  legalMoves: number,
) {
  const elapsedMs = performance.now() - startedAt;

  return {
    depth,
    elapsedMs,
    nodes: stats.nodes,
    nodesPerSecond:
      elapsedMs > 0 ? Math.round(stats.nodes / (elapsedMs / 1000)) : 0,
    legalMoves,
    quiescenceNodes: stats.quiescenceNodes,
    transpositionHits: stats.transpositionHits,
    cutoffs: stats.cutoffs,
  };
}

function getMateScore(score: number): number | undefined {
  if (score >= MATE_THRESHOLD) {
    return Math.max(1, Math.ceil((MATE_SCORE - score) / 2));
  }

  if (score <= -MATE_THRESHOLD) {
    return -Math.max(1, Math.ceil((MATE_SCORE + score) / 2));
  }

  return undefined;
}

function clampCentipawns(score: number): number {
  return Math.max(-5000, Math.min(5000, Math.round(score)));
}

function createSearchContext(
  startedAt: number,
  depth: number,
  shouldStop?: () => boolean,
): SearchContext {
  return {
    stats: createSearchStats(),
    transpositionTable: sharedTranspositionTable,
    killerMoves: Array.from({ length: MAX_PLY + 1 }, () => []),
    history: new Int32Array(8192),
    startedAt,
    maxTimeMs: getSearchTimeLimitMs(depth),
    shouldStop,
    stopped: false,
  };
}

function createSearchStats(): SearchStats {
  return {
    nodes: 0,
    quiescenceNodes: 0,
    transpositionHits: 0,
    transpositionCutoffs: 0,
    cutoffs: 0,
    betaCutoffs: 0,
    nullMoveCutoffs: 0,
    lmrReductions: 0,
    selectiveDepth: 0,
  };
}

function hasNonPawnMaterial(board: ChessBoard, color: Color): boolean {
  return [KNIGHT, BISHOP, ROOK, QUEEN].some(
    (piece) =>
      popcountParts(board.pieces[color].lo[piece], board.pieces[color].hi[piece]) >
      0,
  );
}
