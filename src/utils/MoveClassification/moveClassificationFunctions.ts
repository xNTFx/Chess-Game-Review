import { Chess, PieceSymbol, Square } from "chess.js";

import { LineEval } from "../../types/eval";
import {
  getMaterialDifference,
  getPieceValue,
  uciMoveParams,
} from "../chessUtils";

// Function to determine if a simple recapture occurred at the same square
export const isSimplePieceRecapture = (
  fen: string,
  uciMoves: [string, string],
): boolean => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));

  // Check if both moves target the same square
  if (moves[0].to !== moves[1].to) return false;

  // Verify if a piece exists at the square being recaptured
  const piece = game.get(moves[0].to);
  return !!piece;
};

// Function to check if a move is a sacrifice
export const getIsPieceSacrifice = (
  fen: string,
  playedMove: string,
): boolean => {
  const game = new Chess(fen);
  const fromSquare = playedMove.slice(0, 2) as Square;
  const toSquare = playedMove.slice(2, 4) as Square;
  const movedPiece = game.get(fromSquare);

  if (!movedPiece) return false; // If no piece is found, it cannot be a sacrifice

  // Handle pawn promotion
  const promotion =
    movedPiece.type === "p" && (toSquare[1] === "1" || toSquare[1] === "8")
      ? "q"
      : undefined;

  // Simulate the move on a copy of the game state
  const copyGame = game;
  const moveResult = copyGame.move({
    from: fromSquare,
    to: toSquare,
    promotion,
  });
  if (!moveResult) return false;

  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);
  const endingMaterialDifference = getMaterialDifference(game.fen());

  // Calculate material difference
  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const valueOfCapturedPiece = whiteToPlay ? -materialDiff : materialDiff;
  const pieceValue = getPieceValue(movedPiece.type);

  // Calculate the values of attackers and defenders
  const { attackingPieces, attackersArray } = getAttackers(
    game,
    toSquare,
    movedPiece.color,
  );

  // Pawns are not considered sacrifices
  if (movedPiece.type === "p") return false;

  // If there are no attackers, it's not a sacrifice
  if (attackingPieces.length === 0) return false;

  // Check if the piece is being sacrificed
  if (
    valueOfCapturedPiece < pieceValue &&
    attackersArray[0] < valueOfCapturedPiece + pieceValue
  ) {
    return true;
  }

  // Check if the opponent can capture a higher-value piece
  if (
    canOpponentCaptureHigherValuePiece(
      game,
      pieceValue,
      movedPiece.color,
      valueOfCapturedPiece,
      playedMove,
    )
  ) {
    return true;
  }

  // Check if the player can capture an equal or higher-value piece in response
  if (
    canICaptureHigherOrEqualValuePieceWhenOpponentTakes(
      game,
      movedPiece.color,
      toSquare,
      playedMove,
    )
  ) {
    return false;
  }

  // Final check based on attacker value
  if (
    valueOfCapturedPiece < attackersArray[0] &&
    pieceValue > valueOfCapturedPiece
  )
    return true;

  return false;
};

// Helper function to check if the opponent can capture a higher-value piece
const canOpponentCaptureHigherValuePiece = (
  game: Chess,
  pieceValue: number,
  playerColor: string,
  previousCaptureValue: number,
  playedMove: string,
): boolean => {
  const opponentColor = playerColor === "w" ? "b" : "w";
  const opponentMoves = game.moves({
    verbose: true,
  });

  return opponentMoves.some((move) => {
    if (move.color === opponentColor && move.to !== playedMove.slice(2, 4)) {
      const capturingPiece = game.get(move.from);
      const targetPiece = game.get(move.to);
      if (capturingPiece && targetPiece) {
        const targetPieceValue = getPieceValue(targetPiece.type);

        // Check if the opponent can capture a higher-value piece
        return targetPieceValue > pieceValue + previousCaptureValue;
      }
    }
    return false;
  });
};

// Helper function to check if the player can capture an equal or higher-value piece in response
const canICaptureHigherOrEqualValuePieceWhenOpponentTakes = (
  game: Chess,
  playerColor: string,
  captureSquare: Square,
  playedMove: string,
): boolean => {
  const gameCopy = new Chess(game.fen());
  const toSquare = playedMove.slice(2, 4) as Square;
  const capturedPieceValue = getPieceValue(gameCopy.get(toSquare).type);

  const opponentColor = playerColor === "w" ? "b" : "w";
  const opponentMoves = gameCopy.moves({
    verbose: true,
  });

  let lowestValueCapturingMove = null;
  for (const move of opponentMoves) {
    if (move.to === captureSquare && move.color === opponentColor) {
      const capturingPiece = gameCopy.get(move.from);
      if (capturingPiece) {
        const capturingPieceValue = getPieceValue(capturingPiece.type);
        if (
          !lowestValueCapturingMove ||
          capturingPieceValue <
            getPieceValue(gameCopy.get(lowestValueCapturingMove.from).type)
        ) {
          lowestValueCapturingMove = move;
        }
      }
    }
  }

  if (!lowestValueCapturingMove) return false;

  // Simulate the opponent's move
  gameCopy.move({
    from: lowestValueCapturingMove.from,
    to: lowestValueCapturingMove.to,
  });

  // const lowestValuePieceValue = getPieceValue(
  //   gameCopy.get(lowestValueCapturingMove.to).type
  // );

  // Switch back to the player's turn and check for a favorable response
  const playerMoves = gameCopy.moves({
    verbose: true,
  });
  return playerMoves.some((move) => {
    const targetPiece = gameCopy.get(move.to);
    if (targetPiece && targetPiece.color === opponentColor) {
      const targetPieceValue = getPieceValue(targetPiece.type);

      // Evaluate if the player's response move results in a favorable exchange
      return targetPieceValue >= capturedPieceValue;
    }
    return false;
  });
};

