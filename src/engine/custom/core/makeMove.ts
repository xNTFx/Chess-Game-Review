import { clearPiece, setPiece, ChessBoard, UndoState } from "./board";
import {
  A1,
  A8,
  BLACK,
  CASTLE_BLACK_KING,
  CASTLE_BLACK_QUEEN,
  CASTLE_WHITE_KING,
  CASTLE_WHITE_QUEEN,
  Color,
  F1,
  F8,
  G1,
  G8,
  H1,
  H8,
  KING,
  NO_PIECE,
  NO_SQUARE,
  PAWN,
  Piece,
  ROOK,
  WHITE,
  encodePiece,
  getEncodedPieceColor,
  getEncodedPieceType,
  oppositeColor,
} from "./constants";
import { addPieceToEval, removePieceFromEval } from "./evaluate";
import { isSquareAttacked } from "./attacks";
import {
  MOVE_FLAG_CASTLE,
  MOVE_FLAG_DOUBLE_PAWN_PUSH,
  MOVE_FLAG_EN_PASSANT,
  getMoveFlag,
  getMoveFrom,
  getMovePiece,
  getMovePromotionPiece,
  getMoveTo,
} from "./move";
import {
  ZOBRIST_CASTLING_HI,
  ZOBRIST_CASTLING_LO,
  ZOBRIST_EN_PASSANT_HI,
  ZOBRIST_EN_PASSANT_LO,
  ZOBRIST_PIECE_HI,
  ZOBRIST_PIECE_LO,
  ZOBRIST_SIDE_HI,
  ZOBRIST_SIDE_LO,
} from "./zobrist";

export function makeMove(board: ChessBoard, move: number): boolean {
  const movingColor = board.sideToMove;
  const opponent = oppositeColor(movingColor);
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const flag = getMoveFlag(move);
  const movingEncodedPiece = board.pieceBySquare[from];

  if (
    movingEncodedPiece === NO_PIECE ||
    getEncodedPieceColor(movingEncodedPiece) !== movingColor ||
    getEncodedPieceType(movingEncodedPiece) !== movingPiece
  ) {
    return false;
  }

  const capturedSquare =
    flag === MOVE_FLAG_EN_PASSANT
      ? movingColor === WHITE
        ? to - 8
        : to + 8
      : to;
  const capturedPiece = board.pieceBySquare[capturedSquare];

  if (
    capturedPiece !== NO_PIECE &&
    getEncodedPieceColor(capturedPiece) === movingColor
  ) {
    return false;
  }

  const undo = createUndoState(board, move, capturedPiece, capturedSquare);
  board.undoStack.push(undo);
  removePositionStateFromHash(board);

  const nextCastlingRights = getNextCastlingRights(
    board.castlingRights,
    movingColor,
    movingPiece,
    from,
    capturedPiece,
    capturedSquare,
  );
  const nextEnPassantSquare =
    flag === MOVE_FLAG_DOUBLE_PAWN_PUSH
      ? movingColor === WHITE
        ? from + 8
        : from - 8
      : NO_SQUARE;

  board.castlingRights = nextCastlingRights;
  board.enPassantSquare = nextEnPassantSquare;
  board.halfmoveClock =
    movingPiece === PAWN || capturedPiece !== NO_PIECE
      ? 0
      : board.halfmoveClock + 1;
  if (movingColor === BLACK) board.fullmoveNumber += 1;

  removePiece(board, from, movingEncodedPiece);
  if (capturedPiece !== NO_PIECE) {
    removePiece(board, capturedSquare, capturedPiece);
  }

  const placedPiece =
    promotionPiece === NO_PIECE ? movingPiece : promotionPiece;
  addPiece(board, to, encodePiece(movingColor, placedPiece));

  if (flag === MOVE_FLAG_CASTLE) {
    moveCastlingRook(board, movingColor, to);
  }

  addPositionStateToHash(board);
  board.sideToMove = opponent;
  toggleSideToMoveHash(board);

  if (isSquareAttacked(board, board.kingSquare[movingColor], opponent)) {
    undoMove(board);
    return false;
  }

  return true;
}

