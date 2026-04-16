import { Chess, Move, PieceSymbol, Square } from "chess.js";

import { PositionEval } from "../../types/eval";
import { MATE_SCORE, evaluatePosition } from "./evaluation";

interface AnalyzeOptions {
  fen: string;
  depth: number;
  multiPv: number;
  onUpdate?: (positionEval: PositionEval) => void;
  shouldStop?: () => boolean;
}

interface SearchStats {
  nodes: number;
  quiescenceNodes: number;
  transpositionHits: number;
  cutoffs: number;
}

interface SearchNode {
  score: number;
  pv: string[];
  mate?: number;
}

interface RootLine extends SearchNode {
  legalMove: string;
}

interface SearchContext {
  transpositionTable: Map<string, TranspositionEntry>;
  evaluationCache: Map<string, number>;
  killerMoves: Map<number, string[]>;
}

interface TranspositionEntry extends SearchNode {
  depth: number;
  flag: "exact" | "lower" | "upper";
  bestMove?: string;
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const MAX_TRANSPOSITION_ENTRIES = 120000;
const TRANSPOSITION_TRIM_COUNT = 20000;
const MAX_EVALUATION_CACHE_ENTRIES = 180000;
const EVALUATION_CACHE_TRIM_COUNT = 30000;
const MAX_QUIESCENCE_DEPTH = 3;
const sharedTranspositionTable = new Map<string, TranspositionEntry>();
const sharedEvaluationCache = new Map<string, number>();

export async function analyzeWithCustomEngine({
  fen,
  depth,
  multiPv,
  onUpdate,
  shouldStop,
}: AnalyzeOptions): Promise<PositionEval> {
  const effectiveDepth = getCustomEffectiveDepth(depth);
  const startedAt = performance.now();
  const stats = createSearchStats();
  const context = createSearchContext();
  let bestEval = searchRoot(
    fen,
    1,
    multiPv,
    startedAt,
    stats,
    context,
    shouldStop,
  );

  onUpdate?.(bestEval);

  for (
    let currentDepth = 2;
    currentDepth <= effectiveDepth;
    currentDepth += 1
  ) {
    if (shouldStop?.()) break;

    await yieldToWorkerQueue();
    bestEval = searchRoot(
      fen,
      currentDepth,
      multiPv,
      startedAt,
      stats,
      context,
      shouldStop,
    );
    onUpdate?.(bestEval);
  }

  return bestEval;
}

export function getCustomEffectiveDepth(requestedDepth: number): number {
  if (requestedDepth <= 5) return Math.max(1, Math.floor(requestedDepth));
  if (requestedDepth <= 12) return 3;
  if (requestedDepth <= 18) return 4;
  if (requestedDepth <= 24) return 5;
  return 6;
}

export function clearCustomEngineSearchCache() {
  sharedTranspositionTable.clear();
  sharedEvaluationCache.clear();
}

function searchRoot(
  fen: string,
  depth: number,
  multiPv: number,
  startedAt: number,
  stats: SearchStats,
  context: SearchContext,
  shouldStop?: () => boolean,
): PositionEval {
  const game = new Chess(fen);
  const rootCacheKey = getFenCacheKey(fen);
  const legalMoves = orderMoves(
    game,
    context,
    0,
    getCachedBestMove(rootCacheKey),
  );

  if (legalMoves.length === 0) {
    return buildTerminalPosition(game, depth, startedAt, stats);
  }

  const rootTurn = game.turn();
  const rootLines: RootLine[] = [];

  for (const move of legalMoves) {
    if (shouldStop?.()) break;

    const uciMove = moveToUci(move);
    const childCacheKey = getFenCacheKey(move.after);
    game.move(moveParams(move));
    const child = minimax(
      game,
      childCacheKey,
      depth - 1,
      -MATE_SCORE,
      MATE_SCORE,
      1,
      stats,
      context,
      shouldStop,
    );
    game.undo();

    rootLines.push({
      ...child,
      legalMove: uciMove,
      pv: [uciMove, ...child.pv],
    });
  }

  const sortedLines = rootLines.sort((a, b) =>
    rootTurn === "w" ? b.score - a.score : a.score - b.score,
  );
  const selectedLines = sortedLines.slice(0, multiPv);

  if (selectedLines[0]) {
    storeTranspositionEntry(rootCacheKey, depth, {
      ...selectedLines[0],
      depth,
      flag: "exact",
      bestMove: selectedLines[0].legalMove,
    });
  }

  return buildPositionEval(
    selectedLines,
    depth,
    startedAt,
    stats,
    legalMoves.length,
  );
}

function minimax(
  game: Chess,
  cacheKey: string,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  stats: SearchStats,
  context: SearchContext,
  shouldStop?: () => boolean,
): SearchNode {
  stats.nodes += 1;

  if (stats.nodes % 4096 === 0 && shouldStop?.()) {
    return { score: evaluatePositionCached(game, context, cacheKey), pv: [] };
  }
  if (depth <= 0) {
    return quiescence(
      game,
      cacheKey,
      alpha,
      beta,
      ply,
      MAX_QUIESCENCE_DEPTH,
      stats,
      context,
      shouldStop,
    );
  }

  const alphaOriginal = alpha;
  const betaOriginal = beta;
  const cached = context.transpositionTable.get(cacheKey);
  let searchAlpha = alpha;
  let searchBeta = beta;

  if (cached && cached.depth >= depth) {
    stats.transpositionHits += 1;

    if (cached.flag === "exact") {
      return { score: cached.score, pv: cached.pv, mate: cached.mate };
    }

    if (cached.flag === "lower") {
      searchAlpha = Math.max(searchAlpha, cached.score);
    } else {
      searchBeta = Math.min(searchBeta, cached.score);
    }

    if (searchAlpha >= searchBeta) {
      return { score: cached.score, pv: cached.pv, mate: cached.mate };
    }
  }

  const maximizing = game.turn() === "w";
  const legalMoves = orderMoves(game, context, ply, cached?.bestMove);
  if (legalMoves.length === 0) return getNoLegalMovesNode(game, ply);

  let bestScore = maximizing ? -MATE_SCORE : MATE_SCORE;
  let bestPv: string[] = [];
  let bestMove: string | undefined = undefined;
  let bestMate: number | undefined = undefined;

  for (const move of legalMoves) {
    const uciMove = moveToUci(move);
    const childCacheKey = getFenCacheKey(move.after);

    game.move(moveParams(move));
    const child = minimax(
      game,
      childCacheKey,
      depth - 1,
      searchAlpha,
      searchBeta,
      ply + 1,
      stats,
      context,
      shouldStop,
    );
    game.undo();

    const isBetter = maximizing
      ? child.score > bestScore
      : child.score < bestScore;

    if (isBetter) {
      bestScore = child.score;
      bestPv = [uciMove, ...child.pv];
      bestMove = uciMove;
      bestMate = child.mate;
    }

    if (maximizing) {
      searchAlpha = Math.max(searchAlpha, bestScore);
    } else {
      searchBeta = Math.min(searchBeta, bestScore);
    }

    if (searchAlpha >= searchBeta || shouldStop?.()) {
      stats.cutoffs += 1;
      if (!isTacticalMove(move)) addKillerMove(context, ply, uciMove);
      break;
    }
  }

  const result = { score: bestScore, pv: bestPv, mate: bestMate };
  storeTranspositionEntry(cacheKey, depth, {
    ...result,
    depth,
    flag: getTranspositionFlag(bestScore, alphaOriginal, betaOriginal),
    bestMove,
  });

  return result;
}

function quiescence(
  game: Chess,
  cacheKey: string,
  alpha: number,
  beta: number,
  ply: number,
  remainingDepth: number,
  stats: SearchStats,
  context: SearchContext,
  shouldStop?: () => boolean,
): SearchNode {
  stats.nodes += 1;
  stats.quiescenceNodes += 1;

  const isInCheck = game.inCheck();
  const standPat = evaluatePositionCached(game, context, cacheKey, isInCheck);
  if (remainingDepth <= 0 || (stats.nodes % 4096 === 0 && shouldStop?.())) {
    return { score: standPat, pv: [] };
  }

  const maximizing = game.turn() === "w";
  let searchAlpha = alpha;
  let searchBeta = beta;
  let bestScore = isInCheck
    ? maximizing
      ? -MATE_SCORE
      : MATE_SCORE
    : standPat;
  let bestPv: string[] = [];
  let bestMate: number | undefined = undefined;

  if (!isInCheck) {
    if (maximizing) {
      if (standPat >= searchBeta) return { score: standPat, pv: [] };
      searchAlpha = Math.max(searchAlpha, standPat);
    } else {
      if (standPat <= searchAlpha) return { score: standPat, pv: [] };
      searchBeta = Math.min(searchBeta, standPat);
    }
  }

  const legalMoves = game.moves({ verbose: true }) as Move[];
  if (legalMoves.length === 0) return getNoLegalMovesNode(game, ply);

  const moves = legalMoves.filter((move) =>
    shouldSearchQuiescenceMove(
      move,
      isInCheck,
      remainingDepth,
      standPat,
      searchAlpha,
      searchBeta,
      maximizing,
    ),
  );
  moves.sort(
    (a, b) =>
      getMoveOrderingScore(b, context, ply) -
      getMoveOrderingScore(a, context, ply),
  );

  for (const move of moves) {
    const uciMove = moveToUci(move);
    const childCacheKey = getFenCacheKey(move.after);

    game.move(moveParams(move));
    const child = quiescence(
      game,
      childCacheKey,
      searchAlpha,
      searchBeta,
      ply + 1,
      remainingDepth - 1,
      stats,
      context,
      shouldStop,
    );
    game.undo();

    const isBetter = maximizing
      ? child.score > bestScore
      : child.score < bestScore;

    if (isBetter) {
      bestScore = child.score;
      bestPv = [uciMove, ...child.pv];
      bestMate = child.mate;
    }

    if (maximizing) {
      searchAlpha = Math.max(searchAlpha, bestScore);
    } else {
      searchBeta = Math.min(searchBeta, bestScore);
    }

    if (searchAlpha >= searchBeta || shouldStop?.()) {
      stats.cutoffs += 1;
      break;
    }
  }

  return { score: bestScore, pv: bestPv, mate: bestMate };
}

function getNoLegalMovesNode(game: Chess, ply: number): SearchNode {
  if (!game.inCheck()) return { score: 0, pv: [] };
  const sign = game.turn() === "w" ? -1 : 1;
  const movesToMate = Math.max(1, Math.ceil(ply / 2));

  return {
    score: sign * (MATE_SCORE - ply),
    pv: [],
    mate: sign * movesToMate,
  };
}

function buildTerminalPosition(
  game: Chess,
  depth: number,
  startedAt: number,
  stats: SearchStats,
): PositionEval {
  const mate = game.inCheck() ? (game.turn() === "w" ? -1 : 1) : undefined;

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
  selectedLines: RootLine[],
  depth: number,
  startedAt: number,
  stats: SearchStats,
  legalMoves: number,
): PositionEval {
  return {
    bestMove: selectedLines[0]?.legalMove,
    lines: selectedLines.map((line, index) => ({
      pv: line.pv,
      cp: line.mate === undefined ? clampCentipawns(line.score) : undefined,
      mate: line.mate,
      depth,
      multiPv: index + 1,
    })),
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

function orderMoves(
  game: Chess,
  context: SearchContext,
  ply: number,
  hashMove?: string,
): Move[] {
  return (game.moves({ verbose: true }) as Move[]).sort(
    (a, b) =>
      getMoveOrderingScore(b, context, ply, hashMove) -
      getMoveOrderingScore(a, context, ply, hashMove),
  );
}

function getMoveOrderingScore(
  move: Move,
  context: SearchContext,
  ply: number,
  hashMove?: string,
): number {
  const uciMove = moveToUci(move);
  let score = 0;

  if (hashMove && uciMove === hashMove) score += 1000000;
  if (isKillerMove(context, ply, uciMove)) score += 6000;

  if (move.captured) {
    score += PIECE_VALUES[move.captured] * 20 - PIECE_VALUES[move.piece];
  }

  if (move.promotion) score += PIECE_VALUES[move.promotion] + 1200;
  if (move.san.includes("#")) score += 100000;
  if (move.san.includes("+")) score += 700;
  if (isCentralSquare(move.to)) score += 20;

  return score;
}

function isTacticalMove(move: Move): boolean {
  return Boolean(move.captured || move.promotion || move.san.includes("+"));
}

function shouldSearchQuiescenceMove(
  move: Move,
  isInCheck: boolean,
  remainingDepth: number,
  standPat: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): boolean {
  if (isInCheck) return true;
  if (move.promotion) return true;
  if (move.captured) {
    return canMoveImproveWindow(move, standPat, alpha, beta, maximizing);
  }

  return move.san.includes("+") && remainingDepth === MAX_QUIESCENCE_DEPTH;
}

function canMoveImproveWindow(
  move: Move,
  standPat: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
): boolean {
  const capturedValue = move.captured ? PIECE_VALUES[move.captured] : 0;
  const promotionValue = move.promotion ? PIECE_VALUES[move.promotion] : 0;
  const conservativeSwing = capturedValue + promotionValue + 250;

  if (maximizing) return standPat + conservativeSwing >= alpha;

  return standPat - conservativeSwing <= beta;
}

function addKillerMove(context: SearchContext, ply: number, move: string) {
  const currentMoves = context.killerMoves.get(ply) ?? [];
  if (currentMoves.includes(move)) return;

  context.killerMoves.set(ply, [move, ...currentMoves].slice(0, 2));
}

function isKillerMove(
  context: SearchContext,
  ply: number,
  move: string,
): boolean {
  return context.killerMoves.get(ply)?.includes(move) ?? false;
}

function getCachedBestMove(cacheKey: string): string | undefined {
  return sharedTranspositionTable.get(cacheKey)?.bestMove;
}

function storeTranspositionEntry(
  cacheKey: string,
  depth: number,
  entry: TranspositionEntry,
) {
  if (depth <= 0) return;
  if (sharedTranspositionTable.size > MAX_TRANSPOSITION_ENTRIES) {
    trimTranspositionTable();
  }

  sharedTranspositionTable.set(cacheKey, entry);
}

function trimTranspositionTable() {
  const keys = sharedTranspositionTable.keys();

  for (let index = 0; index < TRANSPOSITION_TRIM_COUNT; index += 1) {
    const key = keys.next();
    if (key.done) break;
    sharedTranspositionTable.delete(key.value);
  }
}

function getTranspositionFlag(
  score: number,
  alphaOriginal: number,
  betaOriginal: number,
): "exact" | "lower" | "upper" {
  if (score <= alphaOriginal) return "upper";
  if (score >= betaOriginal) return "lower";

  return "exact";
}

function getFenCacheKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

function evaluatePositionCached(
  game: Chess,
  context: SearchContext,
  cacheKey: string,
  isInCheck?: boolean,
): number {
  const cachedEval = context.evaluationCache.get(cacheKey);
  if (cachedEval !== undefined) return cachedEval;

  if (context.evaluationCache.size > MAX_EVALUATION_CACHE_ENTRIES) {
    trimEvaluationCache();
  }

  const score = evaluatePosition(game, isInCheck);
  context.evaluationCache.set(cacheKey, score);

  return score;
}

function trimEvaluationCache() {
  const keys = sharedEvaluationCache.keys();

  for (let index = 0; index < EVALUATION_CACHE_TRIM_COUNT; index += 1) {
    const key = keys.next();
    if (key.done) break;
    sharedEvaluationCache.delete(key.value);
  }
}

function createSearchContext(): SearchContext {
  return {
    transpositionTable: sharedTranspositionTable,
    evaluationCache: sharedEvaluationCache,
    killerMoves: new Map<number, string[]>(),
  };
}

function createSearchStats(): SearchStats {
  return {
    nodes: 0,
    quiescenceNodes: 0,
    transpositionHits: 0,
    cutoffs: 0,
  };
}

function isCentralSquare(square: Square): boolean {
  return (
    square === "d4" || square === "d5" || square === "e4" || square === "e5"
  );
}

function moveToUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

function moveParams(move: Move): {
  from: Square;
  to: Square;
  promotion?: string;
} {
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  };
}

function clampCentipawns(score: number): number {
  return Math.max(-5000, Math.min(5000, Math.round(score)));
}

function yieldToWorkerQueue(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}
