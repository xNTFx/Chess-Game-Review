import { Chess, Move } from "chess.js";
import { PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

import {
  clickedSquaresAtom,
  currentPositionAtom,
  howManyTimesPlayerMovedByBoardAtom,
  playableSquaresAtom,
} from "../stores/states";
import {
  playGameEndSound,
  playIllegalMoveSound,
  playSoundFromMove,
} from "../utils/soundEffects";

export interface resetGameParams {
  fen?: string;
  whiteName?: string;
  blackName?: string;
}

export const useChessActions = (chessAtom: PrimitiveAtom<Chess>) => {
  const [game, setGame] = useAtom(chessAtom);
  const [, setCurrentPosition] = useAtom(currentPositionAtom);
  const [howManyTimesPlayerMovedByBoard, setHowManyTimesPlayerMovedByBoard] =
    useAtom(howManyTimesPlayerMovedByBoardAtom);
  const setClickedSquares = useSetAtom(clickedSquaresAtom);
  const setPlayableSquares = useSetAtom(playableSquaresAtom);

  const setPgn = useCallback(
    (pgn: string) => {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      setCurrentPosition((prev) => ({
        ...prev,
        currentMoveIdx: 0,
      }));

      setHowManyTimesPlayerMovedByBoard(0);
      setClickedSquares([]);
      setPlayableSquares([]);

      setGame(newGame);
    },
    [
      setGame,
      setCurrentPosition,
      setHowManyTimesPlayerMovedByBoard,
      setClickedSquares,
      setPlayableSquares,
    ],
  );

  const resetBoardPosition = useCallback(
    (params?: resetGameParams) => {
      const newGame = new Chess(params?.fen);
      setCurrentPosition((prev) => ({
        ...prev,
        currentMoveIdx: 0,
      }));

      setHowManyTimesPlayerMovedByBoard(0);
      setClickedSquares([]);
      setPlayableSquares([]);

      setGame(newGame);
    },
    [
      setGame,
      setCurrentPosition,
      setHowManyTimesPlayerMovedByBoard,
      setClickedSquares,
      setPlayableSquares,
    ],
  );

  const copyGame = useCallback(() => {
    const newGame = new Chess();

    if (game.history().length === 0) {
      const pgnSplitted = game.pgn().split("]");
      if (pgnSplitted.at(-1)?.includes("1-0")) {
        newGame.loadPgn(pgnSplitted.slice(0, -1).join("]") + "]");
        return newGame;
      }
    }

    newGame.loadPgn(game.pgn());
    return newGame;
  }, [game]);

  const makeMove = useCallback(
    (
      move: {
        from: string;
        to: string;
        promotion?: string;
      },
      isPlayerMove = false,
    ): Move | null => {
      const newGame = copyGame();
      try {
        const result = newGame.move(move);
        if (!isPlayerMove) {
          setCurrentPosition((prev) => ({
            ...prev,
            currentMoveIdx: newGame.history().length,
          }));
        } else {
          setHowManyTimesPlayerMovedByBoard((prev) => (prev += 1));
        }
        setClickedSquares([]);
        setPlayableSquares([]);
        setGame(newGame);
        playSoundFromMove(result);
        return result;
      } catch {
        playIllegalMoveSound();
        return null;
      }
    },
    [
      copyGame,
      setGame,
      setCurrentPosition,
      setHowManyTimesPlayerMovedByBoard,
      setClickedSquares,
      setPlayableSquares,
    ],
  );

  const makeMovesFromLine = useCallback(
    (
      moves: Array<{
        from: string;
        to: string;
        promotion?: string;
      }>,
      isPlayerMove = false,
    ): boolean => {
      const newGame = copyGame();
      let lastMoveResult: Move | null = null;

      try {
        moves.forEach((move) => {
          lastMoveResult = newGame.move(move);
          if (!lastMoveResult)
            throw new Error(`Invalid move: ${JSON.stringify(move)}`);
        });

        if (!isPlayerMove) {
          setCurrentPosition((prev) => ({
            ...prev,
            currentMoveIdx: newGame.history().length,
          }));
        } else {
          setHowManyTimesPlayerMovedByBoard((prev) => prev + 1);
        }
        setClickedSquares([]);
        setPlayableSquares([]);
        setGame(newGame);

        if (lastMoveResult) {
          playSoundFromMove(lastMoveResult);
        }

        return true;
      } catch (error) {
        console.error("Error in makeMovesFromLine:", error);
        playIllegalMoveSound();
        return false;
      }
    },
    [
      copyGame,
      setGame,
      setCurrentPosition,
      setHowManyTimesPlayerMovedByBoard,
      setClickedSquares,
      setPlayableSquares,
    ],
  );

  const undoMove = useCallback(() => {
    const newGame = copyGame();
    newGame.undo();

    if (howManyTimesPlayerMovedByBoard <= 0) {
      setCurrentPosition((prev) => ({
        ...prev,
        currentMoveIdx: newGame.history().length,
      }));
    } else {
      setHowManyTimesPlayerMovedByBoard((prev) => (prev -= 1));
    }
    setClickedSquares([]);
    setPlayableSquares([]);

    setGame(newGame);
  }, [
    copyGame,
    setGame,
    setCurrentPosition,
    howManyTimesPlayerMovedByBoard,
    setHowManyTimesPlayerMovedByBoard,
    setClickedSquares,
    setPlayableSquares,
  ]);

  const goToMove = useCallback(
    (moveIdx: number, fullGame: Chess) => {
      if (moveIdx < 0) return;

      const newGame = new Chess();
      newGame.loadPgn(fullGame.pgn());

      const movesNb = fullGame.history().length;
      if (moveIdx > movesNb) return;

      let lastMove: Move | null = null;
      for (let i = movesNb; i > moveIdx; i--) {
        lastMove = newGame.undo();
      }

      setCurrentPosition((prev) => ({
        ...prev,
        currentMoveIdx: newGame.history().length,
      }));

      setHowManyTimesPlayerMovedByBoard(0);
      setClickedSquares([]);
      setPlayableSquares([]);

      setGame(newGame);
      if (lastMove) {
        playSoundFromMove(lastMove);
      } else {
        playGameEndSound();
      }
    },
    [
      setGame,
      setCurrentPosition,
      setHowManyTimesPlayerMovedByBoard,
      setClickedSquares,
      setPlayableSquares,
    ],
  );

  return {
    setPgn,
    resetBoardPosition,
    makeMove,
    makeMovesFromLine,
    undoMove,
    goToMove,
  };
};
