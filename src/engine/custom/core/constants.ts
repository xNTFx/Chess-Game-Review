export const WHITE = 0;
export const BLACK = 1;

export type Color = typeof WHITE | typeof BLACK;

export const PAWN = 0;
export const KNIGHT = 1;
export const BISHOP = 2;
export const ROOK = 3;
export const QUEEN = 4;
export const KING = 5;

export type Piece =
  | typeof PAWN
  | typeof KNIGHT
  | typeof BISHOP
  | typeof ROOK
  | typeof QUEEN
  | typeof KING;

export const NO_PIECE = -1;
export const NO_SQUARE = -1;

export const PIECE_COUNT = 6;
export const COLOR_COUNT = 2;
export const BOARD_SQUARE_COUNT = 64;

export const CASTLE_WHITE_KING = 1;
export const CASTLE_WHITE_QUEEN = 2;
export const CASTLE_BLACK_KING = 4;
export const CASTLE_BLACK_QUEEN = 8;

export const A1 = 0;
export const B1 = 1;
export const C1 = 2;
export const D1 = 3;
export const E1 = 4;
export const F1 = 5;
export const G1 = 6;
export const H1 = 7;
export const A8 = 56;
export const B8 = 57;
export const C8 = 58;
export const D8 = 59;
export const E8 = 60;
export const F8 = 61;
export const G8 = 62;
export const H8 = 63;

export const FILE_OF = new Int8Array(BOARD_SQUARE_COUNT);
export const RANK_OF = new Int8Array(BOARD_SQUARE_COUNT);
export const SQUARE_NAMES: string[] = [];

const FILE_NAMES = "abcdefgh";
const PIECE_CHARS = ["p", "n", "b", "r", "q", "k"] as const;

for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
  const file = square & 7;
  const rank = square >> 3;

  FILE_OF[square] = file;
  RANK_OF[square] = rank;
  SQUARE_NAMES[square] = `${FILE_NAMES[file]}${rank + 1}`;
}

export function oppositeColor(color: Color): Color {
  return color === WHITE ? BLACK : WHITE;
}

export function encodePiece(color: Color, piece: Piece): number {
  return color * PIECE_COUNT + piece;
}

export function getEncodedPieceColor(encodedPiece: number): Color {
  return encodedPiece >= PIECE_COUNT ? BLACK : WHITE;
}

export function getEncodedPieceType(encodedPiece: number): Piece {
  return (encodedPiece % PIECE_COUNT) as Piece;
}

export function getPieceChar(piece: Piece): string {
  return PIECE_CHARS[piece];
}

export function squareName(square: number): string {
  return SQUARE_NAMES[square] ?? "";
}

export function squareFromName(name: string): number {
  if (!/^[a-h][1-8]$/.test(name)) return NO_SQUARE;

  const file = name.charCodeAt(0) - 97;
  const rank = Number(name[1]) - 1;

  return rank * 8 + file;
}

export function isValidSquare(square: number): boolean {
  return square >= 0 && square < BOARD_SQUARE_COUNT;
}

export function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}
