var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/engine/custom/search/search.ts
var search_exports = {};
__export(search_exports, {
  analyzeWithNewCustomEngine: () => analyzeWithNewCustomEngine,
  clearNewCustomEngineSearchCache: () => clearNewCustomEngineSearchCache,
  getNewCustomEffectiveDepth: () => getNewCustomEffectiveDepth
});
module.exports = __toCommonJS(search_exports);

// src/engine/custom/core/constants.ts
var WHITE = 0;
var BLACK = 1;
var PAWN = 0;
var KNIGHT = 1;
var BISHOP = 2;
var ROOK = 3;
var QUEEN = 4;
var KING = 5;
var NO_PIECE = -1;
var NO_SQUARE = -1;
var PIECE_COUNT = 6;
var COLOR_COUNT = 2;
var BOARD_SQUARE_COUNT = 64;
var CASTLE_WHITE_KING = 1;
var CASTLE_WHITE_QUEEN = 2;
var CASTLE_BLACK_KING = 4;
var CASTLE_BLACK_QUEEN = 8;
var A1 = 0;
var B1 = 1;
var C1 = 2;
var D1 = 3;
var E1 = 4;
var F1 = 5;
var G1 = 6;
var H1 = 7;
var A8 = 56;
var B8 = 57;
var C8 = 58;
var D8 = 59;
var E8 = 60;
var F8 = 61;
var G8 = 62;
var H8 = 63;
var FILE_OF = new Int8Array(BOARD_SQUARE_COUNT);
var RANK_OF = new Int8Array(BOARD_SQUARE_COUNT);
var SQUARE_NAMES = [];
var FILE_NAMES = "abcdefgh";
var PIECE_CHARS = ["p", "n", "b", "r", "q", "k"];
for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
  const file = square & 7;
  const rank = square >> 3;
  FILE_OF[square] = file;
  RANK_OF[square] = rank;
  SQUARE_NAMES[square] = `${FILE_NAMES[file]}${rank + 1}`;
}
function oppositeColor(color) {
  return color === WHITE ? BLACK : WHITE;
}
function encodePiece(color, piece) {
  return color * PIECE_COUNT + piece;
}
function getEncodedPieceColor(encodedPiece) {
  return encodedPiece >= PIECE_COUNT ? BLACK : WHITE;
}
function getEncodedPieceType(encodedPiece) {
  return encodedPiece % PIECE_COUNT;
}
function getPieceChar(piece) {
  return PIECE_CHARS[piece];
}
function squareName(square) {
  return SQUARE_NAMES[square] ?? "";
}
function squareFromName(name) {
  if (!/^[a-h][1-8]$/.test(name)) return NO_SQUARE;
  const file = name.charCodeAt(0) - 97;
  const rank = Number(name[1]) - 1;
  return rank * 8 + file;
}
function isOnBoard(file, rank) {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

// src/engine/custom/core/bitboard.ts
var SQUARE_MASK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
var SQUARE_MASK_HI = new Uint32Array(BOARD_SQUARE_COUNT);
for (let square = 0; square < BOARD_SQUARE_COUNT; square += 1) {
  if (square < 32) {
    SQUARE_MASK_LO[square] = 1 << square;
  } else {
    SQUARE_MASK_HI[square] = 1 << square - 32;
  }
}
function createEmptyBitboard() {
  return { lo: 0, hi: 0 };
}
function setBit(bitboard, square) {
  if (square < 32) {
    bitboard.lo = (bitboard.lo | SQUARE_MASK_LO[square]) >>> 0;
  } else {
    bitboard.hi = (bitboard.hi | SQUARE_MASK_HI[square]) >>> 0;
  }
}
function clearBit(bitboard, square) {
  if (square < 32) {
    bitboard.lo = (bitboard.lo & ~SQUARE_MASK_LO[square]) >>> 0;
  } else {
    bitboard.hi = (bitboard.hi & ~SQUARE_MASK_HI[square]) >>> 0;
  }
}
function intersectsParts(firstLo, firstHi, secondLo, secondHi) {
  return (firstLo & secondLo | firstHi & secondHi) !== 0;
}
function popcountParts(lo, hi) {
  return countBits32(lo) + countBits32(hi);
}
function forEachBit(lo, hi, callback) {
  let remainingLo = lo >>> 0;
  let remainingHi = hi >>> 0;
  while (remainingLo !== 0) {
    const lsb = remainingLo & -remainingLo;
    callback(31 - Math.clz32(lsb));
    remainingLo = (remainingLo & remainingLo - 1) >>> 0;
  }
  while (remainingHi !== 0) {
    const lsb = remainingHi & -remainingHi;
    callback(32 + 31 - Math.clz32(lsb));
    remainingHi = (remainingHi & remainingHi - 1) >>> 0;
  }
}
function countBits32(value) {
  let count = 0;
  let remaining = value >>> 0;
  while (remaining !== 0) {
    remaining = (remaining & remaining - 1) >>> 0;
    count += 1;
  }
  return count;
}

// src/engine/custom/core/attacks.ts
var KNIGHT_ATTACK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
var KNIGHT_ATTACK_HI = new Uint32Array(BOARD_SQUARE_COUNT);
var KING_ATTACK_LO = new Uint32Array(BOARD_SQUARE_COUNT);
var KING_ATTACK_HI = new Uint32Array(BOARD_SQUARE_COUNT);
var PAWN_ATTACK_LO = [
  new Uint32Array(BOARD_SQUARE_COUNT),
  new Uint32Array(BOARD_SQUARE_COUNT)
];
var PAWN_ATTACK_HI = [
  new Uint32Array(BOARD_SQUARE_COUNT),
  new Uint32Array(BOARD_SQUARE_COUNT)
];
var KNIGHT_OFFSETS = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
];
var KING_OFFSETS = [
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];
var BISHOP_DIRECTIONS = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1]
];
var ROOK_DIRECTIONS = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1]
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
function isSquareAttacked(board, square, byColor) {
  if (square < 0) return false;
  return isAttackedByPawn(board, square, byColor) || isAttackedByPieceAttacks(
    board,
    square,
    byColor,
    KNIGHT,
    KNIGHT_ATTACK_LO,
    KNIGHT_ATTACK_HI
  ) || isAttackedBySliders(board, square, byColor, BISHOP_DIRECTIONS, BISHOP) || isAttackedBySliders(board, square, byColor, ROOK_DIRECTIONS, ROOK) || isAttackedByPieceAttacks(
    board,
    square,
    byColor,
    KING,
    KING_ATTACK_LO,
    KING_ATTACK_HI
  );
}
function isKingInCheck(board, color) {
  return isSquareAttacked(
    board,
    board.kingSquare[color],
    color === WHITE ? BLACK : WHITE
  );
}
function isAttackedByPawn(board, square, byColor) {
  const attackers = getPawnAttackersToSquare(square, byColor);
  return intersectsParts(
    attackers.lo,
    attackers.hi,
    board.pieces[byColor].lo[PAWN],
    board.pieces[byColor].hi[PAWN]
  );
}
function isAttackedByPieceAttacks(board, square, byColor, piece, attackLo, attackHi) {
  return intersectsParts(
    attackLo[square],
    attackHi[square],
    board.pieces[byColor].lo[piece],
    board.pieces[byColor].hi[piece]
  );
}
function isAttackedBySliders(board, square, byColor, directions, sliderPiece) {
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
function getPawnAttackersToSquare(square, byColor) {
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
function buildStepAttacks(square, offsets) {
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
function buildPawnAttacks(square, color) {
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

// src/engine/custom/core/evaluate.ts
var PIECE_VALUES = [100, 320, 330, 500, 900, 0];
var BISHOP_PAIR_BONUS = 35;
var CENTER_SQUARES = /* @__PURE__ */ new Set([27, 28, 35, 36]);
var EXTENDED_CENTER_SQUARES = /* @__PURE__ */ new Set([
  18,
  19,
  20,
  21,
  26,
  29,
  34,
  37,
  42,
  43,
  44,
  45
]);
var MOBILITY_WEIGHTS = {
  [PAWN]: 0,
  [KNIGHT]: 4,
  [BISHOP]: 4,
  [ROOK]: 2,
  [QUEEN]: 1,
  [KING]: 0
};
var PIECE_SQUARE_TABLES = {
  [PAWN]: [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    50,
    50,
    50,
    50,
    50,
    50,
    50,
    50,
    10,
    10,
    20,
    30,
    30,
    20,
    10,
    10,
    5,
    5,
    10,
    28,
    28,
    10,
    5,
    5,
    0,
    0,
    0,
    25,
    25,
    0,
    0,
    0,
    5,
    -5,
    -10,
    0,
    0,
    -10,
    -5,
    5,
    5,
    10,
    10,
    -25,
    -25,
    10,
    10,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [KNIGHT]: [
    -50,
    -40,
    -30,
    -30,
    -30,
    -30,
    -40,
    -50,
    -40,
    -20,
    0,
    5,
    5,
    0,
    -20,
    -40,
    -30,
    5,
    15,
    20,
    20,
    15,
    5,
    -30,
    -30,
    0,
    20,
    30,
    30,
    20,
    0,
    -30,
    -30,
    5,
    20,
    30,
    30,
    20,
    5,
    -30,
    -30,
    0,
    15,
    20,
    20,
    15,
    0,
    -30,
    -40,
    -20,
    0,
    0,
    0,
    0,
    -20,
    -40,
    -50,
    -40,
    -30,
    -30,
    -30,
    -30,
    -40,
    -50
  ],
  [BISHOP]: [
    -20,
    -10,
    -10,
    -10,
    -10,
    -10,
    -10,
    -20,
    -10,
    5,
    0,
    0,
    0,
    0,
    5,
    -10,
    -10,
    10,
    10,
    10,
    10,
    10,
    10,
    -10,
    -10,
    0,
    10,
    15,
    15,
    10,
    0,
    -10,
    -10,
    5,
    10,
    15,
    15,
    10,
    5,
    -10,
    -10,
    0,
    10,
    10,
    10,
    10,
    0,
    -10,
    -10,
    0,
    0,
    0,
    0,
    0,
    0,
    -10,
    -20,
    -10,
    -10,
    -10,
    -10,
    -10,
    -10,
    -20
  ],
  [ROOK]: [
    0,
    0,
    0,
    5,
    5,
    0,
    0,
    0,
    -5,
    0,
    0,
    0,
    0,
    0,
    0,
    -5,
    -5,
    0,
    0,
    0,
    0,
    0,
    0,
    -5,
    -5,
    0,
    0,
    0,
    0,
    0,
    0,
    -5,
    -5,
    0,
    0,
    0,
    0,
    0,
    0,
    -5,
    -5,
    0,
    0,
    0,
    0,
    0,
    0,
    -5,
    5,
    10,
    10,
    10,
    10,
    10,
    10,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  [QUEEN]: [
    -20,
    -10,
    -10,
    -5,
    -5,
    -10,
    -10,
    -20,
    -10,
    0,
    0,
    0,
    0,
    0,
    0,
    -10,
    -10,
    0,
    5,
    5,
    5,
    5,
    0,
    -10,
    -5,
    0,
    5,
    5,
    5,
    5,
    0,
    -5,
    0,
    0,
    5,
    5,
    5,
    5,
    0,
    -5,
    -10,
    5,
    5,
    5,
    5,
    5,
    0,
    -10,
    -10,
    0,
    5,
    0,
    0,
    0,
    0,
    -10,
    -20,
    -10,
    -10,
    -5,
    -5,
    -10,
    -10,
    -20
  ],
  [KING]: [
    20,
    30,
    10,
    0,
    0,
    10,
    30,
    20,
    20,
    20,
    0,
    0,
    0,
    0,
    20,
    20,
    -10,
    -20,
    -20,
    -20,
    -20,
    -20,
    -20,
    -10,
    -20,
    -30,
    -30,
    -40,
    -40,
    -30,
    -30,
    -20,
    -30,
    -40,
    -40,
    -50,
    -50,
    -40,
    -40,
    -30,
    -30,
    -40,
    -40,
    -50,
    -50,
    -40,
    -40,
    -30,
    -30,
    -40,
    -40,
    -50,
    -50,
    -40,
    -40,
    -30,
    -30,
    -40,
    -40,
    -50,
    -50,
    -40,
    -40,
    -30
  ]
};
function createEmptyEvalState() {
  return { material: 0, pst: 0, score: 0 };
}
function addPieceToEval(evalState, color, piece, square) {
  const sign = color === WHITE ? 1 : -1;
  evalState.material += sign * PIECE_VALUES[piece];
  evalState.pst += sign * getPieceSquareValue(piece, square, color);
  evalState.score = evalState.material + evalState.pst;
}
function removePieceFromEval(evalState, color, piece, square) {
  const sign = color === WHITE ? -1 : 1;
  evalState.material += sign * PIECE_VALUES[piece];
  evalState.pst += sign * getPieceSquareValue(piece, square, color);
  evalState.score = evalState.material + evalState.pst;
}
function evaluateBoard(board) {
  if (hasInsufficientMatingMaterial(board)) return 0;
  return Math.round(
    board.evalState.score + evaluateBishopPair(board) + evaluatePawnStructure(board) + evaluateMobility(board) + evaluateDevelopment(board) + evaluateCenterControl(board) + evaluateKingSafety(board)
  );
}
function evaluateBoardFromSideToMove(board) {
  const score = evaluateBoard(board);
  return board.sideToMove === WHITE ? score : -score;
}
function evaluateMaterialFromSideToMove(board) {
  const score = hasInsufficientMatingMaterial(board) ? 0 : board.evalState.material;
  return board.sideToMove === WHITE ? score : -score;
}
function getPieceValue(piece) {
  return PIECE_VALUES[piece];
}
function getPieceSquareValue(piece, square, color) {
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  const tableRank = color === WHITE ? rank : 7 - rank;
  return PIECE_SQUARE_TABLES[piece][tableRank * 8 + file] ?? 0;
}
function evaluateBishopPair(board) {
  const whiteBishops = popcountParts(
    board.pieces[WHITE].lo[BISHOP],
    board.pieces[WHITE].hi[BISHOP]
  );
  const blackBishops = popcountParts(
    board.pieces[BLACK].lo[BISHOP],
    board.pieces[BLACK].hi[BISHOP]
  );
  return (whiteBishops >= 2 ? BISHOP_PAIR_BONUS : 0) - (blackBishops >= 2 ? BISHOP_PAIR_BONUS : 0);
}
function evaluatePawnStructure(board) {
  return evaluatePawnStructureForColor(board, WHITE) - evaluatePawnStructureForColor(board, BLACK);
}
function evaluatePawnStructureForColor(board, color) {
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
      const hasNeighbor = file > 0 && friendlyFiles.counts[file - 1] > 0 || file < 7 && friendlyFiles.counts[file + 1] > 0;
      if (!hasNeighbor) score -= 10;
      if (isPassedPawn(file, rank, color, opponentFiles.squaresByFile)) {
        const advancement = color === WHITE ? rank - 1 : 6 - rank;
        score += 24 + Math.max(0, advancement) * 8;
      }
    }
  );
  return score;
}
function collectPawnFiles(board, color) {
  const counts = Array(8).fill(0);
  const squaresByFile = Array.from({ length: 8 }, () => []);
  forEachBit(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN],
    (square) => {
      const file = FILE_OF[square];
      counts[file] += 1;
      squaresByFile[file].push(square);
    }
  );
  return { counts, squaresByFile };
}
function isPassedPawn(file, rank, color, opponentPawnsByFile) {
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
function evaluateMobility(board) {
  return evaluateMobilityForColor(board, WHITE) - evaluateMobilityForColor(board, BLACK);
}
function evaluateMobilityForColor(board, color) {
  let score = 0;
  score += countStepMobility(board, color, KNIGHT, KNIGHT_OFFSETS2) * MOBILITY_WEIGHTS[KNIGHT];
  score += countSlidingMobility(board, color, BISHOP, BISHOP_DIRECTIONS2) * MOBILITY_WEIGHTS[BISHOP];
  score += countSlidingMobility(board, color, ROOK, ROOK_DIRECTIONS2) * MOBILITY_WEIGHTS[ROOK];
  score += countSlidingMobility(board, color, QUEEN, QUEEN_DIRECTIONS) * MOBILITY_WEIGHTS[QUEEN];
  return score;
}
function countStepMobility(board, color, piece, offsets) {
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
    }
  );
  return mobility;
}
function countSlidingMobility(board, color, piece, directions) {
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
    }
  );
  return mobility;
}
function hasFriendlyPiece(board, square, color) {
  const piece = board.pieceBySquare[square];
  return piece !== NO_PIECE && getEncodedPieceColor(piece) === color;
}
function evaluateKingSafety(board) {
  return countPawnShield(board, WHITE) * 10 - countPawnShield(board, BLACK) * 10;
}
function evaluateDevelopment(board) {
  return evaluateDevelopmentForColor(board, WHITE) - evaluateDevelopmentForColor(board, BLACK);
}
function evaluateDevelopmentForColor(board, color) {
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
function evaluateCenterControl(board) {
  return evaluateCenterControlForColor(board, WHITE) - evaluateCenterControlForColor(board, BLACK);
}
function evaluateCenterControlForColor(board, color) {
  let score = 0;
  forEachBit(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN],
    (square) => {
      if (CENTER_SQUARES.has(square)) score += 28;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 8;
    }
  );
  forEachBit(
    board.pieces[color].lo[KNIGHT],
    board.pieces[color].hi[KNIGHT],
    (square) => {
      const file = FILE_OF[square];
      if (CENTER_SQUARES.has(square)) score += 24;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 12;
      if (file === 0 || file === 7) score -= 22;
    }
  );
  forEachBit(
    board.pieces[color].lo[BISHOP],
    board.pieces[color].hi[BISHOP],
    (square) => {
      if (CENTER_SQUARES.has(square)) score += 12;
      if (EXTENDED_CENTER_SQUARES.has(square)) score += 8;
    }
  );
  return score;
}
function countPawnShield(board, color) {
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
    if (piece !== NO_PIECE && getEncodedPieceColor(piece) === color && getEncodedPieceType(piece) === PAWN) {
      shield += 1;
    }
  }
  return shield;
}
function hasInsufficientMatingMaterial(board) {
  const whitePawns = popcountParts(
    board.pieces[WHITE].lo[PAWN],
    board.pieces[WHITE].hi[PAWN]
  );
  const blackPawns = popcountParts(
    board.pieces[BLACK].lo[PAWN],
    board.pieces[BLACK].hi[PAWN]
  );
  const whiteHeavy = countColorPieces(board, WHITE, [ROOK, QUEEN]);
  const blackHeavy = countColorPieces(board, BLACK, [ROOK, QUEEN]);
  if (whitePawns + blackPawns + whiteHeavy + blackHeavy > 0) return false;
  const whiteMinor = countColorPieces(board, WHITE, [BISHOP, KNIGHT]);
  const blackMinor = countColorPieces(board, BLACK, [BISHOP, KNIGHT]);
  return whiteMinor <= 1 && blackMinor <= 1;
}
function hasPiece(board, square, color, piece) {
  const encodedPiece = board.pieceBySquare[square];
  return encodedPiece !== NO_PIECE && getEncodedPieceColor(encodedPiece) === color && getEncodedPieceType(encodedPiece) === piece;
}
function countColorPieces(board, color, pieces) {
  return pieces.reduce(
    (sum, piece) => sum + popcountParts(board.pieces[color].lo[piece], board.pieces[color].hi[piece]),
    0
  );
}
var KNIGHT_OFFSETS2 = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
];
var BISHOP_DIRECTIONS2 = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1]
];
var ROOK_DIRECTIONS2 = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1]
];
var QUEEN_DIRECTIONS = [
  ...BISHOP_DIRECTIONS2,
  ...ROOK_DIRECTIONS2
];

