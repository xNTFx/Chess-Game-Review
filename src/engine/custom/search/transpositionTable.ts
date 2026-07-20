import { ChessBoard } from "../core/board";
import { SearchStats, TranspositionEntry, TranspositionFlag } from "./types";

// Wynik mata jest kodowany względnie do aktualnego węzła. Bez normalizacji
// wpis w TT odczytany na innym ply mógłby wyglądać jak szybszy lub późniejszy
// mat niż w rzeczywistości.
const MATE_SCORE = 100000;
const MATE_THRESHOLD = MATE_SCORE - 1000;

const MAX_ENTRIES = 240000;
const TRIM_COUNT = 40000;

export class TranspositionTable {
  // Dwa dokładne klucze Uint32 są tańsze niż tworzenie stringa dla każdego
  // probe/store, a jednocześnie zachowują pełne 64 bity hasha.
  private readonly entries = new Map<number, Map<number, TranspositionEntry>>();
  private entryCount = 0;
  private generation = 0;

  nextGeneration() {
    this.generation += 1;
  }

  clear() {
    this.entries.clear();
    this.entryCount = 0;
    this.generation = 0;
  }

  getBestMove(board: ChessBoard): number | undefined {
    return this.getEntry(board)?.bestMove;
  }

  probe(
    board: ChessBoard,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    stats: SearchStats,
  ): { score?: number; bestMove?: number } {
    const entry = this.getEntry(board);
    if (!entry) return {};

    stats.transpositionHits += 1;

    if (entry.depth < depth) {
      return { bestMove: entry.bestMove };
    }

    if (entry.flag === "exact") {
      stats.transpositionCutoffs += 1;
      return {
        score: scoreFromTable(entry.score, ply),
        bestMove: entry.bestMove,
      };
    }

    const score = scoreFromTable(entry.score, ply);

    if (entry.flag === "lower" && score >= beta) {
      stats.transpositionCutoffs += 1;
      return { score, bestMove: entry.bestMove };
    }

    if (entry.flag === "upper" && score <= alpha) {
      stats.transpositionCutoffs += 1;
      return { score, bestMove: entry.bestMove };
    }

    return { bestMove: entry.bestMove };
  }

  store(
    board: ChessBoard,
    depth: number,
    score: number,
    flag: TranspositionFlag,
    bestMove?: number,
    ply = 0,
  ) {
    if (depth <= 0) return;

    const existing = this.getEntry(board);

    if (
      existing &&
      existing.generation === this.generation &&
      existing.depth > depth
    ) {
      return;
    }

    if (this.entryCount >= MAX_ENTRIES) this.trim();

    let bucket = this.entries.get(board.zobristHi);
    if (!bucket) {
      bucket = new Map<number, TranspositionEntry>();
      this.entries.set(board.zobristHi, bucket);
    }

    if (!bucket.has(board.zobristLo)) this.entryCount += 1;
    bucket.set(board.zobristLo, {
      keyLo: board.zobristLo,
      keyHi: board.zobristHi,
      depth,
      score: scoreToTable(score, ply),
      flag,
      bestMove,
      generation: this.generation,
    });
  }

  private trim() {
    let removed = 0;

    for (const [hi, bucket] of this.entries) {
      for (const lo of bucket.keys()) {
        bucket.delete(lo);
        this.entryCount -= 1;
        removed += 1;
        if (removed >= TRIM_COUNT) break;
      }

      if (bucket.size === 0) this.entries.delete(hi);
      if (removed >= TRIM_COUNT) break;
    }
  }

  private getEntry(board: ChessBoard): TranspositionEntry | undefined {
    return this.entries.get(board.zobristHi)?.get(board.zobristLo);
  }
}

function scoreToTable(score: number, ply: number): number {
  if (score >= MATE_THRESHOLD) return score + ply;
  if (score <= -MATE_THRESHOLD) return score - ply;
  return score;
}

function scoreFromTable(score: number, ply: number): number {
  if (score >= MATE_THRESHOLD) return score - ply;
  if (score <= -MATE_THRESHOLD) return score + ply;
  return score;
}

export const sharedTranspositionTable = new TranspositionTable();
