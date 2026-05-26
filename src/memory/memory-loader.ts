/**
 * Memory entry relevance loader.
 *
 * Role: NOT a disk loader. Despite the `-loader` suffix this module operates
 * exclusively on in-memory `MemoryEntry[]` arrays and a `TaskContext`. It
 * performs relevance scoring and token-budget allocation; it does not import
 * `node:fs` and never touches the filesystem.
 *
 * Filename matches the `*loader*.ts` audit-rule pattern only because of the
 * shared semantic "load relevant memories." Intentionally bypasses the
 * `LoaderContext` chokepoint (src/security/loader-context.ts) — there is no
 * disk surface to gate.
 *
 * @module memory/memory-loader
 */

import {
  MemoryEntry,
  RelevanceScore,
  TaskContext,
  scoreMemoryRelevance,
} from './relevance-scorer.js';

export interface LoadOptions {
  threshold?: number;
  tokenBudget?: number;
}

export interface LoadResult {
  entries: MemoryEntry[];
  scores: RelevanceScore[];
  totalTokens: number;
  budgetTokens: number;
  droppedForBudget: string[];
}

const DEFAULT_THRESHOLD = 0.3;
const DEFAULT_BUDGET = 2000;

export function loadRelevantMemories(
  entries: MemoryEntry[],
  ctx: TaskContext,
  opts: LoadOptions = {},
): MemoryEntry[] {
  return loadRelevantMemoriesDetailed(entries, ctx, opts).entries;
}

export function loadRelevantMemoriesDetailed(
  entries: MemoryEntry[],
  ctx: TaskContext,
  opts: LoadOptions = {},
): LoadResult {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const budget = opts.tokenBudget ?? DEFAULT_BUDGET;

  const scores = scoreMemoryRelevance(entries, ctx);
  const byId = new Map(entries.map((e) => [e.id, e] as const));

  const alwaysLoad: MemoryEntry[] = [];
  const candidates: { entry: MemoryEntry; score: number }[] = [];

  for (const s of scores) {
    const entry = byId.get(s.entryId);
    if (!entry) continue;
    if (s.score >= 1.0 && s.reason.startsWith('always-load')) {
      alwaysLoad.push(entry);
      continue;
    }
    if (s.score >= threshold) {
      candidates.push({ entry, score: s.score });
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.id.localeCompare(b.entry.id);
  });

  const chosen: MemoryEntry[] = [...alwaysLoad];
  let total = alwaysLoad.reduce((n, e) => n + e.tokenCount, 0);
  const dropped: string[] = [];

  for (const { entry } of candidates) {
    if (total + entry.tokenCount > budget) {
      dropped.push(entry.id);
      continue;
    }
    chosen.push(entry);
    total += entry.tokenCount;
  }

  return {
    entries: chosen,
    scores,
    totalTokens: total,
    budgetTokens: budget,
    droppedForBudget: dropped,
  };
}
