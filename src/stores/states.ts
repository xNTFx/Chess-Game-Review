import { EngineName } from "../types/enums";
import { CurrentPosition, GameEval, SavedEvals } from "../types/eval";
import { Chess, Square } from "chess.js";
import { atom } from "jotai";

// Game state atoms
export const gameEvalAtom = atom<GameEval | undefined>(undefined);
export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

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
export const clickedSquaresAtom = atom<Square[]>([]);
export const playableSquaresAtom = atom<Square[]>([]);

// Saved evaluations atom
export const savedEvalsAtom = atom<SavedEvals>({});
