import { forEachBit } from "./bitboard";
import { ChessBoard } from "./board";
import {
  A1,
  A8,
  B1,
  B8,
  BISHOP,
  BLACK,
  C1,
  C8,
  CASTLE_BLACK_KING,
  CASTLE_BLACK_QUEEN,
  CASTLE_WHITE_KING,
  CASTLE_WHITE_QUEEN,
  Color,
  D1,
  D8,
  E1,
  E8,
  F1,
  F8,
  FILE_OF,
  G1,
  G8,
  H1,
  H8,
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
  oppositeColor,
} from "./constants";
import {
  KING_ATTACK_HI,
  KING_ATTACK_LO,
  KNIGHT_ATTACK_HI,
  KNIGHT_ATTACK_LO,
} from "./attacks";
import { isSquareAttacked } from "./attacks";
import { makeMove, undoMove } from "./makeMove";
import {
  MOVE_FLAG_CAPTURE,
  MOVE_FLAG_CASTLE,
  MOVE_FLAG_DOUBLE_PAWN_PUSH,
  MOVE_FLAG_EN_PASSANT,
  MOVE_FLAG_PROMOTION,
  MOVE_FLAG_PROMOTION_CAPTURE,
  MOVE_FLAG_QUIET,
  MoveFlag,
  encodeMove,
} from "./move";

export interface MoveGenerationOptions {
  capturesOnly?: boolean;
}

const PROMOTION_PIECES: Piece[] = [QUEEN, ROOK, BISHOP, KNIGHT];
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

export function generateLegalMoves(
  board: ChessBoard,
  options: MoveGenerationOptions = {},
): number[] {
  const pseudoMoves = generatePseudoLegalMoves(board, options);
  const legalMoves: number[] = [];

  for (const move of pseudoMoves) {
    if (!makeMove(board, move)) continue;

    legalMoves.push(move);
    undoMove(board);
  }

  return legalMoves;
}

export function generatePseudoLegalMoves(
  board: ChessBoard,
  options: MoveGenerationOptions = {},
): number[] {
  const moves: number[] = [];
  const color = board.sideToMove;

  generatePawnMoves(board, color, moves, options.capturesOnly === true);
  generateStepMoves(
    board,
    color,
    KNIGHT,
    KNIGHT_ATTACK_LO,
    KNIGHT_ATTACK_HI,
    moves,
    options.capturesOnly === true,
  );
  generateSlidingMoves(
    board,
    color,
    BISHOP,
    BISHOP_DIRECTIONS,
    moves,
    options.capturesOnly === true,
  );
  generateSlidingMoves(
    board,
    color,
    ROOK,
    ROOK_DIRECTIONS,
    moves,
    options.capturesOnly === true,
  );
  generateSlidingMoves(
    board,
    color,
    QUEEN,
    QUEEN_DIRECTIONS,
    moves,
    options.capturesOnly === true,
  );
  generateStepMoves(
    board,
    color,
    KING,
    KING_ATTACK_LO,
    KING_ATTACK_HI,
    moves,
    options.capturesOnly === true,
  );

  if (options.capturesOnly !== true) generateCastlingMoves(board, color, moves);

  return moves;
}

function generatePawnMoves(
  board: ChessBoard,
  color: Color,
  moves: number[],
  capturesOnly: boolean,
) {
  const pawns = board.pieces[color];
  const direction = color === WHITE ? 8 : -8;
  const startRank = color === WHITE ? 1 : 6;
  const promotionFromRank = color === WHITE ? 6 : 1;

  forEachBit(pawns.lo[PAWN], pawns.hi[PAWN], (from) => {
    const rank = RANK_OF[from];
    const oneStep = from + direction;

    if (
      oneStep >= 0 &&
      oneStep < 64 &&
      board.pieceBySquare[oneStep] === NO_PIECE
    ) {
      if (rank === promotionFromRank) {
        addPromotionMoves(
          moves,
          from,
          oneStep,
          NO_PIECE,
          MOVE_FLAG_PROMOTION,
        );
      } else if (!capturesOnly) {
        moves.push(
          encodeMove(from, oneStep, PAWN, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET),
        );

        const twoStep = from + direction * 2;
        if (
          rank === startRank &&
          board.pieceBySquare[twoStep] === NO_PIECE
        ) {
          moves.push(
            encodeMove(
              from,
              twoStep,
              PAWN,
              NO_PIECE,
              NO_PIECE,
              MOVE_FLAG_DOUBLE_PAWN_PUSH,
            ),
          );
        }
      }
    }

    addPawnCapture(board, color, moves, from, -1, promotionFromRank);
    addPawnCapture(board, color, moves, from, 1, promotionFromRank);
  });
}

