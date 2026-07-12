import type { ChessBoard } from "../core/board";

export const MATE_SCORE = 100000;
export const MATE_THRESHOLD = MATE_SCORE - 1000;
export const MAX_PLY = 96;
export const INF = 1000000;

export type TranspositionFlag = "exact" | "lower" | "upper";

export interface SearchOptions {
  fen: string;
  depth: number;
  multiPv: number;
  onUpdate?: (positionEval: import("../../../types/eval").PositionEval) => void;
  shouldStop?: () => boolean;
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
}

export interface PvsParams {
  board: ChessBoard;
  depth: number;
  alpha: number;
  beta: number;
  ply: number;
  allowNullMove: boolean;
}
