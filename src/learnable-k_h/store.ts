/**
 * MD-5 — Per-skill learnable-K_H head store.
 *
 * Keeps heads in a `Map<skillId, LearnableKHHead>` and provides:
 *   - `getOrCreate` — idempotent head allocation at skill-register time
 *   - `get` / `has` — read-only lookup (used on the hot `resolveKH` path)
 *   - `remove` / `clear` — administrative
 *   - `serialize` / `deserialize` — JSON round-trip for persistence
 *
 * Each skill owns an independent head; no cross-skill parameter sharing. This
 * is a deliberate constraint from the MD-5 proposal §"Implementation
 * constraints" ("Linear head only ... small and analysable"): a skill's head
 * can only affect that skill's K_H.
 *
 * Persistence format is stable, versioned, and forward-compatible. A missing
 * or unknown version deserialises to an empty store (fail-safe) rather than
 * throwing — the trainer will simply start cold.
 *
 * @module learnable-k_h/store
 */

import type { LearnableKHHead } from './head.js';

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface LearnableKHStore {
  /** Map skillId → head. Exposed for iteration; do not mutate directly. */
  readonly heads: Map<string, LearnableKHHead>;
}

export function createStore(): LearnableKHStore {
  return { heads: new Map() };
}

// ---------------------------------------------------------------------------
// CRUD helpers
// ---------------------------------------------------------------------------

export function get(store: LearnableKHStore, skillId: string): LearnableKHHead | undefined {
  return store.heads.get(skillId);
}

export function has(store: LearnableKHStore, skillId: string): boolean {
  return store.heads.has(skillId);
}

/**
 * Return the head for `skillId` if already present; otherwise insert the
 * head returned by `factory()` and return it. `factory` is only invoked on
 * miss, so callers can build the head lazily.
 */
export function getOrCreate(
  store: LearnableKHStore,
  skillId: string,
  factory: () => LearnableKHHead,
): LearnableKHHead {
  const existing = store.heads.get(skillId);
  if (existing) return existing;
  const created = factory();
  if (created.skillId !== skillId) {
    throw new Error(
      `factory produced head for '${created.skillId}' but skillId is '${skillId}'`,
    );
  }
  store.heads.set(skillId, created);
  return created;
}

export function put(store: LearnableKHStore, head: LearnableKHHead): void {
  store.heads.set(head.skillId, head);
}

export function remove(store: LearnableKHStore, skillId: string): boolean {
  return store.heads.delete(skillId);
}

export function clear(store: LearnableKHStore): void {
  store.heads.clear();
}

export function size(store: LearnableKHStore): number {
  return store.heads.size;
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

export const STORE_FORMAT_VERSION = 1 as const;

interface SerializedHead {
  skillId: string;
  dim: number;
  kHMin: number;
  kHMax: number;
  weights: number[];
  bias: number;
  updateCount: number;
}

interface SerializedStore {
  version: number;
  heads: SerializedHead[];
}

export function serialize(store: LearnableKHStore): string {
  const payload: SerializedStore = {
    version: STORE_FORMAT_VERSION,
    heads: [...store.heads.values()]
      .sort((a, b) => (a.skillId < b.skillId ? -1 : a.skillId > b.skillId ? 1 : 0))
      .map((h) => ({
        skillId: h.skillId,
        dim: h.dim,
        kHMin: h.kHMin,
        kHMax: h.kHMax,
        weights: h.weights.slice(),
        bias: h.bias,
        updateCount: h.updateCount,
      })),
  };
  return JSON.stringify(payload);
}

/**
 * Restore a store from a JSON string produced by `serialize`. Unknown-version
 * or malformed payloads yield an empty store — callers treat "no posterior"
 * as the safe fallback per MD-5 §"Empty history = frontmatter".
 */
export function deserialize(json: string): LearnableKHStore {
  const store = createStore();
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return store;
  }
  if (!parsed || typeof parsed !== 'object') return store;
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== STORE_FORMAT_VERSION) return store;
  const heads = obj.heads;
  if (!Array.isArray(heads)) return store;
  for (const h of heads) {
    if (!h || typeof h !== 'object') continue;
    const r = h as Record<string, unknown>;
    const skillId = typeof r.skillId === 'string' ? r.skillId : undefined;
    const dim = typeof r.dim === 'number' ? r.dim : undefined;
    const kHMin = typeof r.kHMin === 'number' ? r.kHMin : undefined;
    const kHMax = typeof r.kHMax === 'number' ? r.kHMax : undefined;
    const weightsRaw = r.weights;
    const bias = typeof r.bias === 'number' ? r.bias : undefined;
    const updateCount = typeof r.updateCount === 'number' ? r.updateCount : 0;
    if (
      skillId === undefined ||
      dim === undefined ||
      kHMin === undefined ||
      kHMax === undefined ||
      bias === undefined ||
      !Array.isArray(weightsRaw) ||
      weightsRaw.length !== dim
    ) {
      continue;
    }
    const weights: number[] = [];
    let ok = true;
    for (const w of weightsRaw) {
      if (typeof w !== 'number' || !Number.isFinite(w)) {
        ok = false;
        break;
      }
      weights.push(w);
    }
    if (!ok) continue;
    store.heads.set(skillId, {
      skillId,
      dim,
      kHMin,
      kHMax,
      weights,
      bias,
      updateCount,
    });
  }
  return store;
}
