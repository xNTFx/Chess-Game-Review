import { SearchContext } from "./types";

export function getSearchTimeLimitMs(depth: number): number {
  if (depth <= 4) return 900;
  if (depth <= 5) return 1400;
  if (depth <= 6) return 2400;
  if (depth <= 7) return 4200;

  return 6500;
}

export function shouldStopSearch(context: SearchContext): boolean {
  if (context.stopped) return true;
  if (context.shouldStop?.()) {
    context.stopped = true;
    return true;
  }

  if (performance.now() - context.startedAt > context.maxTimeMs) {
    context.stopped = true;
    return true;
  }

  return false;
}

export function yieldToWorkerQueue(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}
