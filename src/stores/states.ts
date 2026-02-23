import { Chess } from "chess.js";
import { atom } from "jotai";

import { EngineName } from "../types/enums";
import {
  CurrentPosition,
  GameEval,
  LiveEvalEntry,
  SavedEvals,
} from "../types/eval";

// Game state atoms
export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());

// Writable atoms for current move index and live engine evaluations
export const currentMoveIdxAtom = atom(0);
export const liveEvalCacheAtom = atom<Record<string, LiveEvalEntry>>({});

// Derived read-only atom — computes CurrentPosition from board/game/eval state
export const currentPositionAtom = atom<CurrentPosition>((get) => {
  const board = get(boardAtom);
  const game = get(gameAtom);
  const gameEval = get(gameEvalAtom);
  const currentMoveIdx = get(currentMoveIdxAtom);
  const liveEvalCache = get(liveEvalCacheAtom);

  const boardHistory = board.history();
  const gameHistory = game.history();

  const position: CurrentPosition = {
    lastMove: board.history({ verbose: true }).at(-1),
    currentMoveIdx,
  };

  // Sync with game evaluation if board history matches game history
  if (
    boardHistory.length <= gameHistory.length &&
    gameHistory.slice(0, boardHistory.length).join() === boardHistory.join() &&
    gameEval
  ) {
    const evalIndex = boardHistory.length;
    position.eval = gameEval.positions[evalIndex];
    position.lastEval =
      evalIndex > 0 ? gameEval.positions[evalIndex - 1] : undefined;
  }

  // Override with live engine evaluation if available
  const cachedEval = liveEvalCache[board.fen()];
  if (cachedEval) {
    position.eval = cachedEval.eval;
    if (cachedEval.lastEval) position.lastEval = cachedEval.lastEval;
  }

  return position;
});

// UI settings atoms
export const boardOrientationAtom = atom(true);
export const isShowArrowBestMoveEnabledAtom = atom(true);
export const isShowMoveClassificationEnabledAtom = atom(true);

// Engine settings atoms
export const engineNameAtom = atom<EngineName>(EngineName.Stockfish16_1Lite);
export const engineDepthAtom = atom(16);
export const engineMultiPvAtom = atom(3);
export const evaluationProgressAtom = atom<number | null>(null);

// User interaction atoms
export const currentTabAtom = atom(0);
export const howManyTimesPlayerMovedByBoardAtom = atom(0);

// Move and square tracking atoms
export const clickedSquaresAtom = atom<string[]>([]);
export const playableSquaresAtom = atom<string[]>([]);

// Saved evaluations atom
export const savedEvalsAtom = atom<SavedEvals>({});
