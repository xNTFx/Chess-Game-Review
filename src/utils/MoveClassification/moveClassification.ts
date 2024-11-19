import { Chess, Square } from "chess.js";

import { openings } from "../../data/openings";
import { MoveClassification } from "../../types/enums";
import { LineEval, PositionEval } from "../../types/eval";
import { getPieceValue } from "../chessUtils";
import {
  getLineWinPercentage,
  getPositionWinPercentage,
} from "../winProbability";
import {
  getIsPieceSacrifice,
  isMoveSignificant,
  isSimplePieceRecapture,
} from "./moveClassificationFunctions";

// Main function to classify moves based on position evaluations and win percentages
const getMovesClassification = (
  rawPositions: PositionEval[],
  uciMoves: string[],
  fens: string[],
): PositionEval[] => {
  // Calculate win percentage for each position
  const positionsWinPercentage = rawPositions.map((position) =>
    getPositionWinPercentage(position),
  );

  let currentOpening: string | undefined = undefined;

  // Classify each move based on previous position, lines, and best moves
  const positionResults = rawPositions.map((rawPosition, index) => {
    if (index === 0) return rawPosition; // Skip first move, as it has no previous context

    const currentFen = fens[index].split(" ")[0];
    // Check if the current FEN matches a known opening
    const opening = openings.find((opening) => opening.fen === currentFen);

    if (opening) {
      currentOpening = opening.name;
      return {
        ...rawPosition,
        opening: opening.name,
        moveClassification: MoveClassification.Book,
      };
    }

    const playedMove = uciMoves[index - 1];
    const position = rawPositions[index - 1];
    const lines = position.lines;
    const bestMove = position.bestMove;

    // Find an alternative line that doesn't match the played move
    const lastPositionAlternativeLine: LineEval | undefined =
      position.lines.filter((line) => line.pv[0] !== playedMove)?.[0];
    const lastPositionAlternativeLineWinPercentage = lastPositionAlternativeLine
      ? getLineWinPercentage(lastPositionAlternativeLine)
      : undefined;

    // Retrieve win percentages for the current and previous positions
    const lastPositionWinPercentage = positionsWinPercentage[index - 1];
    const positionWinPercentage = positionsWinPercentage[index];
    const isWhiteMove = index % 2 === 1; // Determine if it's White's turn

    // Check for two moves ago to determine recapture or strategic sequences
    const fenTwoMovesAgo = index > 1 ? fens[index - 2] : null;
    const uciNextTwoMoves: [string, string] | null =
      index > 1 ? [uciMoves[index - 2], uciMoves[index - 1]] : null;

    // Check if a mate sequence was missed
    if (isMissedMate(fens[index], lines, playedMove, isWhiteMove)) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Missed_win,
      };
    }

    // Classify as a brilliant move if strategic and involves a sacrifice
    if (
      isBrilliantMove(
        lastPositionWinPercentage,
        positionWinPercentage,
        isWhiteMove,
        playedMove,
        fens[index - 1],
        lastPositionAlternativeLineWinPercentage,
        lines,
      )
    ) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Brilliant,
      };
    }

    // Check for a great move based on strategic positioning
    if (
      isGreatMove(
        fens[index - 1],
        uciNextTwoMoves,
        fenTwoMovesAgo,
        isWhiteMove,
        playedMove,
        lines,
        positionWinPercentage,
        lastPositionAlternativeLineWinPercentage,
      )
    ) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Great,
      };
    }

    // Classify move as "Best" if it matches the best move recommended
    if (playedMove === bestMove) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Best,
      };
    }

    // Default move classification based on basic win percentage difference
    const moveClassification = getMoveBasicClassification(
      lastPositionWinPercentage,
      positionWinPercentage,
      isWhiteMove,
    );

    return {
      ...rawPosition,
      opening: currentOpening,
      moveClassification,
    };
  });

  return positionResults; // Return the list of classified positions
};

// Helper function to check if a capture was of equal or lesser value
const wasCaptureOfSameOrLowerValuePiece = (
  game: Chess,
  fromSquare: Square,
  toSquare: Square,
): boolean => {
  const movedPiece = game.get(fromSquare);
  const capturedPiece = game.get(toSquare);

  if (!movedPiece || !capturedPiece) return false;

  const movedPieceValue = getPieceValue(movedPiece.type);
  const capturedPieceValue = getPieceValue(capturedPiece.type);

  return movedPieceValue >= capturedPieceValue;
};

