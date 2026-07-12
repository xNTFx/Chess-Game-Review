import { forEachBit, popcountParts } from "./bitboard";
import type { ChessBoard } from "./board";
import {
  B1,
  B8,
  BISHOP,
  BLACK,
  Color,
  C1,
  C8,
  FILE_OF,
  F1,
  F8,
  G1,
  G8,
  KING,
  KNIGHT,
  NO_PIECE,
  PAWN,
  Piece,
  QUEEN,
  RANK_OF,
  ROOK,
  WHITE,
  getEncodedPieceColor,
  getEncodedPieceType,
  isOnBoard,
} from "./constants";

export interface EvalState {
  material: number;
  pst: number;
  score: number;
}

export const PIECE_VALUES = [100, 320, 330, 500, 900, 0] as const;

const BISHOP_PAIR_BONUS = 35;
const CENTER_SQUARES = new Set([27, 28, 35, 36]);
const EXTENDED_CENTER_SQUARES = new Set([
  18, 19, 20, 21, 26, 29, 34, 37, 42, 43, 44, 45,
]);
const MOBILITY_WEIGHTS: Record<Piece, number> = {
  [PAWN]: 0,
  [KNIGHT]: 4,
  [BISHOP]: 4,
  [ROOK]: 2,
  [QUEEN]: 1,
  [KING]: 0,
};

const PIECE_SQUARE_TABLES: Record<Piece, readonly number[]> = {
  [PAWN]: [
    0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30,
    30, 20, 10, 10, 5, 5, 10, 28, 28, 10, 5, 5, 0, 0, 0, 25, 25, 0, 0, 0, 5,
    -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -25, -25, 10, 10, 5, 0, 0, 0, 0,
    0, 0, 0, 0,
  ],
  [KNIGHT]: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40,
    -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 20, 30, 30, 20, 0, -30, -30, 5,
    20, 30, 30, 20, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -40, -20, 0, 0,
    0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  [BISHOP]: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10,
    10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 15, 15, 10, 0, -10, -10, 5,
    10, 15, 15, 10, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 0, 0, 0, 0,
    0, 0, -10, -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  [ROOK]: [
    0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
    0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0,
    0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [QUEEN]: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10,
    0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0,
    -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10,
    -10, -5, -5, -10, -10, -20,
  ],
  [KING]: [
    20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20,
    -20, -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40,
    -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50,
    -50, -40, -40, -30,
  ],
};

export function createEmptyEvalState(): EvalState {
  return { material: 0, pst: 0, score: 0 };
}

export function addPieceToEval(
  evalState: EvalState,
  color: Color,
  piece: Piece,
  square: number,
) {
  const sign = color === WHITE ? 1 : -1;

  evalState.material += sign * PIECE_VALUES[piece];
  evalState.pst += sign * getPieceSquareValue(piece, square, color);
  evalState.score = evalState.material + evalState.pst;
}

export function removePieceFromEval(
  evalState: EvalState,
  color: Color,
  piece: Piece,
  square: number,
) {
  const sign = color === WHITE ? -1 : 1;

  evalState.material += sign * PIECE_VALUES[piece];
  evalState.pst += sign * getPieceSquareValue(piece, square, color);
  evalState.score = evalState.material + evalState.pst;
}

export function evaluateFromSideToMove(
  evalState: EvalState,
  sideToMove: Color,
): number {
  return sideToMove === WHITE ? evalState.score : -evalState.score;
}

export function evaluateBoard(board: ChessBoard): number {
  if (hasInsufficientMatingMaterial(board)) return 0;

  return Math.round(
    board.evalState.score +
      evaluateBishopPair(board) +
      evaluatePawnStructure(board) +
      evaluateMobility(board) +
      evaluateDevelopment(board) +
      evaluateCenterControl(board) +
      evaluateKingSafety(board),
  );
}

export function evaluateBoardFromSideToMove(board: ChessBoard): number {
  const score = evaluateBoard(board);

  return board.sideToMove === WHITE ? score : -score;
}

export function getPieceValue(piece: Piece): number {
  return PIECE_VALUES[piece];
}

function getPieceSquareValue(piece: Piece, square: number, color: Color): number {
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  const tableRank = color === WHITE ? rank : 7 - rank;

  return PIECE_SQUARE_TABLES[piece][tableRank * 8 + file] ?? 0;
}

function evaluateBishopPair(board: ChessBoard): number {
  const whiteBishops = popcountParts(
    board.pieces[WHITE].lo[BISHOP],
    board.pieces[WHITE].hi[BISHOP],
  );
  const blackBishops = popcountParts(
    board.pieces[BLACK].lo[BISHOP],
    board.pieces[BLACK].hi[BISHOP],
  );

  return (
    (whiteBishops >= 2 ? BISHOP_PAIR_BONUS : 0) -
    (blackBishops >= 2 ? BISHOP_PAIR_BONUS : 0)
  );
}

