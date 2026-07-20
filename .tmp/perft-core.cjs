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

// src/engine/custom/core/perft.ts
var perft_exports = {};
__export(perft_exports, {
  KNOWN_PERFT_CASES: () => KNOWN_PERFT_CASES,
  perft: () => perft,
  perftDivide: () => perftDivide,
  runPerftSuite: () => runPerftSuite
});
module.exports = __toCommonJS(perft_exports);

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

// src/engine/custom/core/evaluate.ts
var PIECE_VALUES = [100, 320, 330, 500, 900, 0];
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
function getPieceSquareValue(piece, square, color) {
  const file = FILE_OF[square];
  const rank = RANK_OF[square];
  const tableRank = color === WHITE ? rank : 7 - rank;
  return PIECE_SQUARE_TABLES[piece][tableRank * 8 + file] ?? 0;
}
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
var QUEEN_DIRECTIONS = [
  ...BISHOP_DIRECTIONS,
  ...ROOK_DIRECTIONS
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
var START_POSITION_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
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
  ) || isAttackedBySliders(board, square, byColor, BISHOP_DIRECTIONS2, BISHOP) || isAttackedBySliders(board, square, byColor, ROOK_DIRECTIONS2, ROOK) || isAttackedByPieceAttacks(
    board,
    square,
    byColor,
    KING,
    KING_ATTACK_LO,
    KING_ATTACK_HI
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
function getMovePromotionPiece(move) {
  return (move >>> PROMOTION_SHIFT & FOUR_BIT_MASK) - 1;
}
function getMoveFlag(move) {
  return move >>> FLAG_SHIFT & FOUR_BIT_MASK;
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

// src/engine/custom/core/perft.ts
var KNOWN_PERFT_CASES = [
  {
    fen: START_POSITION_FEN,
    expectations: {
      1: 20,
      2: 400,
      3: 8902,
      4: 197281
    }
  },
  {
    fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    expectations: {
      1: 48,
      2: 2039,
      3: 97862
    }
  },
  {
    fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    expectations: {
      1: 14,
      2: 191,
      3: 2812
    }
  },
  {
    fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    expectations: {
      1: 6,
      2: 264,
      3: 9467
    }
  }
];
function perft(board, depth) {
  if (depth <= 0) return 1;
  const moves = generateLegalMoves(board);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const move of moves) {
    if (!makeMove(board, move)) continue;
    nodes += perft(board, depth - 1);
    undoMove(board);
  }
  return nodes;
}
function perftDivide(board, depth) {
  const moves = generateLegalMoves(board);
  const entries = [];
  for (const move of moves) {
    if (!makeMove(board, move)) continue;
    entries.push({
      move: moveToUci(move),
      nodes: depth <= 1 ? 1 : perft(board, depth - 1)
    });
    undoMove(board);
  }
  return entries.sort((a, b) => a.move.localeCompare(b.move));
}
function runPerftSuite(cases = KNOWN_PERFT_CASES) {
  const results = [];
  for (const testCase of cases) {
    for (const [depth, expected] of Object.entries(testCase.expectations)) {
      const board = parseFen(testCase.fen);
      const actual = perft(board, Number(depth));
      results.push({
        fen: testCase.fen,
        depth: Number(depth),
        expected,
        actual,
        passed: actual === expected
      });
    }
  }
  return results;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KNOWN_PERFT_CASES,
  perft,
  perftDivide,
  runPerftSuite
});
