import { LineEval, PositionEval } from "../types/eval";

export const parseEvaluationResults = (
  results: string[],
  whiteToPlay: boolean,
): PositionEval => {
  const parsedResults: PositionEval = {
    lines: [],
  };
  const tempResults: Record<string, LineEval> = {};
  let maxDepth = 0;
  let maxNodes = 0;
  let maxTimeMs = 0;
  let latestNodesPerSecond = 0;

  for (const result of results) {
    if (result.startsWith("bestmove")) {
      const bestMove = getResultProperty(result, "bestmove");
      if (bestMove) {
        parsedResults.bestMove = bestMove;
      }
    }

    if (result.startsWith("info")) {
      const pv = getResultPv(result);
      const multiPv = getResultProperty(result, "multipv");
      const depth = getResultProperty(result, "depth");
      if (!pv || !multiPv || !depth) continue;
      maxDepth = Math.max(maxDepth, parseInt(depth));

      if (
        tempResults[multiPv] &&
        parseInt(depth) < tempResults[multiPv].depth
      ) {
        continue;
      }

      const cp = getResultProperty(result, "cp");
      const mate = getResultProperty(result, "mate");

      tempResults[multiPv] = {
        pv,
        cp: cp ? parseInt(cp) : undefined,
        mate: mate ? parseInt(mate) : undefined,
        depth: parseInt(depth),
        multiPv: parseInt(multiPv),
      };

      const nodes = getResultProperty(result, "nodes");
      const time = getResultProperty(result, "time");
      const nps = getResultProperty(result, "nps");

      if (nodes) maxNodes = Math.max(maxNodes, parseInt(nodes));
      if (time) maxTimeMs = Math.max(maxTimeMs, parseInt(time));
      if (nps) latestNodesPerSecond = parseInt(nps);
    }
  }

  parsedResults.lines = Object.values(tempResults).sort(sortLines);

  if (!whiteToPlay) {
    parsedResults.lines = parsedResults.lines.map((line) => ({
      ...line,
      cp: line.cp ? -line.cp : line.cp,
      mate: line.mate ? -line.mate : line.mate,
    }));
  }

  if (maxDepth > 0 || maxNodes > 0 || maxTimeMs > 0) {
    parsedResults.benchmark = {
      depth: maxDepth,
      elapsedMs: maxTimeMs,
      nodes: maxNodes,
      nodesPerSecond:
        latestNodesPerSecond ||
        (maxTimeMs > 0 ? Math.round(maxNodes / (maxTimeMs / 1000)) : 0),
      legalMoves: parsedResults.lines.length,
      quiescenceNodes: 0,
      transpositionHits: 0,
      cutoffs: 0,
    };
  }

  return parsedResults;
};

const sortLines = (a: LineEval, b: LineEval): number => {
  if (a.mate !== undefined && b.mate !== undefined) {
    return a.mate - b.mate;
  }

  if (a.mate !== undefined) {
    return -a.mate;
  }

  if (b.mate !== undefined) {
    return b.mate;
  }

  return (b.cp ?? 0) - (a.cp ?? 0);
};

const getResultProperty = (
  result: string,
  property: string,
): string | undefined => {
  const splitResult = result.split(" ");
  const propertyIndex = splitResult.indexOf(property);

  if (propertyIndex === -1 || propertyIndex + 1 >= splitResult.length) {
    return undefined;
  }

  return splitResult[propertyIndex + 1];
};

const getResultPv = (result: string): string[] | undefined => {
  const splitResult = result.split(" ");
  const pvIndex = splitResult.indexOf("pv");

  if (pvIndex === -1 || pvIndex + 1 >= splitResult.length) {
    return undefined;
  }

  return splitResult.slice(pvIndex + 1);
};
