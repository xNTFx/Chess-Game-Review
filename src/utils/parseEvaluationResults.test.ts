import { describe, expect, it } from "vitest";

import { parseEvaluationResults } from "./parseEvaluationResults";

describe("parseEvaluationResults", () => {
  it("parsuje najlepszy ruch, warianty i metryki benchmarku", () => {
    const result = parseEvaluationResults(
      [
        "info depth 8 multipv 2 score cp 30 nodes 200 time 100 nps 2000 pv e2e4 e7e5",
        "info depth 10 multipv 1 score cp 80 nodes 500 time 250 nps 2000 pv d2d4 d7d5",
        "info depth 10 multipv 2 score cp 40 nodes 500 time 250 nps 2000 pv e2e4 e7e5",
        "bestmove d2d4",
      ],
      true,
    );

    expect(result.bestMove).toBe("d2d4");
    expect(result.lines.map((line) => line.multiPv)).toEqual([1, 2]);
    expect(result.lines[0].cp).toBe(80);
    expect(result.benchmark).toMatchObject({
      depth: 10,
      nodes: 500,
      elapsedMs: 250,
      nodesPerSecond: 2000,
      legalMoves: 2,
    });
  });

  it("odwraca ocenę centypionów i mata, gdy ruch należy do czarnych", () => {
    const result = parseEvaluationResults(
      [
        "info depth 5 multipv 1 score cp 120 nodes 100 time 0 pv e7e5",
        "info depth 5 multipv 2 score mate -3 nodes 100 time 0 pv d7d5",
      ],
      false,
    );

    expect(result.lines[0].cp).toBe(-120);
    expect(result.lines[1].mate).toBe(3);
  });

  it("pomija niepełne komunikaty silnika", () => {
    expect(parseEvaluationResults(["info depth 4 multipv 1 score cp 20"], true)).toEqual({
      lines: [],
    });
  });
});
