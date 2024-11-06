import { clamp } from "lodash";

import { LineEval, PositionEval } from "../types/eval";

export const getPositionWinPercentage = (position: PositionEval): number => {
  if (!position.lines || position.lines.length === 0) {
    throw new Error("No lines available in the position");
  }
  return getLineWinPercentage(position.lines[0]);
};

export const getLineWinPercentage = (line: LineEval): number => {
  if (line.cp !== undefined) {
    return getWinPercentageFromCp(line.cp);
  }

  if (line.mate !== undefined) {
    return getWinPercentageFromMate(line.mate);
  }

  throw new Error("No cp or mate in line");
};

const getWinPercentageFromMate = (mate: number): number => {
  const mateInf = mate * Infinity;
  return getWinPercentageFromCp(mateInf);
};

const getWinPercentageFromCp = (cp: number): number => {
  const cpCeiled = clamp(cp, -1000, 1000);
  const MULTIPLIER = -0.00368208;
  const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
  return 50 + 50 * winChances;
};
