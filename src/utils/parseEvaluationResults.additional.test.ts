import { describe, expect, it } from "vitest";

import { parseEvaluationResults } from "./parseEvaluationResults";

describe("parseEvaluationResults - przypadki brzegowe", () => {
  it("zachowuje wariant o największej głębokości", () => {
    const result = parseEvaluationResults([
      "info depth 12 multipv 1 score cp 50 nodes 100 time 10 pv e2e4",
      "info depth 8 multipv 1 score cp 999 nodes 90 time 9 pv d2d4",
    ], true);

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({ cp: 50, depth: 12, pv: ["e2e4"] });
  });

  it("sortuje warianty według oceny i poprawnie obsługuje mata", () => {
    const result = parseEvaluationResults([
      "info depth 5 multipv 1 score mate 3 nodes 10 time 5 pv e2e4",
      "info depth 5 multipv 2 score cp 900 nodes 10 time 5 pv d2d4",
      "info depth 5 multipv 3 score mate 1 nodes 10 time 5 pv g1f3",
    ], true);

    expect(result.lines.map((line) => line.multiPv)).toEqual([3, 1, 2]);
  });

  it("wylicza nps, gdy silnik nie podał tej wartości", () => {
    const result = parseEvaluationResults([
      "info depth 4 multipv 1 score cp 10 nodes 1500 time 500 pv e2e4",
    ], true);

    expect(result.benchmark?.nodesPerSecond).toBe(3000);
  });
});
