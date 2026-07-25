import { describe, expect, it } from "vitest";

import { KNOWN_PERFT_CASES, perft } from "./perft";
import { parseFen, START_POSITION_FEN } from "./fen";

describe("custom chess engine - perft", () => {
  it("generuje 20 ruchów z pozycji startowej", () => {
    expect(perft(parseFen(START_POSITION_FEN), 1)).toBe(20);
  });

  it("przechodzi podstawowe przypadki regresyjne perft", () => {
    for (const testCase of KNOWN_PERFT_CASES.slice(0, 3)) {
      const expected = testCase.expectations[2];
      expect(perft(parseFen(testCase.fen), 2)).toBe(expected);
    }
  });
});
