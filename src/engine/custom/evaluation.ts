import { Chess, PieceSymbol, Square } from "chess.js";

export const MATE_SCORE = 100000;

type BoardSquare = ReturnType<Chess["board"]>[number][number];
type LocatedPiece = NonNullable<BoardSquare>;
type Board = ReturnType<Chess["board"]>;

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PIECE_SQUARE_TABLES: Record<PieceSymbol, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30,
    20, 10, 10, 5, 5, 10, 28, 28, 10, 5, 5, 0, 0, 0, 25, 25, 0, 0, 0, 5, -5,
    -10, 0, 0, -10, -5, 5, 5, 10, 10, -25, -25, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0,
    0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30,
    5, 15, 20, 20, 15, 5, -30, -30, 0, 20, 30, 30, 20, 0, -30, -30, 5, 20, 30,
    30, 20, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -40, -20, 0, 0, 0, 0, -20,
    -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10,
    10, 10, 10, 10, 10, -10, -10, 0, 10, 15, 15, 10, 0, -10, -10, 5, 10, 15, 15,
    10, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20,
    -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0,
    -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5,
    5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5,
    5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10,
    -10, -20,
  ],
  k: [
    20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20,
    -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20, -30, -40,
    -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30,
    -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
  ],
};

export function evaluatePosition(
  game: Chess,
  isInCheck = game.inCheck(),
): number {
  const board = game.board();
  const pieces = getLocatedPieces(board);
  if (hasInsufficientMatingMaterial(pieces)) return 0;

  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;

  pieces.forEach((piece) => {
    const pieceScore =
      PIECE_VALUES[piece.type] +
      getPieceSquareValue(piece.type, piece.square, piece.color);
    score += piece.color === "w" ? pieceScore : -pieceScore;

    if (piece.type === "b" && piece.color === "w") whiteBishops += 1;
    if (piece.type === "b" && piece.color === "b") blackBishops += 1;
  });

  if (whiteBishops >= 2) score += 35;
  if (blackBishops >= 2) score -= 35;

  score += evaluatePawnStructure(pieces);
  score += evaluateMobility(board);
  score += evaluateKingSafety(game, pieces, isInCheck);

  return Math.round(score);
}

function getLocatedPieces(board: Board): LocatedPiece[] {
  const pieces: LocatedPiece[] = [];

  for (const rank of board) {
    for (const piece of rank) {
      if (piece) pieces.push(piece);
    }
  }

  return pieces;
}

function hasInsufficientMatingMaterial(pieces: LocatedPiece[]): boolean {
  const nonKingPieces = pieces.filter((piece) => piece.type !== "k");
  if (nonKingPieces.length === 0) return true;

  return (
    nonKingPieces.length === 1 &&
    (nonKingPieces[0].type === "b" || nonKingPieces[0].type === "n")
  );
}

function getPieceSquareValue(
  piece: PieceSymbol,
  square: Square,
  color: "w" | "b",
): number {
  const fileIndex = square.charCodeAt(0) - "a".charCodeAt(0);
  const rankIndex = Number(square[1]) - 1;
  const tableIndex =
    color === "w" ? rankIndex * 8 + fileIndex : (7 - rankIndex) * 8 + fileIndex;

  return PIECE_SQUARE_TABLES[piece][tableIndex] ?? 0;
}

function evaluatePawnStructure(pieces: LocatedPiece[]): number {
  const pawns = pieces.filter((piece) => piece.type === "p");
  let score = 0;

  (["w", "b"] as const).forEach((color) => {
    const friendlyPawns = pawns.filter((pawn) => pawn.color === color);
    const sign = color === "w" ? 1 : -1;
    const files = new Map<number, LocatedPiece[]>();

    friendlyPawns.forEach((pawn) => {
      const file = getFileIndex(pawn.square);
      files.set(file, [...(files.get(file) ?? []), pawn]);
    });

    files.forEach((filePawns) => {
      if (filePawns.length > 1) score -= sign * (filePawns.length - 1) * 14;
    });

    friendlyPawns.forEach((pawn) => {
      const file = getFileIndex(pawn.square);
      const hasNeighborPawn =
        friendlyPawns.some(
          (other) => getFileIndex(other.square) === file - 1,
        ) ||
        friendlyPawns.some((other) => getFileIndex(other.square) === file + 1);

      if (!hasNeighborPawn) score -= sign * 10;
      if (isPassedPawn(pawn, pawns)) {
        const rank = Number(pawn.square[1]);
        const advancement = color === "w" ? rank - 2 : 7 - rank;
        score += sign * (24 + advancement * 8);
      }
    });
  });

  return score;
}

function isPassedPawn(pawn: LocatedPiece, pawns: LocatedPiece[]): boolean {
  const file = getFileIndex(pawn.square);
  const rank = Number(pawn.square[1]);
  const direction = pawn.color === "w" ? 1 : -1;

  return !pawns.some((other) => {
    if (other.color === pawn.color) return false;
    const otherFile = getFileIndex(other.square);
    const otherRank = Number(other.square[1]);

    return (
      Math.abs(otherFile - file) <= 1 && (otherRank - rank) * direction > 0
    );
  });
}

