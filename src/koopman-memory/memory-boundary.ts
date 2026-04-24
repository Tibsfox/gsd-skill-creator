/**
 * Koopman-Memory — typed boundary over the existing memory primitive.
 *
 * **READ-ONLY adapter.** This module converts snapshots of
 * {@link MemoryEntry} records into Koopman-state vectors and back into
 * opaque snapshot objects. It is an **import-type-only** adapter: it never
 * imports runtime code from `src/memory/*`, never writes to the memory
 * subsystem, and never holds a live reference to any `MemoryService` /
 * `PgStore` / `ChromaStore` / `ShortTermMemory` / `LongTermMemory`
 * instance.
 *
 * Per G8 HARD preservation gate, this adapter must not:
 *   - modify or shadow any existing memory type;
 *   - trigger side effects on `src/memory/*` at module load;
 *   - replace the memory primitive for non-opted-in callers.
 *
 * `MemoryEntry` is imported from `src/types/memory.ts` (where the project
 * actually declares the shape), not from `src/memory/types.ts` (which
 * holds LOD tier / visibility metadata).
 *
 * @module koopman-memory/memory-boundary
 */

import type { MemoryEntry } from '../types/memory.js';
import { DEFAULT_STATE_DIM } from './settings.js';
import type { KoopmanState, MemoryStateSnapshot } from './types.js';

/**
 * Convert a {@link MemoryEntry} snapshot to a fixed-dimension Koopman state.
 *
 * The projection is intentionally simple and deterministic:
 *
 *   [alpha, beta, gamma, score, tanh(ts / 1e12), tanh(content.length / 1024),
 *    0, 0, ...]
 *
 * Entries 0..3 carry the scorer components unchanged; entries 4..5 compress
 * ts / length into [-1, 1] via tanh so they interact gracefully with other
 * state values under the bilinear update. Remaining slots are zero.
 *
 * If `dim < 6` the projection is truncated. If `dim > 6` the tail is zero
 * padded.
 */
export function memoryEntryToState(
  entry: Pick<MemoryEntry, 'alpha' | 'beta' | 'gamma' | 'score' | 'ts' | 'content'>,
  dim: number = DEFAULT_STATE_DIM,
): KoopmanState {
  if (!Number.isInteger(dim) || dim <= 0) {
    throw new Error(`koopman-memory: memoryEntryToState dim must be positive integer, got ${dim}`);
  }
  const raw = [
    safeFinite(entry.alpha),
    safeFinite(entry.beta),
    safeFinite(entry.gamma),
    safeFinite(entry.score),
    Math.tanh(safeFinite(entry.ts) / 1e12),
    Math.tanh((entry.content ? entry.content.length : 0) / 1024),
  ];
  const out = new Array<number>(dim).fill(0);
  const copyLen = Math.min(dim, raw.length);
  for (let i = 0; i < copyLen; i++) out[i] = raw[i];
  return Object.freeze(out);
}

/**
 * Convert a Koopman state back into an opaque snapshot object. The return
 * value is a **plain object** — callers are free to log, hash, or pass it
 * on, but it is not a `MemoryEntry` and carries no LOD/visibility metadata.
 */
export function stateToMemorySnapshot(h: KoopmanState): MemoryStateSnapshot {
  const values = new Array<number>(h.length);
  for (let i = 0; i < h.length; i++) values[i] = h[i];
  return Object.freeze({
    dimension: h.length,
    values: Object.freeze(values),
  });
}

function safeFinite(x: number): number {
  return Number.isFinite(x) ? x : 0;
}