// Checks if a mate sequence was missed
const isMissedMate = (
  fen: string,
  lines: LineEval[],
  playedMove: string,
  isWhiteMove: boolean,
): boolean => {
  const game = new Chess(fen);

  // Return false if the position is already a checkmate
  if (game.isCheckmate()) return false;

  // Identify if there's a mate line with a short sequence
  const mateLine = lines.find(
    (line) => line.mate !== undefined && line.pv.length <= 1,
  );

  // No valid mate line found, return false
  if (!mateLine || !mateLine.mate) return false;

  // Check if the mate line applies to the current player and was missed
  const mateIsForCurrentPlayer =
    (isWhiteMove && mateLine.mate > 0) || (!isWhiteMove && mateLine.mate < 0);
  if (mateIsForCurrentPlayer && mateLine.pv[0] !== playedMove) {
    return true;
  }

  return false;
};

// Classifies moves based on win percentage changes
const getMoveBasicClassification = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
): MoveClassification => {
  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);

  if (winPercentageDiff < -20) return MoveClassification.Blunder;
  if (winPercentageDiff < -10) return MoveClassification.Mistake;
  if (winPercentageDiff < -5) return MoveClassification.Inaccuracy;
  if (winPercentageDiff < -2) return MoveClassification.Good;
  return MoveClassification.Excellent;
};

// Helper function to check if the position is either losing or if an alternative line was completely winning
const isLosingOrAlternateCompletelyWinning = (
  positionWinPercentage: number,
  lastPositionAlternativeLineWinPercentage: number,
  isWhiteMove: boolean,
): boolean => {
  const isLosing = isWhiteMove
    ? positionWinPercentage < 50
    : positionWinPercentage > 50;
  const isAlternateCompletelyWinning = isWhiteMove
    ? lastPositionAlternativeLineWinPercentage > 97
    : lastPositionAlternativeLineWinPercentage < 3;

  return isLosing || isAlternateCompletelyWinning;
};

// Determines if a move is brilliant based on strategic sacrifice
const isBrilliantMove = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
  playedMove: string,
  fen: string,
  lastPositionAlternativeLineWinPercentage: number | undefined,
  lines: LineEval[],
): boolean => {
  const game = new Chess(fen);
  const fromSquare = playedMove.slice(0, 2) as Square;
  const movedPiece = game.get(fromSquare);

  if (game.isCheck()) return false; // If the previous move was a check, the current move cannot be brilliant

  if (!movedPiece) return false;

  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);

  // Threshold for a significant disadvantage
  const disadvantageThreshold = 100;

  // Check if the move caused a significant loss and wasn't strategically significant
  if (
    winPercentageDiff <= -50 &&
    !isMoveSignificant(lines, playedMove, isWhiteMove, disadvantageThreshold)
  )
    return false;

  if (!lastPositionAlternativeLineWinPercentage) return false;

  if (
    isLosingOrAlternateCompletelyWinning(
      positionWinPercentage,
      lastPositionAlternativeLineWinPercentage,
      isWhiteMove,
    )
  ) {
    return false;
  }

  const isPieceSacrifice = getIsPieceSacrifice(fen, playedMove);
  if (!isPieceSacrifice) return false;

  return true;
};

// Determines if a move is great based on strategic gain without sacrifice
const isGreatMove = (
  fen: string,
  uciMoves: [string, string] | null,
  fenTwoMovesAgo: string | null,
  isWhiteMove: boolean,
  playedMove: string,
  lines: LineEval[],
  positionWinPercentage: number,
  lastPositionAlternativeLineWinPercentage: number | undefined,
): boolean => {
  if (lines.length === 0) {
    return false;
  }

  if (!lastPositionAlternativeLineWinPercentage) return false;

  if (
    isLosingOrAlternateCompletelyWinning(
      positionWinPercentage,
      lastPositionAlternativeLineWinPercentage,
      isWhiteMove,
    )
  ) {
    return false;
  }

  const game = new Chess(fen);
  const fromSquare = playedMove.slice(0, 2) as Square;
  const toSquare = playedMove.slice(2, 4) as Square;
  const movedPiece = game.get(fromSquare);
  const capturedPiece = game.get(toSquare);

  // Check if the move was a king capture to escape check
  if (movedPiece && movedPiece.type === "k" && capturedPiece) {
    game.move({
      from: fromSquare,
      to: toSquare,
    });
    if (!game.inCheck()) return false;
  }

  // Check if the move was made by a pawn and is strategically significant
  if (movedPiece && movedPiece.type === "p") {
    if (
      capturedPiece &&
      getPieceValue(movedPiece.type) < getPieceValue(capturedPiece.type)
    ) {
      return false;
    }

    if (!isStrategicallySignificantPawnMove(game, fromSquare, toSquare)) {
      return false;
    }
  }

  if (wasCaptureOfSameOrLowerValuePiece(game, fromSquare, toSquare)) {
    return false;
  }

  if (
    fenTwoMovesAgo &&
    uciMoves &&
    isSimplePieceRecapture(fenTwoMovesAgo, uciMoves)
  ) {
    return false;
  }

  // Threshold for a significant disadvantage
  const disadvantageThreshold = 100;

  // Determines whether the played move is significant compared to other possible continuations
  isMoveSignificant(lines, playedMove, isWhiteMove, disadvantageThreshold);

  const nonLosingLines = isWhiteMove
    ? lines.filter((line) => line.cp !== undefined && line.cp >= -100)
    : lines.filter((line) => line.cp !== undefined && line.cp <= 100);

  const bestLine = lines[0];
  const otherLines = lines.slice(1);
  const significantGap = otherLines.every(
    (line) =>
      line.cp !== undefined &&
      Math.abs(bestLine.cp! - line.cp) > disadvantageThreshold,
  );

  if (!significantGap || nonLosingLines[0].pv[0] !== playedMove) {
    return false;
  }

  return true;
};