function addPawnCapture(
  board: ChessBoard,
  color: Color,
  moves: number[],
  from: number,
  fileOffset: -1 | 1,
  promotionFromRank: number,
) {
  const file = FILE_OF[from];
  const rank = RANK_OF[from];
  const targetFile = file + fileOffset;
  const targetRank = rank + (color === WHITE ? 1 : -1);

  if (!isOnBoard(targetFile, targetRank)) return;

  const to = targetRank * 8 + targetFile;
  const targetPiece = board.pieceBySquare[to];

  if (targetPiece !== NO_PIECE && getEncodedPieceColor(targetPiece) !== color) {
    if (getEncodedPieceType(targetPiece) === KING) return;

    const capturedPiece = getEncodedPieceType(targetPiece);
    const flag =
      rank === promotionFromRank
        ? MOVE_FLAG_PROMOTION_CAPTURE
        : MOVE_FLAG_CAPTURE;

    if (rank === promotionFromRank) {
      addPromotionMoves(moves, from, to, capturedPiece, flag);
    } else {
      moves.push(encodeMove(from, to, PAWN, capturedPiece, NO_PIECE, flag));
    }

    return;
  }

  if (to === board.enPassantSquare) {
    moves.push(
      encodeMove(from, to, PAWN, PAWN, NO_PIECE, MOVE_FLAG_EN_PASSANT),
    );
  }
}

function addPromotionMoves(
  moves: number[],
  from: number,
  to: number,
  capturedPiece: Piece | typeof NO_PIECE,
  flag: MoveFlag,
) {
  for (const promotionPiece of PROMOTION_PIECES) {
    moves.push(encodeMove(from, to, PAWN, capturedPiece, promotionPiece, flag));
  }
}

function generateStepMoves(
  board: ChessBoard,
  color: Color,
  piece: typeof KNIGHT | typeof KING,
  attackLo: Uint32Array,
  attackHi: Uint32Array,
  moves: number[],
  capturesOnly: boolean,
) {
  const bitboards = board.pieces[color];
  const ownOccupancy = board.occupancy[color];

  forEachBit(bitboards.lo[piece], bitboards.hi[piece], (from) => {
    const targetLo = (attackLo[from] & ~ownOccupancy.lo) >>> 0;
    const targetHi = (attackHi[from] & ~ownOccupancy.hi) >>> 0;

    forEachBit(targetLo, targetHi, (to) => {
      addPieceMove(board, color, piece, from, to, moves, capturesOnly);
    });
  });
}

function generateSlidingMoves(
  board: ChessBoard,
  color: Color,
  piece: typeof BISHOP | typeof ROOK | typeof QUEEN,
  directions: Array<[number, number]>,
  moves: number[],
  capturesOnly: boolean,
) {
  const bitboards = board.pieces[color];

  forEachBit(bitboards.lo[piece], bitboards.hi[piece], (from) => {
    const startFile = FILE_OF[from];
    const startRank = RANK_OF[from];

    for (const [fileStep, rankStep] of directions) {
      let file = startFile + fileStep;
      let rank = startRank + rankStep;

      while (isOnBoard(file, rank)) {
        const to = rank * 8 + file;
        const targetPiece = board.pieceBySquare[to];

        if (targetPiece === NO_PIECE) {
          if (!capturesOnly) {
            moves.push(
              encodeMove(from, to, piece, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET),
            );
          }
        } else {
          if (
            getEncodedPieceColor(targetPiece) !== color &&
            getEncodedPieceType(targetPiece) !== KING
          ) {
            moves.push(
              encodeMove(
                from,
                to,
                piece,
                getEncodedPieceType(targetPiece),
                NO_PIECE,
                MOVE_FLAG_CAPTURE,
              ),
            );
          }
          break;
        }

        file += fileStep;
        rank += rankStep;
      }
    }
  });
}

