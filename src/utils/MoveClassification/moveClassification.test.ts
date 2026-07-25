import { describe, expect, it } from "vitest";

import getMovesClassification from "./moveClassification";
import { MoveClassification } from "../../types/enums";
import { PositionEval } from "../../types/eval";

const position = (bestMove: string, cp = 0): PositionEval => ({
  bestMove,
  lines: [
    { cp, pv: [bestMove], depth: 10, multiPv: 1 },
    { cp: cp - 20, pv: ["a2a3"], depth: 10, multiPv: 2 },
  ],
});

describe("getMovesClassification", () => {
  it("nie klasyfikuje pierwszej pozycji, ponieważ nie reprezentuje ruchu", () => {
    const results = getMovesClassification(
      [position("e2e4"), position("e7e5")],
      ["e2e4"],
      [
        "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
        "4k3/8/8/8/8/4P3/8/4K3 b - - 0 1",
      ],
    );

    expect(results[0].moveClassification).toBeUndefined();
  });

  it("oznacza ruch jako Best, gdy odpowiada rekomendacji silnika", () => {
    const results = getMovesClassification(
      [position("e2e4"), position("e7e5")],
      ["e2e4"],
      [
        "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
        "4k3/8/8/8/8/4P3/8/4K3 b - - 0 1",
      ],
    );

    expect(results[1].moveClassification).toBe(MoveClassification.Best);
  });

  it("rozpoznaje pozycję należącą do znanego debiutu", () => {
    const results = getMovesClassification(
      [position("g1h3"), position("e7e5")],
      ["g1h3"],
      [
        "4k3/8/8/8/8/7N/PPPPPPPP/RNBQKB1R w KQkq - 0 1",
        "rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R",
      ],
    );

    expect(results[1].moveClassification).toBe(MoveClassification.Book);
    expect(results[1].opening).toBe("Amar Opening");
  });
});
