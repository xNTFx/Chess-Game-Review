//https://lichess.org/page/accuracy
import { clamp } from "lodash";

import { Accuracy, PositionEval } from "../types/eval";
import { getPositionWinPercentage } from "./winProbability";

const calculateHarmonicMean = (values: number[]): number => {
  const reciprocalSum = values.reduce((sum, value) => sum + 1 / value, 0);
  return values.length / reciprocalSum;
};

const calculateStandardDeviation = (values: number[]): number => {
  const mean = values.reduce((sum, value) => sum + value) / values.length;
  const variance =
    values
      .map((value) => (value - mean) ** 2)
      .reduce((sum, squaredDiff) => sum + squaredDiff) / values.length;
  return Math.sqrt(variance);
};

const calculateWeightedMean = (values: number[], weights: number[]): number => {
  if (values.length > weights.length) {
    throw new Error("Insufficient weights provided");
  }

  const weightedSum = values.reduce(
    (sum, value, i) => sum + value * weights[i],
    0,
  );
  const totalWeight = weights
    .slice(0, values.length)
    .reduce((sum, weight) => sum + weight, 0);

  return weightedSum / totalWeight;
};

export const computeAccuracy = (positions: PositionEval[]): Accuracy => {
  const winPercentages = positions.map(getPositionWinPercentage);
  const weights = generateAccuracyWeights(winPercentages);
  const moveAccuracies = calculateMoveAccuracies(winPercentages);

  return {
    white: calculatePlayerAccuracy(moveAccuracies, weights, "white"),
    black: calculatePlayerAccuracy(moveAccuracies, weights, "black"),
  };
};

const calculatePlayerAccuracy = (
  moveAccuracies: number[],
  weights: number[],
  player: "white" | "black",
): number => {
  const isWhite = player === "white";
  const playerAccuracies = moveAccuracies.filter(
    (_, i) => i % 2 === (isWhite ? 0 : 1),
  );
  const playerWeights = weights.filter((_, i) => i % 2 === (isWhite ? 0 : 1));

  const weightedMean = calculateWeightedMean(playerAccuracies, playerWeights);
  const harmonicMean = calculateHarmonicMean(playerAccuracies);

  return (weightedMean + harmonicMean) / 2;
};

const generateAccuracyWeights = (winPercentages: number[]): number[] => {
  const windowSize = clamp(Math.ceil(winPercentages.length / 10), 2, 8);
  const halfWindowSize = Math.round(windowSize / 2);

  const weightWindows = winPercentages.map((_, i) => {
    const start = Math.max(0, i - halfWindowSize);
    const end = Math.min(winPercentages.length, i + halfWindowSize);

    return winPercentages.slice(start, end);
  });

  return weightWindows.map((window) => {
    const stdDev = calculateStandardDeviation(window);
    return clamp(stdDev, 0.5, 12);
  });
};

const calculateMoveAccuracies = (winPercentages: number[]): number[] =>
  winPercentages.slice(1).map((current, i) => {
    const previous = winPercentages[i];
    const difference = Math.abs(previous - current);

    const accuracyScore = 103.1668 * Math.exp(-0.04354 * difference) - 3.1669;

    return clamp(accuracyScore + 1, 0, 100);
  });