// src/engine/custom/core/board.ts
function createEmptyBoard() {
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
    undoStack: []
  };
}
function setPiece(board, square, color, piece) {
  const encodedPiece = encodePiece(color, piece);
  board.pieceBySquare[square] = encodedPiece;
  setPieceBit(board.pieces[color], piece, square);
  setBit(board.occupancy[color], square);
  setBit(board.occupancyAll, square);
  if (piece === KING) {
    board.kingSquare[color] = square;
  }
}
function clearPiece(board, square) {
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
function createPieceBitboards() {
  return {
    lo: new Uint32Array(PIECE_COUNT),
    hi: new Uint32Array(PIECE_COUNT)
  };
}
function setPieceBit(bitboards, piece, square) {
  if (square < 32) {
    bitboards.lo[piece] = (bitboards.lo[piece] | 1 << square) >>> 0;
  } else {
    bitboards.hi[piece] = (bitboards.hi[piece] | 1 << square - 32) >>> 0;
  }
}
function clearPieceBit(bitboards, piece, square) {
  if (square < 32) {
    bitboards.lo[piece] = (bitboards.lo[piece] & ~(1 << square)) >>> 0;
  } else {
    bitboards.hi[piece] = (bitboards.hi[piece] & ~(1 << square - 32)) >>> 0;
  }
}
function resetBoard(board) {
  for (let color = 0; color < COLOR_COUNT; color += 1) {
    board.pieces[color].lo.fill(0);
    board.pieces[color].hi.fill(0);
    board.occupancy[color].lo = 0;
    board.occupancy[color].hi = 0;
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
function colorFromFenChar(char) {
  return char === char.toUpperCase() ? WHITE : BLACK;
}

// src/engine/custom/core/zobrist.ts
var randomState = 2654435769;
var ZOBRIST_PIECE_LO = [];
var ZOBRIST_PIECE_HI = [];
var ZOBRIST_CASTLING_LO = new Uint32Array(16);
var ZOBRIST_CASTLING_HI = new Uint32Array(16);
var ZOBRIST_EN_PASSANT_LO = new Uint32Array(8);
var ZOBRIST_EN_PASSANT_HI = new Uint32Array(8);
var ZOBRIST_SIDE_LO = nextRandom32();
var ZOBRIST_SIDE_HI = nextRandom32();
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
function computeZobristHash(board) {
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
function nextRandom32() {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return randomState >>> 0;
}

// src/engine/custom/core/fen.ts
function parseFen(fen) {
  const board = createEmptyBoard();
  loadFenIntoBoard(board, fen);
  return board;
}
function loadFenIntoBoard(board, fen) {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 4) {
    throw new Error(`Invalid FEN: ${fen}`);
  }
  resetBoard(board);
  loadPiecePlacement(board, fields[0], fen);
  board.sideToMove = parseSideToMove(fields[1], fen);
  board.castlingRights = parseCastlingRights(fields[2]);
  board.enPassantSquare = fields[3] === "-" ? NO_SQUARE : squareFromName(fields[3]);
  board.halfmoveClock = parseNonNegativeInteger(fields[4] ?? "0", fen);
  board.fullmoveNumber = Math.max(1, parseNonNegativeInteger(fields[5] ?? "1", fen));
  board.evalState = computeInitialEval(board);
  const hash = computeZobristHash(board);
  board.zobristLo = hash.lo;
  board.zobristHi = hash.hi;
}
function loadPiecePlacement(board, placement, fen) {
  const ranks = placement.split("/");
  if (ranks.length !== 8) {
    throw new Error(`Invalid FEN piece placement: ${fen}`);
  }
  ranks.forEach((rankFen, rankIndex) => {
    let file = 0;
    const rank = 7 - rankIndex;
    for (const char of rankFen) {
      if (/^[1-8]$/.test(char)) {
        file += Number(char);
        continue;
      }
      const piece = pieceFromFenChar(char);
      if (piece === NO_PIECE || file > 7) {
        throw new Error(`Invalid FEN piece placement: ${fen}`);
      }
      setPiece(board, rank * 8 + file, colorFromFenChar(char), piece);
      file += 1;
    }
    if (file !== 8) {
      throw new Error(`Invalid FEN piece placement: ${fen}`);
    }
  });
}
function parseSideToMove(value, fen) {
  if (value === "w") return WHITE;
  if (value === "b") return BLACK;
  throw new Error(`Invalid FEN side to move: ${fen}`);
}
function parseCastlingRights(value) {
  if (value === "-") return 0;
  let rights = 0;
  for (const char of value) {
    if (char === "K") rights |= CASTLE_WHITE_KING;
    if (char === "Q") rights |= CASTLE_WHITE_QUEEN;
    if (char === "k") rights |= CASTLE_BLACK_KING;
    if (char === "q") rights |= CASTLE_BLACK_QUEEN;
  }
  return rights;
}
function pieceFromFenChar(char) {
  switch (char.toLowerCase()) {
    case "p":
      return PAWN;
    case "n":
      return KNIGHT;
    case "b":
      return BISHOP;
    case "r":
      return ROOK;
    case "q":
      return QUEEN;
    case "k":
      return KING;
    default:
      return NO_PIECE;
  }
}
function parseNonNegativeInteger(value, fen) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid FEN move counter: ${fen}`);
  }
  return parsed;
}
function computeInitialEval(board) {
  const evalState = createEmptyEvalState();
  for (let square = 0; square < 64; square += 1) {
    const encodedPiece = board.pieceBySquare[square];
    if (encodedPiece === NO_PIECE) continue;
    addPieceToEval(
      evalState,
      getEncodedPieceColor(encodedPiece),
      getEncodedPieceType(encodedPiece),
      square
    );
  }
  return evalState;
}

// src/engine/custom/core/move.ts
var MOVE_FLAG_QUIET = 0;
var MOVE_FLAG_CAPTURE = 1;
var MOVE_FLAG_DOUBLE_PAWN_PUSH = 2;
var MOVE_FLAG_EN_PASSANT = 3;
var MOVE_FLAG_CASTLE = 4;
var MOVE_FLAG_PROMOTION = 5;
var MOVE_FLAG_PROMOTION_CAPTURE = 6;
var FROM_SHIFT = 0;
var TO_SHIFT = 6;
var PIECE_SHIFT = 12;
var CAPTURED_SHIFT = 16;
var PROMOTION_SHIFT = 20;
var FLAG_SHIFT = 24;
var SIX_BIT_MASK = 63;
var FOUR_BIT_MASK = 15;
function encodeMove(from, to, piece, capturedPiece, promotionPiece, flag) {
  return (from & SIX_BIT_MASK) << FROM_SHIFT | (to & SIX_BIT_MASK) << TO_SHIFT | (piece + 1 & FOUR_BIT_MASK) << PIECE_SHIFT | (capturedPiece + 1 & FOUR_BIT_MASK) << CAPTURED_SHIFT | (promotionPiece + 1 & FOUR_BIT_MASK) << PROMOTION_SHIFT | (flag & FOUR_BIT_MASK) << FLAG_SHIFT;
}
function getMoveFrom(move) {
  return move >>> FROM_SHIFT & SIX_BIT_MASK;
}
function getMoveTo(move) {
  return move >>> TO_SHIFT & SIX_BIT_MASK;
}
function getMovePiece(move) {
  return (move >>> PIECE_SHIFT & FOUR_BIT_MASK) - 1;
}
function getMoveCapturedPiece(move) {
  return (move >>> CAPTURED_SHIFT & FOUR_BIT_MASK) - 1;
}
function getMovePromotionPiece(move) {
  return (move >>> PROMOTION_SHIFT & FOUR_BIT_MASK) - 1;
}
function getMoveFlag(move) {
  return move >>> FLAG_SHIFT & FOUR_BIT_MASK;
}
function isCaptureMove(move) {
  const flag = getMoveFlag(move);
  return flag === MOVE_FLAG_CAPTURE || flag === MOVE_FLAG_EN_PASSANT || flag === MOVE_FLAG_PROMOTION_CAPTURE;
}
function isPromotionMove(move) {
  const flag = getMoveFlag(move);
  return flag === MOVE_FLAG_PROMOTION || flag === MOVE_FLAG_PROMOTION_CAPTURE;
}
function moveToUci(move) {
  const promotionPiece = getMovePromotionPiece(move);
  return `${squareName(getMoveFrom(move))}${squareName(getMoveTo(move))}${promotionPiece === NO_PIECE ? "" : getPieceChar(promotionPiece)}`;
}

// src/engine/custom/core/makeMove.ts
function makeMove(board, move) {
  const movingColor = board.sideToMove;
  const opponent = oppositeColor(movingColor);
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const flag = getMoveFlag(move);
  const movingEncodedPiece = board.pieceBySquare[from];
  if (movingEncodedPiece === NO_PIECE || getEncodedPieceColor(movingEncodedPiece) !== movingColor || getEncodedPieceType(movingEncodedPiece) !== movingPiece) {
    return false;
  }
  const capturedSquare = flag === MOVE_FLAG_EN_PASSANT ? movingColor === WHITE ? to - 8 : to + 8 : to;
  const capturedPiece = board.pieceBySquare[capturedSquare];
  if (capturedPiece !== NO_PIECE && getEncodedPieceColor(capturedPiece) === movingColor) {
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
    capturedSquare
  );
  const nextEnPassantSquare = flag === MOVE_FLAG_DOUBLE_PAWN_PUSH ? movingColor === WHITE ? from + 8 : from - 8 : NO_SQUARE;
  board.castlingRights = nextCastlingRights;
  board.enPassantSquare = nextEnPassantSquare;
  board.halfmoveClock = movingPiece === PAWN || capturedPiece !== NO_PIECE ? 0 : board.halfmoveClock + 1;
  if (movingColor === BLACK) board.fullmoveNumber += 1;
  removePiece(board, from, movingEncodedPiece);
  if (capturedPiece !== NO_PIECE) {
    removePiece(board, capturedSquare, capturedPiece);
  }
  const placedPiece = promotionPiece === NO_PIECE ? movingPiece : promotionPiece;
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
function undoMove(board) {
  const undo = board.undoStack.pop();
  if (!undo) return false;
  const move = undo.move;
  const movingColor = oppositeColor(board.sideToMove);
  const from = getMoveFrom(move);
  const to = getMoveTo(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const flag = getMoveFlag(move);
  const pieceOnTarget = promotionPiece === NO_PIECE ? movingPiece : promotionPiece;
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
      getEncodedPieceType(undo.capturedPiece)
    );
  }
  board.sideToMove = movingColor;
  board.castlingRights = undo.castlingRights;
  board.enPassantSquare = undo.enPassantSquare;
  board.halfmoveClock = undo.halfmoveClock;
  board.fullmoveNumber = undo.fullmoveNumber;
  board.zobristLo = undo.zobristLo;
  board.zobristHi = undo.zobristHi;
  board.evalState.material = undo.evalMaterial;
  board.evalState.pst = undo.evalPst;
  board.evalState.score = undo.evalScore;
  board.kingSquare[WHITE] = undo.whiteKingSquare;
  board.kingSquare[BLACK] = undo.blackKingSquare;
  if (board.pieceBySquare[from] !== encodePiece(movingColor, movingPiece)) {
    throw new Error("Undo failed to restore moved piece");
  }
  if (encodedTargetPiece === NO_PIECE) return true;
  return true;
}
function makeNullMove(board) {
  const undo = createUndoState(board, 0, NO_PIECE, NO_SQUARE);
  removePositionStateFromHash(board);
  board.enPassantSquare = NO_SQUARE;
  board.halfmoveClock += 1;
  addPositionStateToHash(board);
  board.sideToMove = oppositeColor(board.sideToMove);
  toggleSideToMoveHash(board);
  return undo;
}
function undoNullMove(board, undo) {
  board.sideToMove = oppositeColor(board.sideToMove);
  board.castlingRights = undo.castlingRights;
  board.enPassantSquare = undo.enPassantSquare;
  board.halfmoveClock = undo.halfmoveClock;
  board.fullmoveNumber = undo.fullmoveNumber;
  board.zobristLo = undo.zobristLo;
  board.zobristHi = undo.zobristHi;
  board.evalState.material = undo.evalMaterial;
  board.evalState.pst = undo.evalPst;
  board.evalState.score = undo.evalScore;
  board.kingSquare[WHITE] = undo.whiteKingSquare;
  board.kingSquare[BLACK] = undo.blackKingSquare;
}
function addPiece(board, square, encodedPiece) {
  const color = getEncodedPieceColor(encodedPiece);
  const piece = getEncodedPieceType(encodedPiece);
  setPiece(board, square, color, piece);
  xorPieceHash(board, encodedPiece, square);
  addPieceToEval(board.evalState, color, piece, square);
}
function removePiece(board, square, encodedPiece) {
  const color = getEncodedPieceColor(encodedPiece);
  const piece = getEncodedPieceType(encodedPiece);
  clearPiece(board, square);
  xorPieceHash(board, encodedPiece, square);
  removePieceFromEval(board.evalState, color, piece, square);
}
function createUndoState(board, move, capturedPiece, capturedSquare) {
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
    evalMaterial: board.evalState.material,
    evalPst: board.evalState.pst,
    evalScore: board.evalState.score,
    whiteKingSquare: board.kingSquare[WHITE],
    blackKingSquare: board.kingSquare[BLACK]
  };
}
function getNextCastlingRights(castlingRights, movingColor, movingPiece, from, capturedPiece, capturedSquare) {
  let rights = castlingRights;
  if (movingPiece === KING) {
    rights &= movingColor === WHITE ? ~(CASTLE_WHITE_KING | CASTLE_WHITE_QUEEN) : ~(CASTLE_BLACK_KING | CASTLE_BLACK_QUEEN);
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
function moveCastlingRook(board, color, kingTo) {
  if (color === WHITE && kingTo === G1) movePiece(board, H1, F1);
  if (color === WHITE && kingTo !== G1) movePiece(board, A1, F1 - 2);
  if (color === BLACK && kingTo === G8) movePiece(board, H8, F8);
  if (color === BLACK && kingTo !== G8) movePiece(board, A8, F8 - 2);
}
function undoCastlingRook(board, color, kingTo) {
  if (color === WHITE && kingTo === G1) movePiece(board, F1, H1);
  if (color === WHITE && kingTo !== G1) movePiece(board, F1 - 2, A1);
  if (color === BLACK && kingTo === G8) movePiece(board, F8, H8);
  if (color === BLACK && kingTo !== G8) movePiece(board, F8 - 2, A8);
}
function movePiece(board, from, to) {
  const encodedPiece = board.pieceBySquare[from];
  if (encodedPiece === NO_PIECE) return;
  removePiece(board, from, encodedPiece);
  addPiece(board, to, encodedPiece);
}
function removePositionStateFromHash(board) {
  board.zobristLo = (board.zobristLo ^ ZOBRIST_CASTLING_LO[board.castlingRights]) >>> 0;
  board.zobristHi = (board.zobristHi ^ ZOBRIST_CASTLING_HI[board.castlingRights]) >>> 0;
  if (board.enPassantSquare !== NO_SQUARE) {
    const file = board.enPassantSquare & 7;
    board.zobristLo = (board.zobristLo ^ ZOBRIST_EN_PASSANT_LO[file]) >>> 0;
    board.zobristHi = (board.zobristHi ^ ZOBRIST_EN_PASSANT_HI[file]) >>> 0;
  }
}
function addPositionStateToHash(board) {
  board.zobristLo = (board.zobristLo ^ ZOBRIST_CASTLING_LO[board.castlingRights]) >>> 0;
  board.zobristHi = (board.zobristHi ^ ZOBRIST_CASTLING_HI[board.castlingRights]) >>> 0;
  if (board.enPassantSquare !== NO_SQUARE) {
    const file = board.enPassantSquare & 7;
    board.zobristLo = (board.zobristLo ^ ZOBRIST_EN_PASSANT_LO[file]) >>> 0;
    board.zobristHi = (board.zobristHi ^ ZOBRIST_EN_PASSANT_HI[file]) >>> 0;
  }
}
function toggleSideToMoveHash(board) {
  board.zobristLo = (board.zobristLo ^ ZOBRIST_SIDE_LO) >>> 0;
  board.zobristHi = (board.zobristHi ^ ZOBRIST_SIDE_HI) >>> 0;
}
function xorPieceHash(board, encodedPiece, square) {
  board.zobristLo = (board.zobristLo ^ ZOBRIST_PIECE_LO[encodedPiece][square]) >>> 0;
  board.zobristHi = (board.zobristHi ^ ZOBRIST_PIECE_HI[encodedPiece][square]) >>> 0;
}

// src/engine/custom/core/movegen.ts
var PROMOTION_PIECES = [QUEEN, ROOK, BISHOP, KNIGHT];
var BISHOP_DIRECTIONS3 = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1]
];
var ROOK_DIRECTIONS3 = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1]
];
var QUEEN_DIRECTIONS2 = [
  ...BISHOP_DIRECTIONS3,
  ...ROOK_DIRECTIONS3
];
function generateLegalMoves(board, options = {}) {
  const pseudoMoves = generatePseudoLegalMoves(board, options);
  const legalMoves = [];
  for (const move of pseudoMoves) {
    if (!makeMove(board, move)) continue;
    legalMoves.push(move);
    undoMove(board);
  }
  return legalMoves;
}
function generatePseudoLegalMoves(board, options = {}) {
  const moves = [];
  const color = board.sideToMove;
  generatePawnMoves(board, color, moves, options.capturesOnly === true);
  generateStepMoves(
    board,
    color,
    KNIGHT,
    KNIGHT_ATTACK_LO,
    KNIGHT_ATTACK_HI,
    moves,
    options.capturesOnly === true
  );
  generateSlidingMoves(
    board,
    color,
    BISHOP,
    BISHOP_DIRECTIONS3,
    moves,
    options.capturesOnly === true
  );
  generateSlidingMoves(
    board,
    color,
    ROOK,
    ROOK_DIRECTIONS3,
    moves,
    options.capturesOnly === true
  );
  generateSlidingMoves(
    board,
    color,
    QUEEN,
    QUEEN_DIRECTIONS2,
    moves,
    options.capturesOnly === true
  );
  generateStepMoves(
    board,
    color,
    KING,
    KING_ATTACK_LO,
    KING_ATTACK_HI,
    moves,
    options.capturesOnly === true
  );
  if (options.capturesOnly !== true) generateCastlingMoves(board, color, moves);
  return moves;
}
function generatePawnMoves(board, color, moves, capturesOnly) {
  const pawns = board.pieces[color];
  const direction = color === WHITE ? 8 : -8;
  const startRank = color === WHITE ? 1 : 6;
  const promotionFromRank = color === WHITE ? 6 : 1;
  forEachBit(pawns.lo[PAWN], pawns.hi[PAWN], (from) => {
    const rank = RANK_OF[from];
    const oneStep = from + direction;
    if (oneStep >= 0 && oneStep < 64 && board.pieceBySquare[oneStep] === NO_PIECE) {
      if (rank === promotionFromRank) {
        addPromotionMoves(
          moves,
          from,
          oneStep,
          NO_PIECE,
          MOVE_FLAG_PROMOTION
        );
      } else if (!capturesOnly) {
        moves.push(
          encodeMove(from, oneStep, PAWN, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET)
        );
        const twoStep = from + direction * 2;
        if (rank === startRank && board.pieceBySquare[twoStep] === NO_PIECE) {
          moves.push(
            encodeMove(
              from,
              twoStep,
              PAWN,
              NO_PIECE,
              NO_PIECE,
              MOVE_FLAG_DOUBLE_PAWN_PUSH
            )
          );
        }
      }
    }
    addPawnCapture(board, color, moves, from, -1, promotionFromRank);
    addPawnCapture(board, color, moves, from, 1, promotionFromRank);
  });
}
function addPawnCapture(board, color, moves, from, fileOffset, promotionFromRank) {
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
    const flag = rank === promotionFromRank ? MOVE_FLAG_PROMOTION_CAPTURE : MOVE_FLAG_CAPTURE;
    if (rank === promotionFromRank) {
      addPromotionMoves(moves, from, to, capturedPiece, flag);
    } else {
      moves.push(encodeMove(from, to, PAWN, capturedPiece, NO_PIECE, flag));
    }
    return;
  }
  if (to === board.enPassantSquare) {
    moves.push(
      encodeMove(from, to, PAWN, PAWN, NO_PIECE, MOVE_FLAG_EN_PASSANT)
    );
  }
}
function addPromotionMoves(moves, from, to, capturedPiece, flag) {
  for (const promotionPiece of PROMOTION_PIECES) {
    moves.push(encodeMove(from, to, PAWN, capturedPiece, promotionPiece, flag));
  }
}
function generateStepMoves(board, color, piece, attackLo, attackHi, moves, capturesOnly) {
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
function generateSlidingMoves(board, color, piece, directions, moves, capturesOnly) {
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
              encodeMove(from, to, piece, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET)
            );
          }
        } else {
          if (getEncodedPieceColor(targetPiece) !== color && getEncodedPieceType(targetPiece) !== KING) {
            moves.push(
              encodeMove(
                from,
                to,
                piece,
                getEncodedPieceType(targetPiece),
                NO_PIECE,
                MOVE_FLAG_CAPTURE
              )
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
function addPieceMove(board, color, piece, from, to, moves, capturesOnly) {
  const targetPiece = board.pieceBySquare[to];
  if (targetPiece === NO_PIECE) {
    if (!capturesOnly) {
      moves.push(encodeMove(from, to, piece, NO_PIECE, NO_PIECE, MOVE_FLAG_QUIET));
    }
    return;
  }
  if (getEncodedPieceColor(targetPiece) !== color && getEncodedPieceType(targetPiece) !== KING) {
    moves.push(
      encodeMove(
        from,
        to,
        piece,
        getEncodedPieceType(targetPiece),
        NO_PIECE,
        MOVE_FLAG_CAPTURE
      )
    );
  }
}
function generateCastlingMoves(board, color, moves) {
  const opponent = oppositeColor(color);
  if (isSquareAttacked(board, board.kingSquare[color], opponent)) return;
  if (color === WHITE) {
    if ((board.castlingRights & CASTLE_WHITE_KING) !== 0 && board.kingSquare[WHITE] === E1 && hasRookAt(board, H1, WHITE) && board.pieceBySquare[F1] === NO_PIECE && board.pieceBySquare[G1] === NO_PIECE && !isSquareAttacked(board, F1, opponent) && !isSquareAttacked(board, G1, opponent)) {
      moves.push(encodeMove(E1, G1, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
    }
    if ((board.castlingRights & CASTLE_WHITE_QUEEN) !== 0 && board.kingSquare[WHITE] === E1 && hasRookAt(board, A1, WHITE) && board.pieceBySquare[D1] === NO_PIECE && board.pieceBySquare[C1] === NO_PIECE && board.pieceBySquare[B1] === NO_PIECE && !isSquareAttacked(board, D1, opponent) && !isSquareAttacked(board, C1, opponent)) {
      moves.push(encodeMove(E1, C1, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
    }
    return;
  }
  if ((board.castlingRights & CASTLE_BLACK_KING) !== 0 && board.kingSquare[BLACK] === E8 && hasRookAt(board, H8, BLACK) && board.pieceBySquare[F8] === NO_PIECE && board.pieceBySquare[G8] === NO_PIECE && !isSquareAttacked(board, F8, opponent) && !isSquareAttacked(board, G8, opponent)) {
    moves.push(encodeMove(E8, G8, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
  }
  if ((board.castlingRights & CASTLE_BLACK_QUEEN) !== 0 && board.kingSquare[BLACK] === E8 && hasRookAt(board, A8, BLACK) && board.pieceBySquare[D8] === NO_PIECE && board.pieceBySquare[C8] === NO_PIECE && board.pieceBySquare[B8] === NO_PIECE && !isSquareAttacked(board, D8, opponent) && !isSquareAttacked(board, C8, opponent)) {
    moves.push(encodeMove(E8, C8, KING, NO_PIECE, NO_PIECE, MOVE_FLAG_CASTLE));
  }
}
function hasRookAt(board, square, color) {
  const encodedPiece = board.pieceBySquare[square];
  return encodedPiece !== NO_PIECE && getEncodedPieceColor(encodedPiece) === color && getEncodedPieceType(encodedPiece) === ROOK;
}

// src/engine/custom/search/moveOrdering.ts
var TT_MOVE_SCORE = 2e6;
var WINNING_CAPTURE_SCORE = 1e6;
var PROMOTION_SCORE = 8e5;
var KILLER_SCORE = 6e5;
var HISTORY_LIMIT = 16e3;
var CENTER_SQUARES2 = /* @__PURE__ */ new Set([27, 28, 35, 36]);
function orderMoves(board, moves, context, ply, ttMove) {
  if (!context.config.useMoveOrdering) return moves;
  return moves.sort(
    (a, b) => scoreMove(board, b, context, ply, ttMove) - scoreMove(board, a, context, ply, ttMove)
  );
}
function scoreMove(board, move, context, ply, ttMove) {
  if (ttMove !== void 0 && move === ttMove) return TT_MOVE_SCORE;
  let score = 0;
  const promotionPiece = getMovePromotionPiece(move);
  if (isCaptureMove(move)) {
    const gain = getCaptureGain(move);
    score += WINNING_CAPTURE_SCORE + gain * 32;
  }
  if (promotionPiece !== NO_PIECE) {
    score += PROMOTION_SCORE + getPieceValue(promotionPiece);
  }
  if (isKillerMove(context, ply, move)) score += KILLER_SCORE;
  if (CENTER_SQUARES2.has(getMoveTo(move))) score += 20;
  score += getHistoryScore(board, context, move);
  return score;
}
function addKillerMove(context, ply, move) {
  if (!context.killerMoves[ply]) context.killerMoves[ply] = [];
  if (context.killerMoves[ply].includes(move)) return;
  context.killerMoves[ply] = [move, ...context.killerMoves[ply]].slice(0, 2);
}
function addHistoryScore(board, context, move, depth) {
  const index = getHistoryIndex(board, move);
  const bonus = depth * depth;
  context.history[index] = Math.min(HISTORY_LIMIT, context.history[index] + bonus);
}
function isQuietSearchMove(move) {
  return !isCaptureMove(move) && !isPromotionMove(move) && getMoveFlag(move) !== MOVE_FLAG_CASTLE;
}
function getCaptureGain(move) {
  const capturedPiece = getMoveCapturedPiece(move);
  const movingPiece = getMovePiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const capturedValue = capturedPiece === NO_PIECE ? 0 : getPieceValue(capturedPiece);
  const promotionGain = promotionPiece === NO_PIECE ? 0 : getPieceValue(promotionPiece) - getPieceValue(movingPiece);
  return capturedValue + promotionGain - getPieceValue(movingPiece);
}
function isKillerMove(context, ply, move) {
  return context.killerMoves[ply]?.includes(move) ?? false;
}
function getHistoryScore(board, context, move) {
  return context.history[getHistoryIndex(board, move)] ?? 0;
}
function getHistoryIndex(board, move) {
  return board.sideToMove * 4096 + getMoveFrom(move) * 64 + getMoveTo(move);
}

// src/engine/custom/search/timeManager.ts
function getSearchTimeLimitMs(depth) {
  if (depth <= 4) return 900;
  if (depth <= 5) return 1400;
  if (depth <= 6) return 2400;
  if (depth <= 7) return 4200;
  return 6500;
}
function shouldStopSearch(context) {
  if (context.stopped) return true;
  if (context.shouldStop?.()) {
    context.stopped = true;
    return true;
  }
  if (performance.now() - context.startedAt > context.maxTimeMs) {
    context.stopped = true;
    return true;
  }
  return false;
}
function yieldToWorkerQueue() {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

// src/engine/custom/search/types.ts
var MATE_SCORE = 1e5;
var MATE_THRESHOLD = MATE_SCORE - 1e3;
var MAX_PLY = 96;
var INF = 1e6;
var DEFAULT_SEARCH_CONFIG = {
  useAlphaBeta: true,
  useMoveOrdering: true,
  useTranspositionTable: true,
  useQuiescence: true,
  useNullMove: true,
  useLateMoveReductions: true,
  useCheckExtensions: true,
  evaluation: "positional"
};

// src/engine/custom/search/quiescence.ts
var MAX_QUIESCENCE_DEPTH = 8;
var DELTA_MARGIN = 200;
function quiescence(board, alpha, beta, ply, context, remainingDepth = MAX_QUIESCENCE_DEPTH) {
  context.stats.nodes += 1;
  context.stats.quiescenceNodes += 1;
  context.stats.selectiveDepth = Math.max(context.stats.selectiveDepth, ply);
  const inCheck = isKingInCheck(board, board.sideToMove);
  const standPat = evaluateBoardFromSideToMove(board);
  if (remainingDepth <= 0 || ply >= MAX_PLY) {
    return { score: standPat, pv: [] };
  }
  if (context.stats.nodes % 2048 === 0 && shouldStopSearch(context)) {
    return { score: standPat, pv: [] };
  }
  let searchAlpha = context.config.useAlphaBeta ? alpha : -MATE_SCORE;
  const searchBeta = context.config.useAlphaBeta ? beta : MATE_SCORE;
  if (!inCheck) {
    if (context.config.useAlphaBeta && standPat >= beta) {
      return { score: standPat, pv: [] };
    }
    if (standPat > searchAlpha) searchAlpha = standPat;
  }
  const legalMoves = generateLegalMoves(board, { capturesOnly: !inCheck });
  if (legalMoves.length === 0) {
    return inCheck ? { score: -MATE_SCORE + ply, pv: [] } : { score: standPat, pv: [] };
  }
  const moves = orderMoves(board, legalMoves, context, ply);
  let bestScore = inCheck ? -MATE_SCORE + ply : standPat;
  let bestPv = [];
  for (const move of moves) {
    if (!inCheck && shouldDeltaPrune(move, standPat, searchAlpha)) continue;
    if (!inCheck && isCaptureMove(move) && getCaptureGain(move) < -350) continue;
    if (!makeMove(board, move)) continue;
    const child = quiescence(
      board,
      -searchBeta,
      -searchAlpha,
      ply + 1,
      context,
      remainingDepth - 1
    );
    const score = -child.score;
    undoMove(board);
    if (score > bestScore) {
      bestScore = score;
      bestPv = [move, ...child.pv];
    }
    if (score > searchAlpha) {
      searchAlpha = score;
      if (context.config.useAlphaBeta && searchAlpha >= searchBeta) {
        context.stats.cutoffs += 1;
        context.stats.betaCutoffs += 1;
        break;
      }
    }
  }
  return { score: bestScore, pv: bestPv };
}
function shouldDeltaPrune(move, standPat, alpha) {
  const capturedPiece = getMoveCapturedPiece(move);
  const promotionPiece = getMovePromotionPiece(move);
  const capturedValue = capturedPiece === NO_PIECE ? 0 : getPieceValue(capturedPiece);
  const promotionValue = promotionPiece === NO_PIECE ? 0 : getPieceValue(promotionPiece);
  return standPat + capturedValue + promotionValue + DELTA_MARGIN < alpha;
}

// src/engine/custom/search/transpositionTable.ts
var MATE_SCORE2 = 1e5;
var MATE_THRESHOLD2 = MATE_SCORE2 - 1e3;
var MAX_ENTRIES = 24e4;
var TRIM_COUNT = 4e4;
var TranspositionTable = class {
  // Dwa dokładne klucze Uint32 są tańsze niż tworzenie stringa dla każdego
  // probe/store, a jednocześnie zachowują pełne 64 bity hasha.
  entries = /* @__PURE__ */ new Map();
  entryCount = 0;
  generation = 0;
  nextGeneration() {
    this.generation += 1;
  }
  clear() {
    this.entries.clear();
    this.entryCount = 0;
    this.generation = 0;
  }
  getBestMove(board) {
    return this.getEntry(board)?.bestMove;
  }
  probe(board, depth, alpha, beta, ply, stats) {
    const entry = this.getEntry(board);
    if (!entry) return {};
    stats.transpositionHits += 1;
    if (entry.depth < depth) {
      return { bestMove: entry.bestMove };
    }
    if (entry.flag === "exact") {
      stats.transpositionCutoffs += 1;
      return {
        score: scoreFromTable(entry.score, ply),
        bestMove: entry.bestMove
      };
    }
    const score = scoreFromTable(entry.score, ply);
    if (entry.flag === "lower" && score >= beta) {
      stats.transpositionCutoffs += 1;
      return { score, bestMove: entry.bestMove };
    }
    if (entry.flag === "upper" && score <= alpha) {
      stats.transpositionCutoffs += 1;
      return { score, bestMove: entry.bestMove };
    }
    return { bestMove: entry.bestMove };
  }
  store(board, depth, score, flag, bestMove, ply = 0) {
    if (depth <= 0) return;
    const existing = this.getEntry(board);
    if (existing && existing.generation === this.generation && existing.depth > depth) {
      return;
    }
    if (this.entryCount >= MAX_ENTRIES) this.trim();
    let bucket = this.entries.get(board.zobristHi);
    if (!bucket) {
      bucket = /* @__PURE__ */ new Map();
      this.entries.set(board.zobristHi, bucket);
    }
    if (!bucket.has(board.zobristLo)) this.entryCount += 1;
    bucket.set(board.zobristLo, {
      keyLo: board.zobristLo,
      keyHi: board.zobristHi,
      depth,
      score: scoreToTable(score, ply),
      flag,
      bestMove,
      generation: this.generation
    });
  }
  trim() {
    let removed = 0;
    for (const [hi, bucket] of this.entries) {
      for (const lo of bucket.keys()) {
        bucket.delete(lo);
        this.entryCount -= 1;
        removed += 1;
        if (removed >= TRIM_COUNT) break;
      }
      if (bucket.size === 0) this.entries.delete(hi);
      if (removed >= TRIM_COUNT) break;
    }
  }
  getEntry(board) {
    return this.entries.get(board.zobristHi)?.get(board.zobristLo);
  }
};
function scoreToTable(score, ply) {
  if (score >= MATE_THRESHOLD2) return score + ply;
  if (score <= -MATE_THRESHOLD2) return score - ply;
  return score;
}
function scoreFromTable(score, ply) {
  if (score >= MATE_THRESHOLD2) return score - ply;
  if (score <= -MATE_THRESHOLD2) return score + ply;
  return score;
}
var sharedTranspositionTable = new TranspositionTable();

// src/engine/custom/search/search.ts
var ASPIRATION_WINDOW = 45;
async function analyzeWithNewCustomEngine({
  fen,
  depth,
  multiPv,
  onUpdate,
  shouldStop,
  config: requestedConfig
}) {
  const board = parseFen(fen);
  const effectiveDepth = getNewCustomEffectiveDepth(depth);
  const startedAt = performance.now();
  const context = createSearchContext(
    startedAt,
    effectiveDepth,
    shouldStop,
    { ...DEFAULT_SEARCH_CONFIG, ...requestedConfig }
  );
  const rootLegalMoves = generateLegalMoves(board);
  sharedTranspositionTable.nextGeneration();
  if (rootLegalMoves.length === 0) {
    return buildTerminalPosition(board, effectiveDepth, startedAt, context.stats);
  }
  let bestEval = buildPositionEval(
    rootLegalMoves.map((move) => ({ move, score: 0, pv: [move] })),
    0,
    board.sideToMove,
    startedAt,
    context.stats,
    rootLegalMoves.length,
    multiPv
  );
  let previousScore = 0;
  for (let currentDepth = 1; currentDepth <= effectiveDepth; currentDepth += 1) {
    if (shouldStopSearch(context)) break;
    const searchWindow = currentDepth >= 4 && multiPv <= 1 ? {
      alpha: previousScore - ASPIRATION_WINDOW,
      beta: previousScore + ASPIRATION_WINDOW
    } : { alpha: -INF, beta: INF };
    let rootLines = searchRoot(
      board,
      currentDepth,
      multiPv,
      searchWindow.alpha,
      searchWindow.beta,
      context
    );
    if (context.stopped) break;
    if (rootLines[0] && (rootLines[0].score <= searchWindow.alpha || rootLines[0].score >= searchWindow.beta)) {
      rootLines = searchRoot(board, currentDepth, multiPv, -INF, INF, context);
    }
    if (rootLines.length > 0) {
      previousScore = rootLines[0].score;
      bestEval = buildPositionEval(
        rootLines,
        currentDepth,
        board.sideToMove,
        startedAt,
        context.stats,
        rootLegalMoves.length,
        multiPv
      );
      onUpdate?.(bestEval);
    }
    await yieldToWorkerQueue();
  }
  return bestEval;
}
function clearNewCustomEngineSearchCache() {
  sharedTranspositionTable.clear();
}
function getNewCustomEffectiveDepth(requestedDepth) {
  return Math.max(1, Math.min(MAX_PLY - 2, Math.floor(requestedDepth)));
}
function searchRoot(board, depth, multiPv, alpha, beta, context) {
  const ttMove = context.config.useTranspositionTable ? sharedTranspositionTable.getBestMove(board) : void 0;
  const legalMoves = orderMoves(
    board,
    generateLegalMoves(board),
    context,
    0,
    ttMove
  );
  const rootLines = [];
  let bestScore = -INF;
  let bestMove;
  const alphaBetaEnabled = context.config.useAlphaBeta;
  let searchAlpha = !alphaBetaEnabled || multiPv > 1 ? -INF : alpha;
  const searchBeta = !alphaBetaEnabled || multiPv > 1 ? INF : beta;
  for (const move of legalMoves) {
    if (shouldStopSearch(context)) break;
    if (!makeMove(board, move)) continue;
    const child = pvs(
      {
        board,
        depth: depth - 1,
        alpha: -searchBeta,
        beta: -searchAlpha,
        ply: 1,
        allowNullMove: true
      },
      context
    );
    const score = -child.score;
    undoMove(board);
    rootLines.push({ move, score, pv: [move, ...child.pv] });
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (alphaBetaEnabled && multiPv <= 1 && score > searchAlpha) {
      searchAlpha = score;
    }
  }
  if (bestMove !== void 0) {
    if (context.config.useTranspositionTable) {
      sharedTranspositionTable.store(
        board,
        depth,
        bestScore,
        getTranspositionFlag(bestScore, alpha, beta),
        bestMove,
        0
      );
    }
  }
  return rootLines.sort((a, b) => b.score - a.score).slice(0, multiPv);
}
function pvs(params, context) {
  const { board, depth, alpha, beta, ply, allowNullMove } = params;
  context.stats.nodes += 1;
  context.stats.selectiveDepth = Math.max(context.stats.selectiveDepth, ply);
  if (ply >= MAX_PLY) {
    return { score: evaluateForContext(board, context), pv: [] };
  }
  if (context.stats.nodes % 2048 === 0 && shouldStopSearch(context)) {
    return { score: evaluateForContext(board, context), pv: [] };
  }
  if (depth <= 0) {
    return context.config.useQuiescence ? quiescence(board, alpha, beta, ply, context) : { score: evaluateForContext(board, context), pv: [] };
  }
  if (board.halfmoveClock >= 100) return { score: 0, pv: [] };
  const alphaBetaEnabled = context.config.useAlphaBeta;
  const alphaOriginal = alpha;
  let searchAlpha = alphaBetaEnabled ? alpha : -INF;
  const searchBeta = alphaBetaEnabled ? beta : INF;
  const inCheck = isKingInCheck(board, board.sideToMove);
  const ttProbe = context.config.useTranspositionTable ? sharedTranspositionTable.probe(
    board,
    depth,
    searchAlpha,
    searchBeta,
    ply,
    context.stats
  ) : {};
  if (ttProbe.score !== void 0) {
    return {
      score: ttProbe.score,
      pv: ttProbe.bestMove !== void 0 ? [ttProbe.bestMove] : []
    };
  }
  const staticEval = evaluateForContext(board, context);
  const extension = context.config.useCheckExtensions && inCheck && depth <= 8 ? 1 : 0;
  if (alphaBetaEnabled && !inCheck && depth <= 2 && Math.abs(beta) < MATE_THRESHOLD && staticEval - depth * 120 >= beta) {
    return { score: staticEval, pv: [] };
  }
  if (alphaBetaEnabled && context.config.useNullMove && allowNullMove && depth >= 3 && !inCheck && Math.abs(beta) < MATE_THRESHOLD && hasSufficientMaterialForNullMove(board, board.sideToMove)) {
    const undo = makeNullMove(board);
    const reduction = depth >= 6 ? 3 : 2;
    const nullResult = pvs(
      {
        board,
        depth: depth - 1 - reduction,
        alpha: -searchBeta,
        beta: -searchBeta + 1,
        ply: ply + 1,
        allowNullMove: false
      },
      context
    );
    const score = -nullResult.score;
    undoNullMove(board, undo);
    if (alphaBetaEnabled && score >= searchBeta) {
      context.stats.nullMoveCutoffs += 1;
      if (context.config.useTranspositionTable) {
        sharedTranspositionTable.store(board, depth, score, "lower", void 0, ply);
      }
      return { score, pv: [] };
    }
  }
  const legalMoves = orderMoves(
    board,
    generateLegalMoves(board),
    context,
    ply,
    ttProbe.bestMove
  );
  if (legalMoves.length === 0) {
    return {
      score: inCheck ? -MATE_SCORE + ply : 0,
      pv: []
    };
  }
  let bestScore = -INF;
  let bestMove;
  let bestPv = [];
  let searchedMoves = 0;
  for (let moveIndex = 0; moveIndex < legalMoves.length; moveIndex += 1) {
    const move = legalMoves[moveIndex];
    const isQuiet = isQuietSearchMove(move);
    if (!inCheck && isQuiet && depth <= 2 && moveIndex > 0 && staticEval + depth * 90 <= searchAlpha) {
      continue;
    }
    if (!makeMove(board, move)) continue;
    const reduction = context.config.useLateMoveReductions ? getLateMoveReduction(depth, moveIndex, isQuiet, inCheck) : 0;
    const childDepth = depth - 1 + extension;
    let child;
    if (searchedMoves === 0) {
      child = pvs(
        {
          board,
          depth: childDepth,
          alpha: -beta,
          beta: -searchAlpha,
          ply: ply + 1,
          allowNullMove: true
        },
        context
      );
    } else {
      child = pvs(
        {
          board,
          depth: Math.max(0, childDepth - reduction),
          alpha: -searchAlpha - 1,
          beta: -searchAlpha,
          ply: ply + 1,
          allowNullMove: true
        },
        context
      );
      if (reduction > 0 && -child.score > searchAlpha) {
        context.stats.lmrReductions += 1;
        child = pvs(
          {
            board,
            depth: childDepth,
            alpha: -searchAlpha - 1,
            beta: -searchAlpha,
            ply: ply + 1,
            allowNullMove: true
          },
          context
        );
      }
      if (-child.score > searchAlpha && -child.score < beta) {
        child = pvs(
          {
            board,
            depth: childDepth,
            alpha: -beta,
            beta: -searchAlpha,
            ply: ply + 1,
            allowNullMove: true
          },
          context
        );
      }
    }
    const score = -child.score;
    undoMove(board);
    searchedMoves += 1;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      bestPv = [move, ...child.pv];
    }
    if (score > searchAlpha) {
      searchAlpha = score;
      if (alphaBetaEnabled && searchAlpha >= searchBeta) {
        context.stats.cutoffs += 1;
        context.stats.betaCutoffs += 1;
        if (isQuiet) {
          addKillerMove(context, ply, move);
          addHistoryScore(board, context, move, depth);
        }
        break;
      }
    }
  }
  if (searchedMoves === 0) {
    return { score: staticEval, pv: [] };
  }
  if (context.config.useTranspositionTable) {
    sharedTranspositionTable.store(
      board,
      depth,
      bestScore,
      getTranspositionFlag(bestScore, alphaOriginal, searchBeta),
      bestMove,
      ply
    );
  }
  return { score: bestScore, pv: bestPv };
}
function getLateMoveReduction(depth, moveIndex, isQuiet, inCheck) {
  if (!isQuiet || inCheck || depth < 3 || moveIndex < 4) return 0;
  if (depth >= 6 && moveIndex >= 10) return 2;
  return 1;
}
function getTranspositionFlag(score, alphaOriginal, beta) {
  if (score <= alphaOriginal) return "upper";
  if (score >= beta) return "lower";
  return "exact";
}
function buildTerminalPosition(board, depth, startedAt, stats) {
  const inCheck = isKingInCheck(board, board.sideToMove);
  const mate = inCheck ? board.sideToMove === WHITE ? -1 : 1 : void 0;
  return {
    lines: [
      {
        pv: [],
        cp: mate === void 0 ? 0 : void 0,
        mate,
        depth,
        multiPv: 1
      }
    ],
    benchmark: buildBenchmark(depth, startedAt, stats, 0)
  };
}
function buildPositionEval(rootLines, depth, rootColor, startedAt, stats, legalMoves, multiPv) {
  const selectedLines = rootLines.slice(0, multiPv);
  return {
    bestMove: selectedLines[0] ? moveToUci(selectedLines[0].move) : void 0,
    lines: selectedLines.map((line, index) => {
      const whiteScore = rootColor === WHITE ? line.score : -line.score;
      const mate = getMateScore(whiteScore);
      return {
        pv: line.pv.map(moveToUci),
        cp: mate === void 0 ? clampCentipawns(whiteScore) : void 0,
        mate,
        depth,
        multiPv: index + 1
      };
    }),
    benchmark: buildBenchmark(depth, startedAt, stats, legalMoves)
  };
}
function buildBenchmark(depth, startedAt, stats, legalMoves) {
  const elapsedMs = performance.now() - startedAt;
  return {
    depth,
    elapsedMs,
    nodes: stats.nodes,
    nodesPerSecond: elapsedMs > 0 ? Math.round(stats.nodes / (elapsedMs / 1e3)) : 0,
    legalMoves,
    quiescenceNodes: stats.quiescenceNodes,
    transpositionHits: stats.transpositionHits,
    cutoffs: stats.cutoffs
  };
}
function getMateScore(score) {
  if (score >= MATE_THRESHOLD) {
    return Math.max(1, Math.ceil((MATE_SCORE - score) / 2));
  }
  if (score <= -MATE_THRESHOLD) {
    return -Math.max(1, Math.ceil((MATE_SCORE + score) / 2));
  }
  return void 0;
}
function clampCentipawns(score) {
  return Math.max(-5e3, Math.min(5e3, Math.round(score)));
}
function createSearchContext(startedAt, depth, shouldStop, config = DEFAULT_SEARCH_CONFIG) {
  return {
    stats: createSearchStats(),
    transpositionTable: sharedTranspositionTable,
    killerMoves: Array.from({ length: MAX_PLY + 1 }, () => []),
    history: new Int32Array(8192),
    startedAt,
    maxTimeMs: config.maxTimeMs ?? getSearchTimeLimitMs(depth),
    shouldStop,
    stopped: false,
    config
  };
}
function evaluateForContext(board, context) {
  return context.config.evaluation === "material" ? evaluateMaterialFromSideToMove(board) : evaluateBoardFromSideToMove(board);
}
function createSearchStats() {
  return {
    nodes: 0,
    quiescenceNodes: 0,
    transpositionHits: 0,
    transpositionCutoffs: 0,
    cutoffs: 0,
    betaCutoffs: 0,
    nullMoveCutoffs: 0,
    lmrReductions: 0,
    selectiveDepth: 0
  };
}
function hasSufficientMaterialForNullMove(board, color) {
  const nonPawnPieces = [KNIGHT, BISHOP, ROOK, QUEEN].reduce(
    (count, piece) => count + popcountParts(board.pieces[color].lo[piece], board.pieces[color].hi[piece]),
    0
  );
  const pawns = popcountParts(
    board.pieces[color].lo[PAWN],
    board.pieces[color].hi[PAWN]
  );
  return nonPawnPieces >= 2 || pawns >= 4;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeWithNewCustomEngine,
  clearNewCustomEngineSearchCache,
  getNewCustomEffectiveDepth
});
