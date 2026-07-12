import { ChessBoard } from "../core/board";
import { getHashKey } from "../core/zobrist";
import { SearchStats, TranspositionEntry, TranspositionFlag } from "./types";

const MAX_ENTRIES = 240000;
const TRIM_COUNT = 40000;

export class TranspositionTable {
  private readonly entries = new Map<string, TranspositionEntry>();
  private generation = 0;

  nextGeneration() {
    this.generation += 1;
  }

  clear() {
    this.entries.clear();
    this.generation = 0;
  }

  getBestMove(board: ChessBoard): number | undefined {
    return this.entries.get(getHashKey(board))?.bestMove;
  }

  probe(
    board: ChessBoard,
    depth: number,
    alpha: number,
    beta: number,
    stats: SearchStats,
  ): { score?: number; bestMove?: number } {
    const entry = this.entries.get(getHashKey(board));
    if (!entry) return {};

    stats.transpositionHits += 1;

    if (entry.depth < depth) {
      return { bestMove: entry.bestMove };
    }

    if (entry.flag === "exact") {
      stats.transpositionCutoffs += 1;
      return { score: entry.score, bestMove: entry.bestMove };
    }

    if (entry.flag === "lower" && entry.score >= beta) {
      stats.transpositionCutoffs += 1;
      return { score: entry.score, bestMove: entry.bestMove };
    }

    if (entry.flag === "upper" && entry.score <= alpha) {
      stats.transpositionCutoffs += 1;
      return { score: entry.score, bestMove: entry.bestMove };
    }

    return { bestMove: entry.bestMove };
  }

  store(
    board: ChessBoard,
    depth: number,
    score: number,
    flag: TranspositionFlag,
    bestMove?: number,
  ) {
    if (depth <= 0) return;

    const key = getHashKey(board);
    const existing = this.entries.get(key);

    if (
      existing &&
      existing.generation === this.generation &&
      existing.depth > depth
    ) {
      return;
    }

    if (this.entries.size > MAX_ENTRIES) this.trim();

    this.entries.set(key, {
      key,
      depth,
      score,
      flag,
      bestMove,
      generation: this.generation,
    });
  }

  private trim() {
    const keys = this.entries.keys();

    for (let index = 0; index < TRIM_COUNT; index += 1) {
      const key = keys.next();
      if (key.done) break;

      this.entries.delete(key.value);
    }
  }
}

export const sharedTranspositionTable = new TranspositionTable();