function evaluateMobility(board: Board): number {
  let whiteMobility = 0;
  let blackMobility = 0;

  for (const rank of board) {
    for (const piece of rank) {
      if (!piece) continue;

      const mobility = getPseudoMobility(board, piece);
      if (piece.color === "w") {
        whiteMobility += mobility;
      } else {
        blackMobility += mobility;
      }
    }
  }

  return (whiteMobility - blackMobility) * 2;
}

function getPseudoMobility(board: Board, piece: LocatedPiece): number {
  const file = getFileIndex(piece.square);
  const rank = Number(piece.square[1]) - 1;

  switch (piece.type) {
    case "p":
      return getPawnMobility(board, file, rank, piece.color);
    case "n":
      return countStepMobility(board, file, rank, piece.color, KNIGHT_OFFSETS);
    case "b":
      return countSlidingMobility(board, file, rank, piece.color, BISHOP_RAYS);
    case "r":
      return countSlidingMobility(board, file, rank, piece.color, ROOK_RAYS);
    case "q":
      return countSlidingMobility(board, file, rank, piece.color, QUEEN_RAYS);
    case "k":
      return countStepMobility(board, file, rank, piece.color, KING_OFFSETS);
  }
}

function evaluateKingSafety(
  game: Chess,
  pieces: LocatedPiece[],
  isInCheck: boolean,
): number {
  let score = 0;
  const whiteKing = pieces.find(
    (piece) => piece.type === "k" && piece.color === "w",
  );
  const blackKing = pieces.find(
    (piece) => piece.type === "k" && piece.color === "b",
  );

  if (whiteKing) score += countPawnShield(whiteKing.square, pieces, "w") * 10;
  if (blackKing) score -= countPawnShield(blackKing.square, pieces, "b") * 10;
  if (isInCheck) score += game.turn() === "w" ? -35 : 35;

  return score;
}

function countPawnShield(
  kingSquare: Square,
  pieces: LocatedPiece[],
  color: "w" | "b",
): number {
  const kingFile = getFileIndex(kingSquare);
  const kingRank = Number(kingSquare[1]);
  const shieldRank = kingRank + (color === "w" ? 1 : -1);

  return pieces.filter((piece) => {
    if (piece.type !== "p" || piece.color !== color) return false;
    const file = getFileIndex(piece.square);
    const rank = Number(piece.square[1]);

    return Math.abs(file - kingFile) <= 1 && rank === shieldRank;
  }).length;
}

function getFileIndex(square: Square): number {
  return square.charCodeAt(0) - "a".charCodeAt(0);
}

function getPawnMobility(
  board: Board,
  file: number,
  rank: number,
  color: "w" | "b",
): number {
  const direction = color === "w" ? 1 : -1;
  let mobility = isEmpty(board, file, rank + direction) ? 1 : 0;

  if (hasEnemyPiece(board, file - 1, rank + direction, color)) mobility += 1;
  if (hasEnemyPiece(board, file + 1, rank + direction, color)) mobility += 1;

  return mobility;
}

function countStepMobility(
  board: Board,
  file: number,
  rank: number,
  color: "w" | "b",
  offsets: Array<[number, number]>,
): number {
  return offsets.reduce((sum, [fileOffset, rankOffset]) => {
    const target = getPieceAt(board, file + fileOffset, rank + rankOffset);

    return !target || target.color !== color ? sum + 1 : sum;
  }, 0);
}

function countSlidingMobility(
  board: Board,
  file: number,
  rank: number,
  color: "w" | "b",
  rays: Array<[number, number]>,
): number {
  let mobility = 0;

  for (const [fileStep, rankStep] of rays) {
    let targetFile = file + fileStep;
    let targetRank = rank + rankStep;

    while (isOnBoard(targetFile, targetRank)) {
      const target = getPieceAt(board, targetFile, targetRank);
      if (!target) {
        mobility += 1;
      } else {
        if (target.color !== color) mobility += 1;
        break;
      }

      targetFile += fileStep;
      targetRank += rankStep;
    }
  }

  return mobility;
}

function hasEnemyPiece(
  board: Board,
  file: number,
  rank: number,
  color: "w" | "b",
): boolean {
  const piece = getPieceAt(board, file, rank);

  return !!piece && piece.color !== color;
}

function isEmpty(board: Board, file: number, rank: number): boolean {
  return isOnBoard(file, rank) && !getPieceAt(board, file, rank);
}

function getPieceAt(
  board: Board,
  file: number,
  rank: number,
): LocatedPiece | null {
  if (!isOnBoard(file, rank)) return null;

  return board[7 - rank][file];
}

function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

const KNIGHT_OFFSETS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

const KING_OFFSETS: Array<[number, number]> = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

const BISHOP_RAYS: Array<[number, number]> = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];

const ROOK_RAYS: Array<[number, number]> = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];

const QUEEN_RAYS: Array<[number, number]> = [...BISHOP_RAYS, ...ROOK_RAYS];
