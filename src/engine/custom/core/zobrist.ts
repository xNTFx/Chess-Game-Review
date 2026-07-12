import { ChessBoard } from "./board";
import {
  BLACK,
  BOARD_SQUARE_COUNT,
  FILE_OF,
  NO_PIECE,
  NO_SQUARE,
  PIECE_COUNT,
} from "./constants";

let randomState = 0x9e3779b9;

export const ZOBRIST_PIECE_LO: Uint32Array[] = [];
export const ZOBRIST_PIECE_HI: Uint32Array[] = [];
export const ZOBRIST_CASTLING_LO = new Uint32Array(16);
export const ZOBRIST_CASTLING_HI = new Uint32Array(16);
export const ZOBRIST_EN_PASSANT_LO = new Uint32Array(8);
export const ZOBRIST_EN_PASSANT_HI = new Uint32Array(8);
export const ZOBRIST_SIDE_LO = nextRandom32();
export const ZOBRIST_SIDE_HI = nextRandom32();

for (let piece = 0; piece < PIECE_COUNT * 2; piece += 1) {
  const lo = new Uint32Array(BOARD_SQUARE_COUNT);
  const hi = new Uint32Array(BOARD_SQUARE_COUNT);

  for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
    lo[square] = nextRandom32();
    hi[square] = nextRandom32();
  }

  ZOBRIST_PIECE_LO[piece] = lo;
  ZOBRIST_PIECE_HI[piece] = hi;
}

for (let rights = 0; rights < ZOBRIST_CASTLING_LO.length; rights += 1) {
  ZOBRIST_CASTLING_LO[rights] = nextRandom32();
  ZOBRIST_CASTLING_HI[rights] = nextRandom32();
}

for (let file = 0; file < ZOBRIST_EN_PASSANT_LO.length; file += 1) {
  ZOBRIST_EN_PASSANT_LO[file] = nextRandom32();
  ZOBRIST_EN_PASSANT_HI[file] = nextRandom32();
}

export function computeZobristHash(board: ChessBoard): {
  lo: number;
  hi: number;
} {
  let lo = 0;
  let hi = 0;

  for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
    const piece = board.pieceBySquare[square];

    if (piece !== NO_PIECE) {
      lo = (lo ^ ZOBRIST_PIECE_LO[piece][square]) >>> 0;
      hi = (hi ^ ZOBRIST_PIECE_HI[piece][square]) >>> 0;
    }
  }

  lo = (lo ^ ZOBRIST_CASTLING_LO[board.castlingRights]) >>> 0;
  hi = (hi ^ ZOBRIST_CASTLING_HI[board.castlingRights]) >>> 0;

  if (board.enPassantSquare !== NO_SQUARE) {
    const file = FILE_OF[board.enPassantSquare];

    lo = (lo ^ ZOBRIST_EN_PASSANT_LO[file]) >>> 0;
    hi = (hi ^ ZOBRIST_EN_PASSANT_HI[file]) >>> 0;
  }

  if (board.sideToMove === BLACK) {
    lo = (lo ^ ZOBRIST_SIDE_LO) >>> 0;
    hi = (hi ^ ZOBRIST_SIDE_HI) >>> 0;
  }

  return { lo, hi };
}

export function getHashKey(board: ChessBoard): string {
  return `${board.zobristHi.toString(16)}${board.zobristLo
    .toString(16)
    .padStart(8, "0")}`;
}

function nextRandom32(): number {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;

  return randomState >>> 0;
}
