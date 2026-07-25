import { describe, expect, it } from "vitest";

import { getLineWinPercentage, getPositionWinPercentage } from "./winProbability";

describe("winProbability", () => {
  it("traktuje ocenę 0 jako pozycję równą", () => {
    expect(getLineWinPercentage({ cp: 0, pv: [], depth: 1, multiPv: 1 })).toBe(50);
  });

  it("zachowuje symetrię dla ocen białych i czarnych", () => {
    const white = getLineWinPercentage({ cp: 300, pv: [], depth: 1, multiPv: 1 });
    const black = getLineWinPercentage({ cp: -300, pv: [], depth: 1, multiPv: 1 });
    expect(white + black).toBeCloseTo(100, 8);
  });

  it("obsługuje mata i waliduje brak wariantów", () => {
    expect(getLineWinPercentage({ mate: 1, pv: [], depth: 1, multiPv: 1 })).toBeGreaterThan(95);
    expect(() => getPositionWinPercentage({ lines: [] })).toThrow("No lines available");
  });
});
