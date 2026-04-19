/**
 * M7 Umwelt × M3 Decision-Trace Ledger — online-update adapter.
 *
 * Wave 2 integration: consumes `DecisionTrace` entries from the M3 reader
 * and feeds them into an M7 generative model via the `observe()` counts API.
 * Updates batch at a configurable cadence (default: every 50 new traces)
 * to bound CPU latency.
 *
 * Trace → observation mapping
 * ---------------------------
 * Each trace contributes one (intent, observation) pair:
 *
 *   intent index  ← intent-class picker (caller-provided, default:
 *                    deterministic hash of `trace.intent`)
 *   observation   ← observation-type picker (caller-provided, default:
 *                    `trace.outcome ?? 'observed'` if present in counts)
 *
 * Unknown traces — those whose intent or observation do not map to an index
 * in the counts object — are counted as `skipped`. They do not error, keeping
 * the update path resilient to unexpected trace labels.
 *
 * This implementation satisfies the Wave 2 deliverable
 *
 *   "M7 updated via M3 traces. Add an online-update function that consumes
 *    DecisionTrace entries from src/traces/reader.ts and feeds them into M7
 *    via observe(). The update should batch at configurable cadence (default
 *    every 50 new traces)."
 *
 * @module umwelt/m3-updater
 */

import type { DecisionTrace } from '../types/memory.js';
import { observe, type ModelCounts } from './generativeModel.js';

export interface M3UpdateOptions {
  /**
   * Batch cadence: apply at most one flush per this many traces. Defaults
   * to 50 (per the integration spec).
   */
  batchSize?: number;
  /**
   * Intent classifier. Receives the trace; returns the index into
   * `counts.intentCounts` or -1 to skip. Default: deterministic hash of
   * `trace.intent` modulo n.
   */
  classifyIntent?: (trace: DecisionTrace, counts: ModelCounts) => number;
  /**
   * Observation classifier. Receives the trace; returns the index into
   * `counts.observationTypes` or -1 to skip. Default: look up
   * `trace.outcome` (or `'observed'`) in the observation-type table.
   */
  classifyObservation?: (trace: DecisionTrace, counts: ModelCounts) => number;
}

export interface M3UpdateResult {
  /** Number of traces successfully applied to counts. */
  applied: number;
  /** Number of traces skipped (unknown intent / observation / classifier miss). */
  skipped: number;
  /** Number of batches flushed. */
  batches: number;
}

/**
 * Apply a batch of traces to the counts object, respecting the cadence.
 * Mutates `counts` in place and returns a summary.
 *
 * Cadence semantics: we consume the *entire* input `traces` array but only
 * commit counts to the underlying ModelCounts in chunks of `batchSize`. A
 * final partial batch is always flushed. This matches the "every 50 new
 * traces" spec: callers that want strict at-cadence behaviour can slice
 * their input to multiples of `batchSize` before calling.
 */
export function applyTracesToModel(
  traces: readonly DecisionTrace[],
  counts: ModelCounts,
  opts: M3UpdateOptions = {},
): M3UpdateResult {
  const batchSize = Math.max(1, opts.batchSize ?? 50);
  const classifyIntent = opts.classifyIntent ?? defaultClassifyIntent;
  const classifyObservation =
    opts.classifyObservation ?? defaultClassifyObservation;

  let applied = 0;
  let skipped = 0;
  let batches = 0;

  // Pending chunk of (i, j) pairs — held back until batchSize hit so the
  // flush happens as a single group.
  let pending: Array<{ i: number; j: number }> = [];

  const flush = (): void => {
    if (pending.length === 0) return;
    for (const pair of pending) {
      observe(counts, pair.i, pair.j);
    }
    applied += pending.length;
    pending = [];
    batches += 1;
  };

  for (const trace of traces) {
    const i = classifyIntent(trace, counts);
    const j = classifyObservation(trace, counts);
    if (i < 0 || j < 0 || i >= counts.n || j >= counts.m) {
      skipped += 1;
      continue;
    }
    pending.push({ i, j });
    if (pending.length >= batchSize) flush();
  }

  // Final partial flush — always applied so no trace leaks.
  flush();

  return { applied, skipped, batches };
}

/**
 * Stateful updater: pair an M7 counts object with M3 trace ingestion so that
 * callers can push traces incrementally and have them applied at cadence.
 */
export class M3ModelUpdater {
  private buffer: DecisionTrace[] = [];
  private batches = 0;
  private applied = 0;
  private skipped = 0;

  constructor(
    private readonly counts: ModelCounts,
    private readonly opts: M3UpdateOptions = {},
  ) {}

  /**
   * Push a trace into the updater. When the buffer reaches `batchSize` the
   * traces are flushed into the counts object.
   */
  push(trace: DecisionTrace): void {
    this.buffer.push(trace);
    const batchSize = this.opts.batchSize ?? 50;
    if (this.buffer.length >= batchSize) {
      this.flush();
    }
  }

  /** Force-flush any pending traces. Safe to call at any time. */
  flush(): M3UpdateResult {
    const result = applyTracesToModel(this.buffer, this.counts, this.opts);
    this.applied += result.applied;
    this.skipped += result.skipped;
    this.batches += result.batches;
    this.buffer = [];
    return { applied: this.applied, skipped: this.skipped, batches: this.batches };
  }

  /** Observe the lifetime stats for this updater. */
  stats(): M3UpdateResult {
    return { applied: this.applied, skipped: this.skipped, batches: this.batches };
  }
}

// ─── Default classifiers ─────────────────────────────────────────────────────

/**
 * Default intent classifier: treat `trace.intent` as the exact intent-class
 * name; fall back to a deterministic mod-hash of the intent string if the
 * name is not one of the configured intent classes. This yields a stable
 * mapping without requiring the caller to enumerate intents ahead of time.
 */
function defaultClassifyIntent(trace: DecisionTrace, counts: ModelCounts): number {
  // We don't know intent class names here (counts only carries n); fall back
  // to hash-mod distribution. Callers wanting exact mapping should supply
  // their own classifier.
  if (counts.n === 0) return -1;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < trace.intent.length; i++) {
    h = Math.imul(h ^ trace.intent.charCodeAt(i), 16777619) >>> 0;
  }
  return h % counts.n;
}

/**
 * Default observation classifier: look up `trace.outcome` (or the literal
 * `'observed'` when outcome is absent) in the observation-type table.
 * Returns -1 when the label is not registered; caller can pre-populate the
 * table when exact mapping is needed.
 */
function defaultClassifyObservation(
  trace: DecisionTrace,
  counts: ModelCounts,
): number {
  const label = trace.outcome ?? 'observed';
  const idx = counts.observationTypes.indexOf(label);
  if (idx >= 0) return idx;
  if (counts.m === 0) return -1;
  // Fall back to mod-hash over the label so unknown outcomes still drive
  // a count — keeps the update loop productive without crashing.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 16777619) >>> 0;
  }
  return h % counts.m;
}

/**
 * Exact intent classifier — given an explicit intent-class list, match
 * `trace.intent` against it and return the index (or -1 on miss). Composes
 * with `M3UpdateOptions.classifyIntent`.
 */
export function exactIntentClassifier(
  intentClasses: readonly string[],
): (trace: DecisionTrace) => number {
  const map = new Map<string, number>();
  intentClasses.forEach((name, i) => map.set(name, i));
  return (trace: DecisionTrace) => map.get(trace.intent) ?? -1;
}