function addPieceMove(
  board: ChessBoard,
  color: Color,
  piece: typeof KNIGHT | typeof KING,
  from: number,
  to: number,
  moves: number[],
  capturesOnly: boolean,
) {
  const targetPiece = board.pieceBySquare[to];

  if (targetPiece === NO_PIECE) {
    if (!capturesOnly) {
      moves.push(encodeMove(from, to, piece, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET));
    }
    return;
  }

  if (
    getEncodedPieceColor(targetPiece) !== color &&
    getEncodedPieceType(targetPiece) !== KING
  ) {
    moves.push(
      encodeMove(
        from,
        to,
        piece,
        getEncodedPieceType(targetPiece),
        NO_PIECE,
        MOVE_FLAG_CAPTURE,
      ),
    );
  }
}

function generateCastlingMoves(
  board: ChessBoard,
  color: Color,
  moves: number[],
) {
  const opponent = oppositeColor(color);

  if (isSquareAttacked(board, board.kingSquare[color], opponent)) return;

  if (color === WHITE) {
    if (
      (board.castlingRights & CASTLE_WHITE_KING) !== 0 &&
      board.kingSquare[WHITE] === E1 &&
      hasRookAt(board, H1, WHITE) &&
      board.pieceBySquare[F1] === NO_PIECE &&
      board.pieceBySquare[G1] === NO_PIECE &&
      !isSquareAttacked(board, F1, opponent) &&
      !isSquareAttacked(board, G1, opponent)
    ) {
      moves.push(encodeMove(E1, G1, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
    }

    if (
      (board.castlingRights & CASTLE_WHITE_QUEEN) !== 0 &&
      board.kingSquare[WHITE] === E1 &&
      hasRookAt(board, A1, WHITE) &&
      board.pieceBySquare[D1] === NO_PIECE &&
      board.pieceBySquare[C1] === NO_PIECE &&
      board.pieceBySquare[B1] === NO_PIECE &&
      !isSquareAttacked(board, D1, opponent) &&
      !isSquareAttacked(board, C1, opponent)
    ) {
      moves.push(encodeMove(E1, C1, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
    }

    return;
  }

  if (
    (board.castlingRights & CASTLE_BLACK_KING) !== 0 &&
    board.kingSquare[BLACK] === E8 &&
    hasRookAt(board, H8, BLACK) &&
    board.pieceBySquare[F8] === NO_PIECE &&
    board.pieceBySquare[G8] === NO_PIECE &&
    !isSquareAttacked(board, F8, opponent) &&
    !isSquareAttacked(board, G8, opponent)
  ) {
    moves.push(encodeMove(E8, G8, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
  }

  if (
    (board.castlingRights & CASTLE_BLACK_QUEEN) !== 0 &&
    board.kingSquare[BLACK] === E8 &&
    hasRookAt(board, A8, BLACK) &&
    board.pieceBySquare[D8] === NO_PIECE &&
    board.pieceBySquare[C8] === NO_PIECE &&
    board.pieceBySquare[B8] === NO_PIECE &&
    !isSquareAttacked(board, D8, opponent) &&
    !isSquareAttacked(board, C8, opponent)
  ) {
    moves.push(encodeMove(E8, C8, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
  }
}

function hasRookAt(board: ChessBoard, square: number, color: Color): boolean {
  const encodedPiece = board.pieceBySquare[square];

  return (
    encodedPiece !== NO_PIECE &&
    getEncodedPieceColor(encodedPiece) === color &&
    getEncodedPieceType(encodedPiece) === ROOK
  );
}