export function undoMove(board: ChessBoard): boolean {
  const undo = board.undoStack.pop();

  if (!undo) return false;

  const move = undo.move;
  const movingColor = oppositeColor(board.sideToMove);
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const flag = getMoveFlag(move);
  const pieceOnTarget =
    promotionPiece === NO_PIECE ? movingPiece : promotionPiece;
  const encodedTargetPiece = encodePiece(movingColor, pieceOnTarget);

  if (flag === MOVE_FLAG_CASTLE) {
    undoCastlingRook(board, movingColor, to);
  }

  clearPiece(board, to);
  setPiece(board, from, movingColor, movingPiece);

  if (undo.capturedPiece !== NO_PIECE) {
    setPiece(
      board,
      undo.capturedSquare,
      getEncodedPieceColor(undo.capturedPiece),
      getEncodedPieceType(undo.capturedPiece),
    );
  }

  board.sideToMove = movingColor;
  board.castlingRights = undo.castlingRights;
  board.enPassantSquare = undo.enPassantSquare;
  board.halfmoveClock = undo.halfmoveClock;
  board.fullmoveNumber = undo.fullmoveNumber;
  board.zobristLo = undo.zobristLo;
  board.zobristHi = undo.zobristHi;
  board.evalState = { ...undo.evalState };
  board.kingSquare = [...undo.kingSquare];

  if (board.pieceBySquare[from] !== encodePiece(movingColor, movingPiece)) {
    throw new Error("Undo failed to restore moved piece");
  }
  if (encodedTargetPiece === NO_PIECE) return true;

  return true;
}

export function makeNullMove(board: ChessBoard): UndoState {
  const undo = createUndoState(board, 0, NO_PIECE, NO_SQUARE);

  removePositionStateFromHash(board);
  board.enPassantSquare = NO_SQUARE;
  board.halfmoveClock += 1;
  addPositionStateToHash(board);
  board.sideToMove = oppositeColor(board.sideToMove);
  toggleSideToMoveHash(board);

  return undo;
}

export function undoNullMove(board: ChessBoard, undo: UndoState) {
  board.sideToMove = oppositeColor(board.sideToMove);
  board.castlingRights = undo.castlingRights;
  board.enPassantSquare = undo.enPassantSquare;
  board.halfmoveClock = undo.halfmoveClock;
  board.fullmoveNumber = undo.fullmoveNumber;
  board.zobristLo = undo.zobristLo;
  board.zobristHi = undo.zobristHi;
  board.evalState = { ...undo.evalState };
  board.kingSquare = [...undo.kingSquare];
}

function addPiece(board: ChessBoard, square: number, encodedPiece: number) {
  const color = getEncodedPieceColor(encodedPiece);
  const piece = getEncodedPieceType(encodedPiece);

  setPiece(board, square, color, piece);
  xorPieceHash(board, encodedPiece, square);
  addPieceToEval(board.evalState, color, piece, square);
}

function removePiece(board: ChessBoard, square: number, encodedPiece: number) {
  const color = getEncodedPieceColor(encodedPiece);
  const piece = getEncodedPieceType(encodedPiece);

  clearPiece(board, square);
  xorPieceHash(board, encodedPiece, square);
  removePieceFromEval(board.evalState, color, piece, square);
}

function createUndoState(
  board: ChessBoard,
  move: number,
  capturedPiece: number,
  capturedSquare: number,
): UndoState {
  return {
    move,
    capturedPiece,
    capturedSquare,
    castlingRights: board.castlingRights,
    enPassantSquare: board.enPassantSquare,
    halfmoveClock: board.halfmoveClock,
    fullmoveNumber: board.fullmoveNumber,
    zobristLo: board.zobristLo,
    zobristHi: board.zobristHi,
    evalState: { ...board.evalState },
    kingSquare: [...board.kingSquare],
  };
}

