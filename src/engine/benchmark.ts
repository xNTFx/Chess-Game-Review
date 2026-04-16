import { EngineName, MoveClassification } from "../types/enums";
import { EvaluationBenchmark, PositionEval } from "../types/eval";

interface BuildBenchmarkParams {
  engine: EngineName;
  positions: PositionEval[];
  requestedDepth: number;
  requestedMultiPv: number;
  startedAt: number;
  endedAt: number;
}

const emptyClassificationCounts = (): Record<MoveClassification, number> => ({
  [MoveClassification.Blunder]: 0,
  [MoveClassification.Missed_win]: 0,
  [MoveClassification.Mistake]: 0,
  [MoveClassification.Inaccuracy]: 0,
  [MoveClassification.Good]: 0,
  [MoveClassification.Excellent]: 0,
  [MoveClassification.Best]: 0,
  [MoveClassification.Book]: 0,
  [MoveClassification.Great]: 0,
  [MoveClassification.Brilliant]: 0,
});

export function buildEvaluationBenchmark({
  engine,
  positions,
  requestedDepth,
  requestedMultiPv,
  startedAt,
  endedAt,
}: BuildBenchmarkParams): EvaluationBenchmark {
  const elapsedMs = Math.max(0, endedAt - startedAt);
  const positionBenchmarks = positions.flatMap((position) =>
    position.benchmark ? [position.benchmark] : [],
  );
  const nodes = positionBenchmarks.reduce(
    (sum, benchmark) => sum + benchmark.nodes,
    0,
  );
  const quiescenceNodes = positionBenchmarks.reduce(
    (sum, benchmark) => sum + (benchmark.quiescenceNodes ?? 0),
    0,
  );
  const transpositionHits = positionBenchmarks.reduce(
    (sum, benchmark) => sum + (benchmark.transpositionHits ?? 0),
    0,
  );
  const cutoffs = positionBenchmarks.reduce(
    (sum, benchmark) => sum + (benchmark.cutoffs ?? 0),
    0,
  );
  const effectiveDepth =
    positionBenchmarks.length > 0
      ? Math.max(...positionBenchmarks.map((benchmark) => benchmark.depth))
      : requestedDepth;
  const classificationCounts = emptyClassificationCounts();

  positions.forEach((position) => {
    if (position.moveClassification) {
      classificationCounts[position.moveClassification] += 1;
    }
  });

  const elapsedSeconds = elapsedMs / 1000;
  const nodesPerSecond =
    elapsedSeconds > 0 ? Math.round(nodes / elapsedSeconds) : 0;
  const analyzedPositions = positions.length;

  return {
    engine,
    analyzedPositions,
    requestedDepth,
    effectiveDepth,
    requestedMultiPv,
    elapsedMs,
    nodes,
    nodesPerSecond,
    averageMsPerPosition:
      analyzedPositions > 0 ? elapsedMs / analyzedPositions : 0,
    positionsPerSecond:
      elapsedSeconds > 0 ? analyzedPositions / elapsedSeconds : 0,
    quiescenceNodes,
    transpositionHits,
    cutoffs,
    classificationCounts,
  };
}
