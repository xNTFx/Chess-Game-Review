import {
  Bitboard,
  clearBit,
  createEmptyBitboard,
  setBit,
} from "./bitboard";
import {
  BLACK,
  COLOR_COUNT,
  Color,
  KING,
  NO_PIECE,
  NO_SQUARE,
  PIECE_COUNT,
  Piece,
  WHITE,
  encodePiece,
  getEncodedPieceColor,
  getEncodedPieceType,
} from "./constants";
import { EvalState, createEmptyEvalState } from "./evaluate";

export interface PieceBitboards {
  lo: Uint32Array;
  hi: Uint32Array;
}

export interface UndoState {
  move: number;
  capturedPiece: number;
  capturedSquare: number;
  castlingRights: number;
  enPassantSquare: number;
  halfmoveClock: number;
  fullmoveNumber: number;
  zobristLo: number;
  zobristHi: number;
  evalMaterial: number;
  evalPst: number;
  evalScore: number;
  whiteKingSquare: number;
  blackKingSquare: number;
}

export interface ChessBoard {
  pieces: [PieceBitboards, PieceBitboards];
  occupancy: [Bitboard, Bitboard];
  occupancyAll: Bitboard;
  pieceBySquare: Int8Array;
  sideToMove: Color;
  castlingRights: number;
  enPassantSquare: number;
  halfmoveClock: number;
  fullmoveNumber: number;
  kingSquare: [number, number];
  zobristLo: number;
  zobristHi: number;
  evalState: EvalState;
  undoStack: UndoState[];
}

export function createEmptyBoard(): ChessBoard {
  return {
    pieces: [createPieceBitboards(), createPieceBitboards()],
    occupancy: [createEmptyBitboard(), createEmptyBitboard()],
    occupancyAll: createEmptyBitboard(),
    pieceBySquare: new Int8Array(64).fill(NO_PIECE),
    sideToMove: WHITE,
    castlingRights: 0,
    enPassantSquare: NO_SQUARE,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    kingSquare: [NO_SQUARE, NO_SQUARE],
    zobristLo: 0,
    zobristHi: 0,
    evalState: createEmptyEvalState(),
    undoStack: [],
  };
}

export function setPiece(
  board: ChessBoard,
  square: number,
  color: Color,
  piece: Piece,
) {
  const encodedPiece = encodePiece(color, piece);

  board.pieceBySquare[square] = encodedPiece;
  setPieceBit(board.pieces[color], piece, square);
  setBit(board.occupancy[color], square);
  setBit(board.occupancyAll, square);

  if (piece === KING) {
    board.kingSquare[color] = square;
  }
}

export function clearPiece(board: ChessBoard, square: number): number {
  const encodedPiece = board.pieceBySquare[square];

  if (encodedPiece === NO_PIECE) return NO_PIECE;

  const color = getEncodedPieceColor(encodedPiece);
  const piece = getEncodedPieceType(encodedPiece);

  board.pieceBySquare[square] = NO_PIECE;
  clearPieceBit(board.pieces[color], piece, square);
  clearBit(board.occupancy[color], square);
  clearBit(board.occupancyAll, square);

  if (piece === KING) {
    board.kingSquare[color] = NO_SQUARE;
  }

  return encodedPiece;
}

export function getPiece(board: ChessBoard, square: number): number {
  return board.pieceBySquare[square] ?? NO_PIECE;
}

export function isEmptySquare(board: ChessBoard, square: number): boolean {
  return getPiece(board, square) === NO_PIECE;
}

export function hasColorPiece(
  board: ChessBoard,
  square: number,
  color: Color,
): boolean {
  const piece = getPiece(board, square);

  return piece !== NO_PIECE && getEncodedPieceColor(piece) === color;
}

function createPieceBitboards(): PieceBitboards {
  return {
    lo: new Uint32Array(PIECE_COUNT),
    hi: new Uint32Array(PIECE_COUNT),
  };
}

function setPieceBit(bitboards: PieceBitboards, piece: Piece, square: number) {
  if (square < 32) {
    bitboards.lo[piece] = (bitboards.lo[piece] | (1 << square)) >>> 0;
  } else {
    bitboards.hi[piece] =
      (bitboards.hi[piece] | (1 << (square - 32))) >>> 0;
  }
}

function clearPieceBit(
  bitboards: PieceBitboards,
  piece: Piece,
  square: number,
) {
  if (square < 32) {
    bitboards.lo[piece] = (bitboards.lo[piece] & ~(1 << square)) >>> 0;
  } else {
    bitboards.hi[piece] =
      (bitboards.hi[piece] & ~(1 << (square - 32))) >>> 0;
  }
}

export function getColorPieceCount(board: ChessBoard, color: Color): number {
  let count = 0;

  for (let piece = 0; piece < PIECE_COUNT; piece += 1) {
    count += countPieces(board.pieces[color], piece as Piece);
  }

  return count;
}

function countPieces(bitboards: PieceBitboards, piece: Piece): number {
  let count = 0;
  let lo = bitboards.lo[piece];
  let hi = bitboards.hi[piece];

  while (lo !== 0) {
    lo = (lo & (lo - 1)) >>> 0;
    count += 1;
  }

  while (hi !== 0) {
    hi = (hi & (hi - 1)) >>> 0;
    count += 1;
  }

  return count;
}

export function resetBoard(board: ChessBoard) {
  for (let color = 0; color < COLOR_COUNT; color += 1) {
    board.pieces[color as Color].lo.fill(0);
    board.pieces[color as Color].hi.fill(0);
    board.occupancy[color as Color].lo = 0;
    board.occupancy[color as Color].hi = 0;
  }

  board.occupancyAll.lo = 0;
  board.occupancyAll.hi = 0;
  board.pieceBySquare.fill(NO_PIECE);
  board.sideToMove = WHITE;
  board.castlingRights = 0;
  board.enPassantSquare = NO_SQUARE;
  board.halfmoveClock = 0;
  board.fullmoveNumber = 1;
  board.kingSquare = [NO_SQUARE, NO_SQUARE];
  board.zobristLo = 0;
  board.zobristHi = 0;
  board.evalState = createEmptyEvalState();
  board.undoStack = [];
}

export function isWhitePiece(encodedPiece: number): boolean {
  return encodedPiece >= 0 && encodedPiece < PIECE_COUNT;
}

export function isBlackPiece(encodedPiece: number): boolean {
  return encodedPiece >= PIECE_COUNT && encodedPiece < PIECE_COUNT * 2;
}

export function colorFromFenChar(char: string): Color {
  return char === char.toUpperCase() ? WHITE : BLACK;
}
