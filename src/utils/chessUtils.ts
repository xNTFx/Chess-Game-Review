import { Chess, PieceSymbol, Square } from "chess.js";

import { Color, MoveClassification } from "../types/enums";
import { EvaluateGameParams, LineEval, PositionEval } from "../types/eval";
import { getPositionWinPercentage } from "./winProbability";

export const getEvaluateGameParams = (game: Chess): EvaluateGameParams => {
  const history = game.history({
    verbose: true,
  });

  const fens = history.map((move) => move.before);
  fens.push(history[history.length - 1].after);

  const uciMoves = history.map(
    (move) => move.from + move.to + (move.promotion || ""),
  );

  return { fens, uciMoves };
};

export const getGameFromPgn = (pgn: string): Chess => {
  const game = new Chess();
  game.loadPgn(pgn);

  return game;
};

//if uci to san is valid will return san, otherwise returns uci
export const moveLineUciToSan = (
  fen: string,
): ((moveUci: string) => string) => {
  const game = new Chess(fen);

  return (moveUci: string): string => {
    try {
      const move = game.move(uciMoveParams(moveUci));
      return move.san;
    } catch {
      return moveUci;
    }
  };
};

export const getEvaluationBarValue = (
  position: PositionEval,
): {
  whiteBarPercentage: number;
  label: string;
} => {
  const whiteBarPercentage = getPositionWinPercentage(position);
  const bestLine = position.lines[0];

  if (bestLine.mate) {
    return {
      label: `M${Math.abs(bestLine.mate)}`,
      whiteBarPercentage,
    };
  }

  const cp = bestLine.cp;
  if (!cp)
    return {
      whiteBarPercentage,
      label: "0.0",
    };

  const pEval = Math.abs(cp) / 100;
  let label = pEval.toFixed(1);

  if (label.toString().length > 3) {
    label = pEval.toFixed(0);
  }

  return { whiteBarPercentage, label };
};

export const getWhoIsCheckmated = (fen: string): "w" | "b" | null => {
  const game = new Chess(fen);
  if (!game.isCheckmate()) return null;
  return game.turn();
};

export const uciMoveParams = (
  uciMove: string,
): {
  from: Square;
  to: Square;
  promotion?: string | undefined;
} => ({
  from: uciMove.slice(0, 2) as Square,
  to: uciMove.slice(2, 4) as Square,
  promotion: uciMove.slice(4, 5) || undefined,
});

export const getMaterialDifference = (fen: string): number => {
  const game = new Chess(fen);
  const board = game.board().flat();

  return board.reduce((acc, square) => {
    if (!square) return acc;
    const piece = square.type;

    if (square.color === "w") {
      return acc + getPieceValue(piece);
    }

    return acc - getPieceValue(piece);
  }, 0);
};

export const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case "p":
      return 1;
    case "n":
      return 3;
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    default:
      return 1;
  }
};

export const getStartingFen = (
  params: { pgn: string } | { game: Chess },
): string => {
  const game = "game" in params ? params.game : getGameFromPgn(params.pgn);

  const history = game.history({
    verbose: true,
  });
  if (!history.length) return game.fen();

  return history[0].before;
};

export const isCheck = (fen: string): boolean => {
  const game = new Chess(fen);
  return game.inCheck();
};

export const getCapturedPieces = (
  fen: string,
  color: Color | string,
): Record<string, number | undefined> => {
  const capturedPieces: Record<string, number | undefined> = {};
  if (color === Color.White) {
    capturedPieces.p = 8;
    capturedPieces.r = 2;
    capturedPieces.n = 2;
    capturedPieces.b = 2;
    capturedPieces.q = 1;
  } else {
    capturedPieces.P = 8;
    capturedPieces.R = 2;
    capturedPieces.N = 2;
    capturedPieces.B = 2;
    capturedPieces.Q = 1;
  }

  const fenPiecePlacement = fen.split(" ")[0];
  for (const piece of Object.keys(capturedPieces)) {
    const count = fenPiecePlacement.match(new RegExp(piece, "g"))?.length;
    if (count) capturedPieces[piece] = (capturedPieces[piece] ?? 0) - count;
  }

  return capturedPieces;
};

export const getLineEvalLabel = (
  line: Pick<LineEval, "cp" | "mate">,
): string => {
  if (line.cp !== undefined) {
    return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)}`;
  }

  if (line.mate) {
    return `${line.mate > 0 ? "+" : "-"}M${Math.abs(line.mate)}`;
  }

  return "?";
};

export const moveClassificationColors: Record<MoveClassification, string> = {
  [MoveClassification.Book]: "#d5a47d",
  [MoveClassification.Brilliant]: "#26c2a3",
  [MoveClassification.Great]: "#4099ed",
  [MoveClassification.Best]: "#3aab18",
  [MoveClassification.Excellent]: "#3aab18",
  [MoveClassification.Good]: "#81b64c",
  [MoveClassification.Inaccuracy]: "#f7c631",
  [MoveClassification.Mistake]: "#ffa459",
  [MoveClassification.Missed_win]: "#DBAC16",
  [MoveClassification.Blunder]: "#fa412d",
};

export const sortedMoveClassifications = [
  MoveClassification.Brilliant,
  MoveClassification.Great,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Good,
  MoveClassification.Book,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
  MoveClassification.Missed_win,
];

export const moveClassificationIcons: Record<MoveClassification, string> = {
  [MoveClassification.Brilliant]: "/icons/brilliant.png",
  [MoveClassification.Great]: "/icons/great.png",
  [MoveClassification.Best]: "/icons/best.png",
  [MoveClassification.Excellent]: "/icons/excellent.png",
  [MoveClassification.Good]: "/icons/good.png",
  [MoveClassification.Book]: "/icons/book.png",
  [MoveClassification.Inaccuracy]: "/icons/inaccuracy.png",
  [MoveClassification.Mistake]: "/icons/mistake.png",
  [MoveClassification.Missed_win]: "/icons/missed_win.png",
  [MoveClassification.Blunder]: "/icons/blunder.png",
};
