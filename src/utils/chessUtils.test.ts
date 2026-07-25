import { describe, expect, it } from "vitest";

import {
  getEvaluationBarValue,
  getGameFromPgn,
  getMaterialDifference,
  getWhoIsCheckmated,
  moveLineUciToSan,
  stripPgnComments,
} from "./chessUtils";

describe("chessUtils", () => {
  it("usuwa komentarze z PGN i odtwarza partię", () => {
    const pgn = "1. e4 {ruch debiutowy} e5 2. Nf3 Nc6";
    expect(stripPgnComments(pgn)).toBe("1. e4 e5 2. Nf3 Nc6");
    expect(getGameFromPgn(pgn).history()).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });

  it("konwertuje ruch UCI na SAN, a niepoprawny pozostawia bez zmian", () => {
    const convert = moveLineUciToSan("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
    expect(convert("e7e5")).toBe("e5");
    expect(convert("a1a1")).toBe("a1a1");
  });

  it("oblicza przewagę materiałową i rozpoznaje mata", () => {
    expect(getMaterialDifference("4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1")).toBe(9);
    expect(getWhoIsCheckmated("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1")).toBe("b");
  });

  it("buduje etykietę oceny punktowej i mata", () => {
    const cp = getEvaluationBarValue({ lines: [{ cp: 125, pv: [], depth: 1, multiPv: 1 }] });
    const mate = getEvaluationBarValue({ lines: [{ mate: -2, pv: [], depth: 1, multiPv: 1 }] });
    expect(cp.label).toBe("1.3");
    expect(mate.label).toBe("M2");
  });
});
