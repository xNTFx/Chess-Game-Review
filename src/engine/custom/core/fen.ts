import {
  ChessBoard,
  colorFromFenChar,
  createEmptyBoard,
  resetBoard,
  setPiece,
} from "./board";
import {
  BISHOP,
  BLACK,
  CASTLE_BLACK_KING,
  CASTLE_BLACK_QUEEN,
  CASTLE_WHITE_KING,
  CASTLE_WHITE_QUEEN,
  Color,
  KING,
  KNIGHT,
  NO_PIECE,
  NO_SQUARE,
  PAWN,
  Piece,
  QUEEN,
  ROOK,
  WHITE,
  getEncodedPieceColor,
  getEncodedPieceType,
  getPieceChar,
  squareFromName,
} from "./constants";
import { addPieceToEval, createEmptyEvalState } from "./evaluate";
import { computeZobristHash } from "./zobrist";

export const START_POSITION_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function parseFen(fen: string): ChessBoard {
  const board = createEmptyBoard();

  loadFenIntoBoard(board, fen);

  return board;
}

export function loadFenIntoBoard(board: ChessBoard, fen: string) {
  const fields = fen.trim().split(/\s+/);

  if (fields.length < 4) {
    throw new Error(`Invalid FEN: ${fen}`);
  }

  resetBoard(board);
  loadPiecePlacement(board, fields[0], fen);
  board.sideToMove = parseSideToMove(fields[1], fen);
  board.castlingRights = parseCastlingRights(fields[2]);
  board.enPassantSquare =
    fields[3] === "-" ? NO_SQUARE : squareFromName(fields[3]);
  board.halfmoveClock = parseNonNegativeInteger(fields[4] ?? "0", fen);
  board.fullmoveNumber = Math.max(1, parseNonNegativeInteger(fields[5] ?? "1", fen));
  board.evalState = computeInitialEval(board);

  const hash = computeZobristHash(board);
  board.zobristLo = hash.lo;
  board.zobristHi = hash.hi;
}

export function boardToFen(board: ChessBoard): string {
  const ranks: string[] = [];

  for (let rank = 7; rank >= 0; rank -= 1) {
    let emptyCount = 0;
    let rankFen = "";

    for (let file = 0; file < 8; file += 1) {
      const square = rank * 8 + file;
      const piece = board.pieceBySquare[square];

      if (piece === NO_PIECE) {
        emptyCount += 1;
        continue;
      }

      if (emptyCount > 0) {
        rankFen += String(emptyCount);
        emptyCount = 0;
      }

      const pieceColor = getEncodedPieceColor(piece);
      const pieceChar = getPieceChar(getEncodedPieceType(piece));

      rankFen += pieceColor === WHITE ? pieceChar.toUpperCase() : pieceChar;
    }

    if (emptyCount > 0) rankFen += String(emptyCount);
    ranks.push(rankFen);
  }

  return [
    ranks.join("/"),
    board.sideToMove === WHITE ? "w" : "b",
    castlingRightsToFen(board.castlingRights),
    board.enPassantSquare === NO_SQUARE
      ? "-"
      : `${String.fromCharCode(97 + (board.enPassantSquare & 7))}${
          (board.enPassantSquare >> 3) + 1
        }`,
    String(board.halfmoveClock),
    String(board.fullmoveNumber),
  ].join(" ");
}

function loadPiecePlacement(board: ChessBoard, placement: string, fen: string) {
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

function parseSideToMove(value: string, fen: string): Color {
  if (value === "w") return WHITE;
  if (value === "b") return BLACK;

  throw new Error(`Invalid FEN side to move: ${fen}`);
}

function parseCastlingRights(value: string): number {
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

function castlingRightsToFen(castlingRights: number): string {
  let fen = "";

  if ((castlingRights & CASTLE_WHITE_KING) !== 0) fen += "K";
  if ((castlingRights & CASTLE_WHITE_QUEEN) !== 0) fen += "Q";
  if ((castlingRights & CASTLE_BLACK_KING) !== 0) fen += "k";
  if ((castlingRights & CASTLE_BLACK_QUEEN) !== 0) fen += "q";

  return fen || "-";
}

function pieceFromFenChar(char: string): Piece | typeof NO_PIECE {
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

function parseNonNegativeInteger(value: string, fen: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid FEN move counter: ${fen}`);
  }

  return parsed;
}

function computeInitialEval(board: ChessBoard) {
  const evalState = createEmptyEvalState();

  for (let square = 0; square < 64; square += 1) {
    const encodedPiece = board.pieceBySquare[square];

    if (encodedPiece === NO_PIECE) continue;

    addPieceToEval(
      evalState,
      getEncodedPieceColor(encodedPiece),
      getEncodedPieceType(encodedPiece),
      square,
    );
  }

  return evalState;
}
