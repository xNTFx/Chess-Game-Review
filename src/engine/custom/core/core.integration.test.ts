import { describe, expect, it } from "vitest";

import { boardToFen, parseFen, START_POSITION_FEN } from "./fen";
import { makeMove, undoMove } from "./makeMove";
import { generateLegalMoves } from "./movegen";
import { moveToUci } from "./move";
import { computeZobristHash } from "./zobrist";

describe("custom chess engine - integracja modułów", () => {
  it("łączy FEN, generowanie ruchu, wykonanie i cofnięcie ruchu", () => {
    const board = parseFen(START_POSITION_FEN);
    const originalFen = boardToFen(board);
    const move = generateLegalMoves(board).find((candidate) => moveToUci(candidate) === "e2e4");

    expect(move).toBeDefined();
    expect(makeMove(board, move!)).toBe(true);
    expect(boardToFen(board)).not.toBe(originalFen);
    expect(undoMove(board)).toBe(true);
    expect(boardToFen(board)).toBe(originalFen);
  });

  it("przywraca także identyfikator Zobrista po cofnięciu ruchu", () => {
    const board = parseFen(START_POSITION_FEN);
    const before = computeZobristHash(board);
    const move = generateLegalMoves(board)[0];

    makeMove(board, move);
    undoMove(board);

    const after = computeZobristHash(board);
    expect(after).toEqual(before);
  });
});