// Helper function to check if a pawn move is strategically significant
const isStrategicallySignificantPawnMove = (
  game: Chess,
  fromSquare: Square,
  toSquare: Square,
): boolean => {
  const movedPawn = game.get(fromSquare);
  if (!movedPawn || movedPawn.type !== "p") return false;

  const gameCopy = new Chess(game.fen());
  gameCopy.move({
    from: fromSquare,
    to: toSquare,
  });

  if (createsPassedPawn(gameCopy, toSquare)) return true;
  if (controlsCriticalSquare(toSquare)) return true;
  if (opensLinesForPieces(game, fromSquare, toSquare)) return true;
  if (restrictsOpponentPieces(gameCopy, toSquare)) return true;

  return false;
};

// Helper functions for evaluating pawn moves and strategic gains
const createsPassedPawn = (game: Chess, toSquare: Square): boolean => {
  const file = toSquare[0];
  const rank = parseInt(toSquare[1], 10);
  const isWhite = rank > 4;
  const opponentPawnRankRange = isWhite ? [rank + 1, 8] : [1, rank - 1];

  const filesToCheck = [file];
  if (file > "a")
    filesToCheck.push(String.fromCharCode(file.charCodeAt(0) - 1));
  if (file < "h")
    filesToCheck.push(String.fromCharCode(file.charCodeAt(0) + 1));

  for (const f of filesToCheck) {
    for (let r = opponentPawnRankRange[0]; r <= opponentPawnRankRange[1]; r++) {
      const square = `${f}${r}` as Square;
      const piece = game.get(square);
      if (
        piece &&
        piece.type === "p" &&
        piece.color !== (isWhite ? "w" : "b")
      ) {
        return false;
      }
    }
  }
  return true;
};

const controlsCriticalSquare = (toSquare: Square): boolean => {
  const centralSquares = ["d4", "d5", "e4", "e5"];
  return centralSquares.includes(toSquare);
};

const opensLinesForPieces = (
  game: Chess,
  fromSquare: Square,
  toSquare: Square,
): boolean => {
  const originalPosition = game.fen();
  const gameCopy = new Chess(game.fen());
  gameCopy.move({
    from: fromSquare,
    to: toSquare,
  });

  const rooksAndBishops = ["r", "b"];
  for (const piece of rooksAndBishops) {
    const squares = gameCopy
      .board()
      .flat()
      .filter((p) => p && p.type === piece);
    for (const square of squares) {
      if (
        square &&
        gameCopy.moves({
          square: square.square,
        }).length > 0
      ) {
        gameCopy.load(originalPosition); // Restore original game state
        return true;
      }
    }
  }
  gameCopy.load(originalPosition); // Restore original game state
  return false;
};

const restrictsOpponentPieces = (game: Chess, toSquare: Square): boolean => {
  const gameCopy = new Chess(game.fen());
  const opponentMovesBefore = gameCopy.moves({
    verbose: true,
  }).length;

  const validMoves = gameCopy.moves({
    verbose: true,
  });
  const move = validMoves.find((m) => m.to === toSquare);

  if (!move) {
    return false;
  }

  gameCopy.move({
    from: move.from,
    to: move.to,
  });

  const opponentMovesAfter = gameCopy.moves({
    verbose: true,
  }).length;
  return opponentMovesAfter < opponentMovesBefore;
};

export default getMovesClassification;
