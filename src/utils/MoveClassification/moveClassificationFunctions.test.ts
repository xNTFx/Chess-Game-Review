import { describe, expect, it } from "vitest";

import { isMoveSignificant, isSimplePieceRecapture } from "./moveClassificationFunctions";

describe("moveClassificationFunctions", () => {
  it("rozpoznaje proste odbicie na tym samym polu", () => {
    const fen = "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1";
    expect(isSimplePieceRecapture(fen, ["e2e4", "d5e4"])).toBe(true);
    expect(isSimplePieceRecapture(fen, ["e2e4", "d5d4"])).toBe(false);
  });

  it("rozpoznaje ruch istotnie lepszy od pozostałych wariantów", () => {
    const lines = [
      { cp: 80, pv: ["e2e4"], depth: 10, multiPv: 1 },
      { cp: -80, pv: ["d2d4"], depth: 10, multiPv: 2 },
    ];
    expect(isMoveSignificant(lines, "e2e4", true, 100)).toBe(true);
    expect(isMoveSignificant(lines, "d2d4", true, 100)).toBe(false);
    expect(isMoveSignificant([], "e2e4", true, 100)).toBe(false);
  });
});
