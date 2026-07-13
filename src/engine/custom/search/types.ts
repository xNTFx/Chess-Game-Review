import type { ChessBoard } from "../core/board";

export const MATE_SCORE = 100000;
export const MATE_THRESHOLD = MATE_SCORE - 1000;
export const MAX_PLY = 96;
export const INF = 1000000;

export type TranspositionFlag = "exact" | "lower" | "upper";

/**
 * Konfiguracja eksperymentalna wyszukiwania.
 *
 * Każda flaga może zostać wyłączona niezależnie. Dzięki temu benchmark nie
 * mierzy „magii” silnika, tylko pozwala przypisać zysk wydajności do
 * konkretnego algorytmu (np. sortowania ruchów albo TT).
 */
export interface SearchConfig {
  useAlphaBeta: boolean;
  useMoveOrdering: boolean;
  useTranspositionTable: boolean;
  useQuiescence: boolean;
  useNullMove: boolean;
  useLateMoveReductions: boolean;
  useCheckExtensions: boolean;
  evaluation: "material" | "positional";
  maxTimeMs?: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  useAlphaBeta: true,
  useMoveOrdering: true,
  useTranspositionTable: true,
  useQuiescence: true,
  useNullMove: true,
  useLateMoveReductions: true,
  useCheckExtensions: true,
  evaluation: "positional",
};

export interface SearchOptions {
  fen: string;
  depth: number;
  multiPv: number;
  onUpdate?: (positionEval: import("../../../types/eval").PositionEval) => void;
  shouldStop?: () => boolean;
  config?: Partial<SearchConfig>;
}

export interface SearchStats {
  nodes: number;
  quiescenceNodes: number;
  transpositionHits: number;
  transpositionCutoffs: number;
  cutoffs: number;
  betaCutoffs: number;
  nullMoveCutoffs: number;
  lmrReductions: number;
  selectiveDepth: number;
}

export interface SearchNode {
  score: number;
  pv: number[];
}

export interface RootLine extends SearchNode {
  move: number;
}

export interface TranspositionEntry {
  key: string;
  depth: number;
  score: number;
  flag: TranspositionFlag;
  bestMove?: number;
  generation: number;
}

export interface SearchContext {
  stats: SearchStats;
  transpositionTable: import("./transpositionTable").TranspositionTable;
  killerMoves: number[][];
  history: Int32Array;
  startedAt: number;
  maxTimeMs: number;
  shouldStop?: () => boolean;
  stopped: boolean;
  config: SearchConfig;
}

export interface PvsParams {
  board: ChessBoard;
  depth: number;
  alpha: number;
  beta: number;
  ply: number;
  allowNullMove: boolean;
}
