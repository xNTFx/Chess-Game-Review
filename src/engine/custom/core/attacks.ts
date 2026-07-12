import {
  hasBitParts,
  intersectsParts,
  SQUARE_MASK_HI,
  SQUARE_MASK_LO,
} from "./bitboard";
import { ChessBoard } from "./board";
import {
  BISHOP,
  BLACK,
  BOARD_SQUARE_COUNT,
  Color,
  FILE_OF,
  KING,
  KNIGHT,
  NO_PIECE,
  PAWN,
  QUEEN,
  RANK_OF,
  ROOK,
  WHITE,
  getEncodedPieceColor,
  getEncodedPieceType,
  isOnBoard,
} from "./constants";

export const KNIGHT_ATTACK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
export const KNIGHT_ATTACK_HI = new Uint32Array(BOARD_SQUARE_COUNT);
export const KING_ATTACK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
export const KING_ATTACK_HI = new Uint32Array(BOARD_SQUARE_COUNT);
export const PAWN_ATTACK_LO = [
  new Uint32Array(BOARD_SQUARE_COUNT),
  new Uint32Array(BOARD_SQUARE_COUNT),
] as const;
export const PAWN_ATTACK_HI = [
  new Uint32Array(BOARD_SQUARE_COUNT),
  new Uint32Array(BOARD_SQUARE_COUNT),
] as const;

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

const BISHOP_DIRECTIONS: Array<[number, number]> = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];

const ROOK_DIRECTIONS: Array<[number, number]> = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];

for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
  const knightAttacks = buildStepAttacks(square, KNIGHT_OFFSETS);
  const kingAttacks = buildStepAttacks(square, KING_OFFSETS);
  const whitePawnAttacks = buildPawnAttacks(square, WHITE);
  const blackPawnAttacks = buildPawnAttacks(square, BLACK);

  KNIGHT_ATTACK_LO[square] = knightAttacks.lo;
  KNIGHT_ATTACK_HI[square] = knightAttacks.hi;
  KING_ATTACK_LO[square] = kingAttacks.lo;
  KING_ATTACK_HI[square] = kingAttacks.hi;
  PAWN_ATTACK_LO[WHITE][square] = whitePawnAttacks.lo;
  PAWN_ATTACK_HI[WHITE][square] = whitePawnAttacks.hi;
  PAWN_ATTACK_LO[BLACK][square] = blackPawnAttacks.lo;
  PAWN_ATTACK_HI[BLACK][square] = blackPawnAttacks.hi;
}

export function isSquareAttacked(
  board: ChessBoard,
  square: number,
  byColor: Color,
): boolean {
  if (square < 0) return false;

  return (
    isAttackedByPawn(board, square, byColor) ||
    isAttackedByPieceAttacks(
      board,
      square,
      byColor,
      KNIGHT,
      KNIGHT_ATTACK_LO,
      KNIGHT_ATTACK_HI,
    ) ||
    isAttackedBySliders(board, square, byColor, BISHOP_DIRECTIONS, BISHOP) ||
    isAttackedBySliders(board, square, byColor, ROOK_DIRECTIONS, ROOK) ||
    isAttackedByPieceAttacks(
      board,
      square,
      byColor,
      KING,
      KING_ATTACK_LO,
      KING_ATTACK_HI,
    )
  );
}

export function isKingInCheck(board: ChessBoard, color: Color): boolean {
  return isSquareAttacked(
    board,
    board.kingSquare[color],
    color === WHITE ? BLACK : WHITE,
  );
}

function isAttackedByPawn(
  board: ChessBoard,
  square: number,
  byColor: Color,
): boolean {
  const attackers = getPawnAttackersToSquare(square, byColor);

  return intersectsParts(
    attackers.lo,
    attackers.hi,
    board.pieces[byColor].lo[PAWN],
    board.pieces[byColor].hi[PAWN],
  );
}

function isAttackedByPieceAttacks(
  board: ChessBoard,
  square: number,
  byColor: Color,
  piece: typeof KNIGHT | typeof KING,
  attackLo: Uint32Array,
  attackHi: Uint32Array,
): boolean {
  return intersectsParts(
    attackLo[square],
    attackHi[square],
    board.pieces[byColor].lo[piece],
    board.pieces[byColor].hi[piece],
  );
}

function isAttackedBySliders(
  board: ChessBoard,
  square: number,
  byColor: Color,
  directions: Array<[number, number]>,
  sliderPiece: typeof BISHOP | typeof ROOK,
): boolean {
  const startFile = FILE_OF[square];
  const startRank = RANK_OF[square];

  for (const [fileStep, rankStep] of directions) {
    let file = startFile + fileStep;
    let rank = startRank + rankStep;

    while (isOnBoard(file, rank)) {
      const targetSquare = rank * 8 + file;
      const encodedPiece = board.pieceBySquare[targetSquare];

      if (encodedPiece !== NO_PIECE) {
        if (getEncodedPieceColor(encodedPiece) !== byColor) break;

        const piece = getEncodedPieceType(encodedPiece);
        if (piece === sliderPiece || piece === QUEEN) return true;
        break;
      }

      file += fileStep;
      rank += rankStep;
    }
  }

  return false;
}

function getPawnAttackersToSquare(
  square: number,
  byColor: Color,
): { lo: number; hi: number } {
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  let lo = 0;
  let hi = 0;

  if (byColor === WHITE && rank > 0) {
    if (file > 0) {
      lo |= SQUARE_MASK_LO[square - 9];
      hi |= SQUARE_MASK_HI[square - 9];
    }
    if (file < 7) {
      lo |= SQUARE_MASK_LO[square - 7];
      hi |= SQUARE_MASK_HI[square - 7];
    }
  }

  if (byColor === BLACK && rank < 7) {
    if (file > 0) {
      lo |= SQUARE_MASK_LO[square + 7];
      hi |= SQUARE_MASK_HI[square + 7];
    }
    if (file < 7) {
      lo |= SQUARE_MASK_LO[square + 9];
      hi |= SQUARE_MASK_HI[square + 9];
    }
  }

  return { lo: lo >>> 0, hi: hi >>> 0 };
}

function buildStepAttacks(
  square: number,
  offsets: Array<[number, number]>,
): { lo: number; hi: number } {
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  let lo = 0;
  let hi = 0;

  for (const [fileOffset, rankOffset] of offsets) {
    const targetFile = file + fileOffset;
    const targetRank = rank + rankOffset;

    if (!isOnBoard(targetFile, targetRank)) continue;

    const targetSquare = targetRank * 8 + targetFile;
    lo |= SQUARE_MASK_LO[targetSquare];
    hi |= SQUARE_MASK_HI[targetSquare];
  }

  return { lo: lo >>> 0, hi: hi >>> 0 };
}

function buildPawnAttacks(
  square: number,
  color: Color,
): { lo: number; hi: number } {
  const direction = color === WHITE ? 1 : -1;
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  let lo = 0;
  let hi = 0;

  for (const fileOffset of [-1, 1]) {
    const targetFile = file + fileOffset;
    const targetRank = rank + direction;

    if (!isOnBoard(targetFile, targetRank)) continue;

    const targetSquare = targetRank * 8 + targetFile;
    lo |= SQUARE_MASK_LO[targetSquare];
    hi |= SQUARE_MASK_HI[targetSquare];
  }

  return { lo: lo >>> 0, hi: hi >>> 0 };
}

export function attacksContainSquare(
  attackLo: number,
  attackHi: number,
  square: number,
): boolean {
  return hasBitParts(attackLo, attackHi, square);
}