// Function to get attackers and their total value
export const getAttackers = (game: Chess, square: Square, color: string) => {
  const opponentColor = color === "w" ? "b" : "w";
  let totalValue = 0;
  const array: number[] = [];
  const attackingPieces: {
    square: Square;
    type: PieceSymbol;
  }[] = [];

  ALL_SQUARES.forEach((sqr) => {
    const piece = game.get(sqr);
    if (piece && piece.color === opponentColor) {
      const moves = game.moves({
        square: sqr,
        verbose: true,
      });
      if (moves.some((move) => move.to === square)) {
        totalValue += getPieceValue(piece.type);
        array.push(getPieceValue(piece.type));
        attackingPieces.push({
          square: sqr,
          type: piece.type,
        });
      }
    }
  });

  const attackersArray = array.sort((a, b) => a - b);
  return {
    totalValue,
    attackingPieces,
    attackersArray,
  };
};

// Function to get defenders and their total value
export const getDefenders = (game: Chess, square: Square, color: string) => {
  let totalValue = 0;
  const array: number[] = [];
  const defendingPieces: {
    square: Square;
    type: PieceSymbol;
  }[] = [];

  const fen = game.fen();
  const fenParts = fen.split(" ");
  fenParts[1] = fenParts[1] === "w" ? "b" : "w";
  const newFen = fenParts.join(" ");

  const gameCopy = new Chess(newFen);
  gameCopy.remove(square);

  ALL_SQUARES.forEach((sqr) => {
    const piece = gameCopy.get(sqr);
    if (piece && piece.color === color) {
      if (piece.type === "p") {
        const pawnDefends = getPawnDefenseSquares(sqr, color);
        if (pawnDefends.includes(square)) {
          totalValue += getPieceValue(piece.type);
          array.push(getPieceValue(piece.type));
          defendingPieces.push({
            square: sqr,
            type: piece.type,
          });
        }
      } else {
        const moves = gameCopy.moves({
          square: sqr,
          verbose: true,
        });
        if (moves.some((move) => move.to === square)) {
          totalValue += getPieceValue(piece.type);
          array.push(getPieceValue(piece.type));
          defendingPieces.push({
            square: sqr,
            type: piece.type,
          });
        }
      }
    }
  });

  const defendersArray = array.sort((a, b) => a - b);
  return {
    totalValue,
    defendingPieces,
    defendersArray,
  };
};

// Helper function to calculate the squares a pawn defends
const getPawnDefenseSquares = (sqr: Square, color: string): Square[] => {
  const file = sqr[0];
  const rank = parseInt(sqr[1]);
  const defendedSquares: Square[] = [];

  if (color === "w") {
    // White pawns defend diagonally up
    defendedSquares.push(
      (String.fromCharCode(file.charCodeAt(0) - 1) + (rank + 1)) as Square,
      (String.fromCharCode(file.charCodeAt(0) + 1) + (rank + 1)) as Square,
    );
  } else {
    // Black pawns defend diagonally down
    defendedSquares.push(
      (String.fromCharCode(file.charCodeAt(0) - 1) + (rank - 1)) as Square,
      (String.fromCharCode(file.charCodeAt(0) + 1) + (rank - 1)) as Square,
    );
  }

  return defendedSquares;
};

// Determines whether the played move is significant compared to other possible continuations
export function isMoveSignificant(
  lines: LineEval[],
  playedMove: string,
  isWhiteMove: boolean,
  disadvantageThreshold: number,
) {
  if (lines.length === 0) return false;

  // Filter lines to only include non-losing moves for the current player
  const nonLosingLines = isWhiteMove
    ? lines.filter(
        (line) => line.cp !== undefined && line.cp >= -disadvantageThreshold,
      )
    : lines.filter(
        (line) => line.cp !== undefined && line.cp <= disadvantageThreshold,
      );

  // Identify the best line (highest evaluation) and separate the remaining lines
  const bestLine = lines[0];
  const bestLineCp = bestLine.cp;

  if (bestLineCp === undefined || nonLosingLines.length === 0) return false;

  const otherLines = lines.slice(1);

  // Check if there is a significant gap between the best line and all other lines
  const significantGap = otherLines.every(
    (line) =>
      line.cp !== undefined &&
      Math.abs(bestLineCp - line.cp) > disadvantageThreshold,
  );

  // Return true only if there is a significant gap and the first move
  // in the non-losing lines matches the played move
  return significantGap && nonLosingLines[0].pv[0] === playedMove;
}

// All possible chessboard squares
// prettier-ignore
const ALL_SQUARES: Square[] = [
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8",
  "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
  "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
  "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8",
  "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
  "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8",
  "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"
];
