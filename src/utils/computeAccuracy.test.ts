import { describe, expect, it } from "vitest";

import { computeAccuracy } from "./computeAccuracy";
import { PositionEval } from "../types/eval";

const evaluation = (cp: number): PositionEval => ({
  lines: [{ cp, pv: ["e2e4"], depth: 10, multiPv: 1 }],
});

describe("computeAccuracy", () => {
  it("zwraca 100%, gdy ocena pozycji nie zmienia się", () => {
    const result = computeAccuracy([evaluation(0), evaluation(0), evaluation(0)]);

    expect(result.white).toBeCloseTo(100, 8);
    expect(result.black).toBeCloseTo(100, 8);
  });

  it("obniża dokładność po dużej zmianie oceny", () => {
    const stable = computeAccuracy([evaluation(0), evaluation(0), evaluation(0)]);
    const changed = computeAccuracy([evaluation(0), evaluation(-1000), evaluation(-1000)]);

    expect(changed.white).toBeLessThan(stable.white);
    expect(changed.black).toBe(stable.black);
  });

  it("uwzględnia osobno ruchy białych i czarnych", () => {
    const result = computeAccuracy([
      evaluation(0),
      evaluation(0),
      evaluation(500),
      evaluation(500),
    ]);

    expect(result.white).not.toBe(result.black);
    expect(result.white).toBeGreaterThan(0);
    expect(result.black).toBeGreaterThan(0);
  });
});