function evaluatePawnStructure(board: ChessBoard): number {
  return evaluatePawnStructureForColor(board, WHITE) -
    evaluatePawnStructureForColor(board, BLACK);
}

function evaluatePawnStructureForColor(
  board: ChessBoard,
  color: Color,
): number {
  const friendlyFiles = collectPawnFiles(board, color);
  const opponentFiles = collectPawnFiles(board, color === WHITE ? BLACK : WHITE);
  let score = 0;

  for (let file = 0; file < 8; file += 1) {
    if (friendlyFiles.counts[file] > 1) {
      score -= (friendlyFiles.counts[file] - 1) * 14;
    }
  }

  forEachBit(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN],
    (square) => {
      const file = FILE_OF[square];
      const rank = RANK_OF[square];
      const hasNeighbor =
        (file > 0 && friendlyFiles.counts[file - 1] > 0) ||
        (file < 7 && friendlyFiles.counts[file + 1] > 0);

      if (!hasNeighbor) score -= 10;
      if (isPassedPawn(file, rank, color, opponentFiles.squaresByFile)) {
        const advancement = color === WHITE ? rank - 1 : 6 - rank;
        score += 24 + Math.max(0, advancement) * 8;
      }
    },
  );

  return score;
}

function collectPawnFiles(board: ChessBoard, color: Color): {
  counts: number[];
  squaresByFile: number[][];
} {
  const counts = Array<number>(8).fill(0);
  const squaresByFile = Array.from({ length: 8 }, () => [] as number[]);

  forEachBit(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN],
    (square) => {
      const file = FILE_OF[square];

      counts[file] += 1;
      squaresByFile[file].push(square);
    },
  );

  return { counts, squaresByFile };
}

function isPassedPawn(
  file: number,
  rank: number,
  color: Color,
  opponentPawnsByFile: number[][],
): boolean {
  const minFile = Math.max(0, file - 1);
  const maxFile = Math.min(7, file + 1);

  for (let checkedFile = minFile; checkedFile <= maxFile; checkedFile += 1) {
    for (const square of opponentPawnsByFile[checkedFile]) {
      const opponentRank = RANK_OF[square];
      if (color === WHITE && opponentRank > rank) return false;
      if (color === BLACK && opponentRank < rank) return false;
    }
  }

  return true;
}

function evaluateMobility(board: ChessBoard): number {
  return (
    evaluateMobilityForColor(board, WHITE) - evaluateMobilityForColor(board, BLACK)
  );
}

function evaluateMobilityForColor(board: ChessBoard, color: Color): number {
  let score = 0;

  score += countStepMobility(board, color, KNIGHT, KNIGHT_OFFSETS) *
    MOBILITY_WEIGHTS[KNIGHT];
  score += countSlidingMobility(board, color, BISHOP, BISHOP_DIRECTIONS) *
    MOBILITY_WEIGHTS[BISHOP];
  score += countSlidingMobility(board, color, ROOK, ROOK_DIRECTIONS) *
    MOBILITY_WEIGHTS[ROOK];
  score += countSlidingMobility(board, color, QUEEN, QUEEN_DIRECTIONS) *
    MOBILITY_WEIGHTS[QUEEN];

  return score;
}

function countStepMobility(
  board: ChessBoard,
  color: Color,
  piece: typeof KNIGHT,
  offsets: Array<[number, number]>,
): number {
  let mobility = 0;

  forEachBit(
    board.pieces[color].lo[piece],
    board.pieces[color].hi[piece],
    (square) => {
      const file = FILE_OF[square];
      const rank = RANK_OF[square];

      for (const [fileOffset, rankOffset] of offsets) {
        const targetFile = file + fileOffset;
        const targetRank = rank + rankOffset;

        if (!isOnBoard(targetFile, targetRank)) continue;
        if (!hasFriendlyPiece(board, targetRank * 8 + targetFile, color)) {
          mobility += 1;
        }
      }
    },
  );

  return mobility;
}

function countSlidingMobility(
  board: ChessBoard,
  color: Color,
  piece: typeof BISHOP | typeof ROOK | typeof QUEEN,
  directions: Array<[number, number]>,
): number {
  let mobility = 0;

  forEachBit(
    board.pieces[color].lo[piece],
    board.pieces[color].hi[piece],
    (square) => {
      const startFile = FILE_OF[square];
      const startRank = RANK_OF[square];

      for (const [fileStep, rankStep] of directions) {
        let file = startFile + fileStep;
        let rank = startRank + rankStep;

        while (isOnBoard(file, rank)) {
          const targetSquare = rank * 8 + file;
          const targetPiece = board.pieceBySquare[targetSquare];

          if (targetPiece === NO_PIECE) {
            mobility += 1;
          } else {
            if (getEncodedPieceColor(targetPiece) !== color) mobility += 1;
            break;
          }

          file += fileStep;
          rank += rankStep;
        }
      }
    },
  );

  return mobility;
}

