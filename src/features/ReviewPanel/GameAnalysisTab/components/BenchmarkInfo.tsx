import { useAtomValue } from "jotai";

import { gameEvalAtom } from "../../../../stores/states";
import { EngineName } from "../../../../types/enums";

const engineLabels: Record<EngineName, string> = {
  [EngineName.Stockfish16_1Lite]: "Stockfish 16.1 Lite",
  [EngineName.Stockfish11]: "Stockfish 11",
  [EngineName.Custom]: "Custom engine",
};

export default function BenchmarkInfo() {
  const evaluation = useAtomValue(gameEvalAtom);
  const benchmark = evaluation?.benchmark;

  if (!benchmark) return null;

  const classifiedMoves = Object.values(benchmark.classificationCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="grid w-full grid-cols-2 gap-2 text-xs md:grid-cols-5">
      <BenchmarkValue label="Engine" value={engineLabels[benchmark.engine]} />
      <BenchmarkValue
        label="Depth"
        value={
          benchmark.effectiveDepth === benchmark.requestedDepth
            ? `${benchmark.effectiveDepth}`
            : `${benchmark.effectiveDepth} of ${benchmark.requestedDepth}`
        }
      />
      <BenchmarkValue
        label="Positions"
        value={benchmark.analyzedPositions.toString()}
      />
      <BenchmarkValue label="Moves" value={classifiedMoves.toString()} />
      <BenchmarkValue
        label="Time"
        value={formatDuration(benchmark.elapsedMs)}
      />
      <BenchmarkValue
        label="Avg position"
        value={formatDuration(benchmark.averageMsPerPosition)}
      />
      <BenchmarkValue label="Nodes" value={benchmark.nodes.toLocaleString()} />
      <BenchmarkValue
        label="Nodes/s"
        value={benchmark.nodesPerSecond.toLocaleString()}
      />
      <BenchmarkValue
        label="TT hits"
        value={benchmark.transpositionHits.toLocaleString()}
      />
      <BenchmarkValue
        label="Cutoffs"
        value={benchmark.cutoffs.toLocaleString()}
      />
    </div>
  );
}

function BenchmarkValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-slate-900 p-2 text-center">
      <div className="text-gray-300">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;

  return `${(ms / 1000).toFixed(1)}s`;
}
