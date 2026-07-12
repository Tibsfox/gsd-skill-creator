/**
 * Review queue for sources the integrity-audit gate (ingest-gate.ts) flagged or
 * blocked at ingest. A plain JSON array on disk — the operator triages it out of
 * band (mirrors the correction-quarantine pattern: nothing here is auto-applied).
 *
 * Not a chokepoint basename (loader|reader|scanner|walker|store), so the direct
 * node:fs use here is in-scope by the LoaderContext audit convention.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { GateVerdict } from './ingest-gate.js';

// ============================================================================
// Types
// ============================================================================

/** One entry in the review queue: a source the gate did not pass. */
export interface ReviewQueueItem {
  sourceId: string;
  /** Only non-passing verdicts are queued. */
  action: 'flag' | 'block';
  reasons: string[];
  /** Which ingest path routed it here (e.g. 'arxiv-bridge', 'sc-learn'). */
  origin: string;
  queuedAt: string;
  /** Origin-specific context (title, rank, doi, ...) for the human triager. */
  detail?: Record<string, unknown>;
}

// ============================================================================
// Verdict → queue item
// ============================================================================

/**
 * Convert a non-passing gate verdict into a review-queue item. Returns null for
 * a passing verdict so callers can map over verdicts unconditionally.
 */
export function verdictToReviewItem(
  verdict: GateVerdict,
  origin: string,
  detail?: Record<string, unknown>,
  now: Date = new Date(),
): ReviewQueueItem | null {
  if (verdict.action === 'pass') return null;
  return {
    sourceId: verdict.sourceId,
    action: verdict.action,
    reasons: verdict.reasons,
    origin,
    queuedAt: now.toISOString(),
    detail,
  };
}

// ============================================================================
// Persistence
// ============================================================================

/** Read the review queue at `queuePath`; missing/malformed file → empty. */
export function readReviewQueue(queuePath: string): ReviewQueueItem[] {
  if (!fs.existsSync(queuePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(queuePath, 'utf-8'));
    return Array.isArray(parsed) ? (parsed as ReviewQueueItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Append `items` to the review queue, deduping by `sourceId::action` so a re-run
 * over the same source does not pile up duplicates (a later item replaces an
 * earlier one with the same key). Creates parent dirs. Returns the full queue.
 */
export function appendReviewItems(
  queuePath: string,
  items: ReviewQueueItem[],
): ReviewQueueItem[] {
  const existing = readReviewQueue(queuePath);
  const byKey = new Map<string, ReviewQueueItem>();
  for (const item of [...existing, ...items]) {
    byKey.set(`${item.sourceId}::${item.action}`, item);
  }
  const merged = Array.from(byKey.values());

  fs.mkdirSync(path.dirname(queuePath), { recursive: true });
  fs.writeFileSync(queuePath, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}
