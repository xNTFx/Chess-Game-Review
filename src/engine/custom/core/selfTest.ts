import { boardToFen, parseFen, START_POSITION_FEN } from "./fen";
import { computeZobristHash } from "./zobrist";
import { makeMove, undoMove } from "./makeMove";
import { generateLegalMoves } from "./movegen";
import { moveToUci } from "./move";
import { KNOWN_PERFT_CASES, perft } from "./perft";

export interface CoreTestResult {
  name: string;
  passed: boolean;
  details?: string;
}

/**
 * Lekki, uruchamialny również w workerze zestaw regresyjny bez zależności od
 * frameworka testowego. Właściwy projekt może wywołać go z test runnera lub
 * benchmarku CI.
 */
export function runCoreSelfTest(): CoreTestResult[] {
  const results: CoreTestResult[] = [];
  const start = parseFen(START_POSITION_FEN);
  results.push({
    name: "start position has 20 legal moves",
    passed: generateLegalMoves(start).length === 20,
  });

  for (const testCase of KNOWN_PERFT_CASES) {
    const [depthText, expectedText] = Object.entries(testCase.expectations)[0];
    const actual = perft(parseFen(testCase.fen), Number(depthText));
    results.push({
      name: `perft depth ${depthText}`,
      passed: actual === expectedText,
      details: `${actual}/${expectedText}`,
    });
  }

  const reversible = parseFen(START_POSITION_FEN);
  const originalFen = boardToFen(reversible);
  const originalHash = computeZobristHash(reversible);
  const move = generateLegalMoves(reversible).find(
    (candidate) => moveToUci(candidate) === "e2e4",
  );
  const made = move !== undefined && makeMove(reversible, move);
  const undone = made && undoMove(reversible);
  const restoredHash = computeZobristHash(reversible);
  results.push({
    name: "make/undo restores FEN and Zobrist hash",
    passed:
      Boolean(undone) &&
      boardToFen(reversible) === originalFen &&
      restoredHash.lo === originalHash.lo &&
      restoredHash.hi === originalHash.hi,
  });

  return results;
}
