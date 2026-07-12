import {
  NO_PIECE,
  Piece,
  getPieceChar,
  squareFromName,
  squareName,
} from "./constants";

export const MOVE_FLAG_QUIET = 0;
export const MOVE_FLAG_CAPTURE = 1;
export const MOVE_FLAG_DOUBLE_PAWN_PUSH = 2;
export const MOVE_FLAG_EN_PASSANT = 3;
export const MOVE_FLAG_CASTLE = 4;
export const MOVE_FLAG_PROMOTION = 5;
export const MOVE_FLAG_PROMOTION_CAPTURE = 6;

export type MoveFlag =
  | typeof MOVE_FLAG_QUIET
  | typeof MOVE_FLAG_CAPTURE
  | typeof MOVE_FLAG_DOUBLE_PAWN_PUSH
  | typeof MOVE_FLAG_EN_PASSANT
  | typeof MOVE_FLAG_CASTLE
  | typeof MOVE_FLAG_PROMOTION
  | typeof MOVE_FLAG_PROMOTION_CAPTURE;

const FROM_SHIFT = 0;
const TO_SHIFT = 6;
const PIECE_SHIFT = 12;
const CAPTURED_SHIFT = 16;
const PROMOTION_SHIFT = 20;
const FLAG_SHIFT = 24;
const SIX_BIT_MASK = 0x3f;
const FOUR_BIT_MASK = 0x0f;

export function encodeMove(
  from: number,
  to: number,
  piece: Piece,
  capturedPiece: Piece | typeof NO_PIECE,
  promotionPiece: Piece | typeof NO_PIECE,
  flag: MoveFlag,
): number {
  return (
    ((from & SIX_BIT_MASK) << FROM_SHIFT) |
    ((to & SIX_BIT_MASK) << TO_SHIFT) |
    (((piece + 1) & FOUR_BIT_MASK) << PIECE_SHIFT) |
    (((capturedPiece + 1) & FOUR_BIT_MASK) << CAPTURED_SHIFT) |
    (((promotionPiece + 1) & FOUR_BIT_MASK) << PROMOTION_SHIFT) |
    ((flag & FOUR_BIT_MASK) << FLAG_SHIFT)
  );
}

export function getMoveFrom(move: number): number {
  return (move >>> FROM_SHIFT) & SIX_BIT_MASK;
}

export function getMoveTo(move: number): number {
  return (move >>> TO_SHIFT) & SIX_BIT_MASK;
}

export function getMovePiece(move: number): Piece {
  return (((move >>> PIECE_SHIFT) & FOUR_BIT_MASK) - 1) as Piece;
}

export function getMoveCapturedPiece(move: number): Piece | typeof NO_PIECE {
  return (((move >>> CAPTURED_SHIFT) & FOUR_BIT_MASK) - 1) as
    | Piece
    | typeof NO_PIECE;
}

export function getMovePromotionPiece(move: number): Piece | typeof NO_PIECE {
  return (((move >>> PROMOTION_SHIFT) & FOUR_BIT_MASK) - 1) as
    | Piece
    | typeof NO_PIECE;
}

export function getMoveFlag(move: number): MoveFlag {
  return ((move >>> FLAG_SHIFT) & FOUR_BIT_MASK) as MoveFlag;
}

export function isCaptureMove(move: number): boolean {
  const flag = getMoveFlag(move);

  return (
    flag === MOVE_FLAG_CAPTURE ||
    flag === MOVE_FLAG_EN_PASSANT ||
    flag === MOVE_FLAG_PROMOTION_CAPTURE
  );
}

export function isPromotionMove(move: number): boolean {
  const flag = getMoveFlag(move);

  return (
    flag === MOVE_FLAG_PROMOTION || flag === MOVE_FLAG_PROMOTION_CAPTURE
  );
}

export function moveToUci(move: number): string {
  const promotionPiece = getMovePromotionPiece(move);

  return `${squareName(getMoveFrom(move))}${squareName(getMoveTo(move))}${
    promotionPiece === NO_PIECE ? "" : getPieceChar(promotionPiece)
  }`;
}

export function moveMatchesUci(move: number, uci: string): boolean {
  return moveToUci(move) === uci;
}

export function parseUciMove(uci: string): {
  from: number;
  to: number;
  promotion: string;
} {
  return {
    from: squareFromName(uci.slice(0, 2)),
    to: squareFromName(uci.slice(2, 4)),
    promotion: uci.slice(4, 5),
  };
}