function getNextCastlingRights(
  castlingRights: number,
  movingColor: Color,
  movingPiece: Piece,
  from: number,
  capturedPiece: number,
  capturedSquare: number,
): number {
  let rights = castlingRights;

  if (movingPiece === KING) {
    rights &=
      movingColor === WHITE
        ? ~(CASTLE_WHITE_KING | CASTLE_WHITE_QUEEN)
        : ~(CASTLE_BLACK_KING | CASTLE_BLACK_QUEEN);
  }

  if (movingPiece === ROOK) {
    if (from === H1) rights &= ~CASTLE_WHITE_KING;
    if (from === A1) rights &= ~CASTLE_WHITE_QUEEN;
    if (from === H8) rights &= ~CASTLE_BLACK_KING;
    if (from === A8) rights &= ~CASTLE_BLACK_QUEEN;
  }

  if (capturedPiece !== NO_PIECE && getEncodedPieceType(capturedPiece) === ROOK) {
    if (capturedSquare === H1) rights &= ~CASTLE_WHITE_KING;
    if (capturedSquare === A1) rights &= ~CASTLE_WHITE_QUEEN;
    if (capturedSquare === H8) rights &= ~CASTLE_BLACK_KING;
    if (capturedSquare === A8) rights &= ~CASTLE_BLACK_QUEEN;
  }

  return rights;
}

function moveCastlingRook(board: ChessBoard, color: Color, kingTo: number) {
  if (color === WHITE && kingTo === G1) movePiece(board, H1, F1);
  if (color === WHITE && kingTo !== G1) movePiece(board, A1, F1 - 2);
  if (color === BLACK && kingTo === G8) movePiece(board, H8, F8);
  if (color === BLACK && kingTo !== G8) movePiece(board, A8, F8 - 2);
}

function undoCastlingRook(board: ChessBoard, color: Color, kingTo: number) {
  if (color === WHITE && kingTo === G1) movePiece(board, F1, H1);
  if (color === WHITE && kingTo !== G1) movePiece(board, F1 - 2, A1);
  if (color === BLACK && kingTo === G8) movePiece(board, F8, H8);
  if (color === BLACK && kingTo !== G8) movePiece(board, F8 - 2, A8);
}

function movePiece(board: ChessBoard, from: number, to: number) {
  const encodedPiece = board.pieceBySquare[from];

  if (encodedPiece === NO_PIECE) return;

  removePiece(board, from, encodedPiece);
  addPiece(board, to, encodedPiece);
}

function removePositionStateFromHash(board: ChessBoard) {
  board.zobristLo =
    (board.zobristLo ^ ZOBRIST_CASTLING_LO[board.castlingRights]) >>> 0;
  board.zobristHi =
    (board.zobristHi ^ ZOBRIST_CASTLING_HI[board.castlingRights]) >>> 0;

  if (board.enPassantSquare !== NO_SQUARE) {
    const file = board.enPassantSquare & 7;
    board.zobristLo =
      (board.zobristLo ^ ZOBRIST_EN_PASSANT_LO[file]) >>> 0;
    board.zobristHi =
      (board.zobristHi ^ ZOBRIST_EN_PASSANT_HI[file]) >>> 0;
  }
}

function addPositionStateToHash(board: ChessBoard) {
  board.zobristLo =
    (board.zobristLo ^ ZOBRIST_CASTLING_LO[board.castlingRights]) >>> 0;
  board.zobristHi =
    (board.zobristHi ^ ZOBRIST_CASTLING_HI[board.castlingRights]) >>> 0;

  if (board.enPassantSquare !== NO_SQUARE) {
    const file = board.enPassantSquare & 7;
    board.zobristLo =
      (board.zobristLo ^ ZOBRIST_EN_PASSANT_LO[file]) >>> 0;
    board.zobristHi =
      (board.zobristHi ^ ZOBRIST_EN_PASSANT_HI[file]) >>> 0;
  }
}

function toggleSideToMoveHash(board: ChessBoard) {
  board.zobristLo = (board.zobristLo ^ ZOBRIST_SIDE_LO) >>> 0;
  board.zobristHi = (board.zobristHi ^ ZOBRIST_SIDE_HI) >>> 0;
}

function xorPieceHash(
  board: ChessBoard,
  encodedPiece: number,
  square: number,
) {
  board.zobristLo =
    (board.zobristLo ^ ZOBRIST_PIECE_LO[encodedPiece][square]) >>> 0;
  board.zobristHi =
    (board.zobristHi ^ ZOBRIST_PIECE_HI[encodedPiece][square]) >>> 0;
}
