import { PositionEval } from "../../types/eval";
import {
  analyzeWithNewCustomEngine,
  clearNewCustomEngineSearchCache,
} from "./search/search";
import {
  DEFAULT_SEARCH_CONFIG,
  SearchConfig,
} from "./search/types";

export interface EngineExperimentCase {
  name: string;
  config: Partial<SearchConfig>;
}

export interface EngineExperimentResult {
  name: string;
  config: SearchConfig;
  bestMove?: string;
  scoreCp?: number;
  mate?: number;
  depth: number;
  elapsedMs: number;
  nodes: number;
  nodesPerSecond: number;
  quiescenceNodes: number;
  transpositionHits: number;
  cutoffs: number;
}

/** Gotowe warianty do tabeli porównawczej w pracy inżynierskiej. */
export const STANDARD_EXPERIMENTS: EngineExperimentCase[] = [
  { name: "pełna konfiguracja", config: {} },
  { name: "bez alfa-beta", config: { useAlphaBeta: false, useTranspositionTable: false } },
  { name: "bez sortowania ruchów", config: { useMoveOrdering: false } },
  { name: "bez tablicy transpozycji", config: { useTranspositionTable: false } },
  { name: "bez quiescence search", config: { useQuiescence: false } },
  { name: "ocena materialna", config: { evaluation: "material" } },
];

/**
 * Uruchamia identyczne wyszukiwanie dla wielu konfiguracji.
 * Czyszczenie TT przed każdym wariantem eliminuje skażenie wyników cache'em.
 */
export async function runEngineExperiments(
  fen: string,
  depth: number,
  cases: EngineExperimentCase[] = STANDARD_EXPERIMENTS,
): Promise<EngineExperimentResult[]> {
  const results: EngineExperimentResult[] = [];

  for (const experiment of cases) {
    clearNewCustomEngineSearchCache();
    const position: PositionEval = await analyzeWithNewCustomEngine({
      fen,
      depth,
      multiPv: 1,
      config: experiment.config,
    });
    const line = position.lines[0];
    const benchmark = position.benchmark;

    results.push({
      name: experiment.name,
      config: { ...DEFAULT_SEARCH_CONFIG, ...experiment.config },
      bestMove: position.bestMove,
      scoreCp: line?.cp,
      mate: line?.mate,
      depth: benchmark?.depth ?? depth,
      elapsedMs: benchmark?.elapsedMs ?? 0,
      nodes: benchmark?.nodes ?? 0,
      nodesPerSecond: benchmark?.nodesPerSecond ?? 0,
      quiescenceNodes: benchmark?.quiescenceNodes ?? 0,
      transpositionHits: benchmark?.transpositionHits ?? 0,
      cutoffs: benchmark?.cutoffs ?? 0,
    });
  }

  return results;
}

export function experimentResultsToCsv(results: EngineExperimentResult[]): string {
  const columns = [
    "name", "bestMove", "scoreCp", "mate", "depth", "elapsedMs", "nodes",
    "nodesPerSecond", "quiescenceNodes", "transpositionHits", "cutoffs",
  ];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  return [
    columns.join(","),
    ...results.map((result) => columns.map((column) => escape(result[column as keyof EngineExperimentResult])).join(",")),
  ].join("\n");
}