function hasFriendlyPiece(
  board: ChessBoard,
  square: number,
  color: Color,
): boolean {
  const piece = board.pieceBySquare[square];

  return piece !== NO_PIECE && getEncodedPieceColor(piece) === color;
}

function evaluateKingSafety(board: ChessBoard): number {
  return countPawnShield(board, WHITE) * 10 - countPawnShield(board, BLACK) * 10;
}

function evaluateDevelopment(board: ChessBoard): number {
  return evaluateDevelopmentForColor(board, WHITE) -
    evaluateDevelopmentForColor(board, BLACK);
}

function evaluateDevelopmentForColor(board: ChessBoard, color: Color): number {
  const knightHomeSquares = color === WHITE ? [B1, G1] : [B8, G8];
  const bishopHomeSquares = color === WHITE ? [C1, F1] : [C8, F8];
  let score = 0;

  for (const square of knightHomeSquares) {
    if (hasPiece(board, square, color, KNIGHT)) score -= 16;
  }

  for (const square of bishopHomeSquares) {
    if (hasPiece(board, square, color, BISHOP)) score -= 10;
  }

  if (color === WHITE) {
    if (board.kingSquare[WHITE] === G1 || board.kingSquare[WHITE] === C1) {
      score += 18;
    }
  } else if (board.kingSquare[BLACK] === G8 || board.kingSquare[BLACK] === C8) {
    score += 18;
  }

  return score;
}

function evaluateCenterControl(board: ChessBoard): number {
  return evaluateCenterControlForColor(board, WHITE) -
    evaluateCenterControlForColor(board, BLACK);
}

function evaluateCenterControlForColor(board: ChessBoard, color: Color): number {
  let score = 0;

  forEachBit(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN],
    (square) => {
      if (CENTER_SQUARES.has(square)) score += 28;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 8;
    },
  );

  forEachBit(
    board.pieces[color].lo[KNIGHT],
    board.pieces[color].hi[KNIGHT],
    (square) => {
      const file = FILE_OF[square];

      if (CENTER_SQUARES.has(square)) score += 24;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 12;
      if (file === 0 || file === 7) score -= 22;
    },
  );

  forEachBit(
    board.pieces[color].lo[BISHOP],
    board.pieces[color].hi[BISHOP],
    (square) => {
      if (CENTER_SQUARES.has(square)) score += 12;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 8;
    },
  );

  return score;
}

function countPawnShield(board: ChessBoard, color: Color): number {
  const kingSquare = board.kingSquare[color];
  if (kingSquare < 0) return 0;

  const kingFile = FILE_OF[kingSquare];
  const kingRank = RANK_OF[kingSquare];
  const shieldRank = kingRank + (color === WHITE ? 1 : -1);
  let shield = 0;

  if (shieldRank < 0 || shieldRank > 7) return 0;

  for (let file = Math.max(0, kingFile - 1); file <= Math.min(7, kingFile + 1); file += 1) {
    const square = shieldRank * 8 + file;
    const piece = board.pieceBySquare[square];

    if (
      piece !== NO_PIECE &&
      getEncodedPieceColor(piece) === color &&
      getEncodedPieceType(piece) === PAWN
    ) {
      shield += 1;
    }
  }

  return shield;
}

function hasInsufficientMatingMaterial(board: ChessBoard): boolean {
  const whitePawns = popcountParts(
    board.pieces[WHITE].lo[PAWN],
    board.pieces[WHITE].hi[PAWN],
  );
  const blackPawns = popcountParts(
    board.pieces[BLACK].lo[PAWN],
    board.pieces[BLACK].hi[PAWN],
  );
  const whiteHeavy = countColorPieces(board, WHITE, [ROOK, QUEEN]);
  const blackHeavy = countColorPieces(board, BLACK, [ROOK, QUEEN]);

  if (whitePawns + blackPawns + whiteHeavy + blackHeavy > 0) return false;

  const whiteMinor = countColorPieces(board, WHITE, [BISHOP, KNIGHT]);
  const blackMinor = countColorPieces(board, BLACK, [BISHOP, KNIGHT]);

  return whiteMinor <= 1 && blackMinor <= 1;
}

function hasPiece(
  board: ChessBoard,
  square: number,
  color: Color,
  piece: Piece,
): boolean {
  const encodedPiece = board.pieceBySquare[square];

  return (
    encodedPiece !== NO_PIECE &&
    getEncodedPieceColor(encodedPiece) === color &&
    getEncodedPieceType(encodedPiece) === piece
  );
}

function countColorPieces(
  board: ChessBoard,
  color: Color,
  pieces: Piece[],
): number {
  return pieces.reduce<number>(
    (sum, piece) =>
      sum +
      popcountParts(board.pieces[color].lo[piece], board.pieces[color].hi[piece]),
    0,
  );
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

const QUEEN_DIRECTIONS: Array<[number, number]> = [
  ...BISHOP_DIRECTIONS,
  ...ROOK_DIRECTIONS,
];
