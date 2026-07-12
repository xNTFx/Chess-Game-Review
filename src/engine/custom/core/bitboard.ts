import { BOARD_SQUARE_COUNT } from "./constants";

export interface Bitboard {
  lo: number;
  hi: number;
}

export const SQUARE_MASK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
export const SQUARE_MASK_HI = new Uint32Array(BOARD_SQUARE_COUNT);

for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
  if (square < 32) {
    SQUARE_MASK_LO[square] = 1 << square;
  } else {
    SQUARE_MASK_HI[square] = 1 << (square - 32);
  }
}

export function createEmptyBitboard(): Bitboard {
  return { lo: 0, hi: 0 };
}

export function setBit(bitboard: Bitboard, square: number) {
  if (square < 32) {
    bitboard.lo = (bitboard.lo | SQUARE_MASK_LO[square]) >>> 0;
  } else {
    bitboard.hi = (bitboard.hi | SQUARE_MASK_HI[square]) >>> 0;
  }
}

export function clearBit(bitboard: Bitboard, square: number) {
  if (square < 32) {
    bitboard.lo = (bitboard.lo & ~SQUARE_MASK_LO[square]) >>> 0;
  } else {
    bitboard.hi = (bitboard.hi & ~SQUARE_MASK_HI[square]) >>> 0;
  }
}

export function hasBit(bitboard: Bitboard, square: number): boolean {
  return hasBitParts(bitboard.lo, bitboard.hi, square);
}

export function hasBitParts(lo: number, hi: number, square: number): boolean {
  return square < 32
    ? (lo & SQUARE_MASK_LO[square]) !== 0
    : (hi & SQUARE_MASK_HI[square]) !== 0;
}

export function intersectsParts(
  firstLo: number,
  firstHi: number,
  secondLo: number,
  secondHi: number,
): boolean {
  return ((firstLo & secondLo) | (firstHi & secondHi)) !== 0;
}

export function popcountParts(lo: number, hi: number): number {
  return countBits32(lo) + countBits32(hi);
}

export function forEachBit(
  lo: number,
  hi: number,
  callback: (square: number) => void,
) {
  let remainingLo = lo >>> 0;
  let remainingHi = hi >>> 0;

  while (remainingLo !== 0) {
    const lsb = remainingLo & -remainingLo;
    callback(31 - Math.clz32(lsb));
    remainingLo = (remainingLo & (remainingLo - 1)) >>> 0;
  }

  while (remainingHi !== 0) {
    const lsb = remainingHi & -remainingHi;
    callback(32 + 31 - Math.clz32(lsb));
    remainingHi = (remainingHi & (remainingHi - 1)) >>> 0;
  }
}

function countBits32(value: number): number {
  let count = 0;
  let remaining = value >>> 0;

  while (remaining !== 0) {
    remaining = (remaining & (remaining - 1)) >>> 0;
    count += 1;
  }

  return count;
}
