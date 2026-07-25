import { describe, expect, it } from "vitest";

import {
  getCapturedPieces,
  getEvaluateGameParams,
  getLineEvalLabel,
  getStartingFen,
  isCheck,
  moveLineUciToSan,
} from "./chessUtils";
import { Color } from "../types/enums";
import { Chess } from "chess.js";

describe("chessUtils - przypadki brzegowe", () => {
  it("zwraca pozycje FEN i ruchy UCI z historii partii", () => {
    const game = new Chess();
    game.move("e4");
    game.move("e5");

    const params = getEvaluateGameParams(game);
    expect(params.uciMoves).toEqual(["e2e4", "e7e5"]);
    expect(params.fens).toHaveLength(3);
    expect(params.fens[0]).toBe(game.header() && params.fens[0]);
    expect(getStartingFen({ game })).toBe(params.fens[0]);
  });

  it("rozpoznaje szacha oraz jego brak", () => {
    expect(isCheck("4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1")).toBe(true);
    expect(isCheck("4k3/8/8/8/8/8/8/4K3 w - - 0 1")).toBe(false);
  });

  it("oblicza liczbę zbitych figur dla obu kolorów", () => {
    const fen = "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1";
    expect(getCapturedPieces(fen, Color.White)).toMatchObject({ q: 1, p: 8, r: 2 });
    expect(getCapturedPieces(fen, Color.Black)).toMatchObject({ Q: 0 });
  });

  it("formatuje centypiony, mata i brak oceny", () => {
    expect(getLineEvalLabel({ cp: 35 })).toBe("+0.35");
    expect(getLineEvalLabel({ cp: -35 })).toBe("-0.35");
    expect(getLineEvalLabel({ mate: 4 })).toBe("+M4");
    expect(getLineEvalLabel({ mate: -4 })).toBe("-M4");
    expect(getLineEvalLabel({})).toBe("?");
  });

  it("zwraca UCI dla nielegalnego ruchu promocyjnego", () => {
    const convert = moveLineUciToSan("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
    expect(convert("a7a8q")).toBe("a8=Q+");
    expect(convert("a7a8x")).toBe("a7a8x");
  });
});
