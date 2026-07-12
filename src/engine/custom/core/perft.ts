import { ChessBoard } from "./board";
import { START_POSITION_FEN, parseFen } from "./fen";
import { makeMove, undoMove } from "./makeMove";
import { generateLegalMoves } from "./movegen";
import { moveToUci } from "./move";

export interface PerftDivideEntry {
  move: string;
  nodes: number;
}

export interface PerftSuiteResult {
  fen: string;
  depth: number;
  expected: number;
  actual: number;
  passed: boolean;
}

export const KNOWN_PERFT_CASES: Array<{
  fen: string;
  expectations: Record<number, number>;
}> = [
  {
    fen: START_POSITION_FEN,
    expectations: {
      1: 20,
      2: 400,
      3: 8902,
      4: 197281,
    },
  },
  {
    fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    expectations: {
      1: 48,
      2: 2039,
      3: 97862,
    },
  },
  {
    fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    expectations: {
      1: 14,
      2: 191,
      3: 2812,
    },
  },
  {
    fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    expectations: {
      1: 6,
      2: 264,
      3: 9467,
    },
  },
];

export function perft(board: ChessBoard, depth: number): number {
  if (depth <= 0) return 1;

  const moves = generateLegalMoves(board);
  if (depth === 1) return moves.length;

  let nodes = 0;

  for (const move of moves) {
    if (!makeMove(board, move)) continue;
    nodes += perft(board, depth - 1);
    undoMove(board);
  }

  return nodes;
}

export function perftDivide(board: ChessBoard, depth: number): PerftDivideEntry[] {
  const moves = generateLegalMoves(board);
  const entries: PerftDivideEntry[] = [];

  for (const move of moves) {
    if (!makeMove(board, move)) continue;

    entries.push({
      move: moveToUci(move),
      nodes: depth <= 1 ? 1 : perft(board, depth - 1),
    });
    undoMove(board);
  }

  return entries.sort((a, b) => a.move.localeCompare(b.move));
}

export function runPerftSuite(
  cases = KNOWN_PERFT_CASES,
): PerftSuiteResult[] {
  const results: PerftSuiteResult[] = [];

  for (const testCase of cases) {
    for (const [depth, expected] of Object.entries(testCase.expectations)) {
      const board = parseFen(testCase.fen);
      const actual = perft(board, Number(depth));

      results.push({
        fen: testCase.fen,
        depth: Number(depth),
        expected,
        actual,
        passed: actual === expected,
      });
    }
  }

  return results;
}
