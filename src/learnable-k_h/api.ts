/**
 * MD-5 — Read API for the learnable-K_H head.
 *
 * The consumer-facing `resolveKH(...)` takes a skill identifier and a task
 * embedding and returns the effective K_H for that `(skill, task-type)` pair.
 * The function composes with MB-1 transparently:
 *
 *   - Flag OFF → always returns `scalarKH` (byte-identical MB-1 behaviour,
 *     SC-MD5-01).
 *   - Flag ON, skill is not in the store → returns `scalarKH` (no head yet;
 *     MB-1 scalar serves as the cold-start anchor).
 *   - Flag ON, skill is non-tractable per the ME-1 class → returns `scalarKH`
 *     (ME-1 hard gate on the read path; symmetric with the trainer's
 *     non-tractable rejection — "empty history = frontmatter" per
 *     proposal CF-MD5-01).
 *   - Flag ON, skill has a head and is tractable → returns the head's
 *     forward-pass K_H at the given task embedding.
 *
 * Pure function — no mutation. No I/O aside from the optional settings flag
 * read, which the caller can override via `enabled` / `tractabilityOverride`.
 *
 * @module learnable-k_h/api
 */

import type { TractabilityClass } from '../ace/settings.js';
import { forward } from './head.js';
import { readLearnableKHEnabledFlag } from './settings.js';
import { get, type LearnableKHStore } from './store.js';

// ---------------------------------------------------------------------------
// Read API
// ---------------------------------------------------------------------------

export interface ResolveKHOptions {
  /** Store holding per-skill heads. */
  store: LearnableKHStore;
  /** Skill identifier. */
  skillId: string;
  /** Task embedding from MD-1. Must match the head's `dim` if a head exists. */
  taskEmbed: readonly number[];
  /** MB-1 scalar K_H (the frontmatter/Lyapunov value). Fallback when no head. */
  scalarKH: number;
  /** ME-1 tractability class for this skill. Defaults to 'tractable'. */
  tractability?: TractabilityClass;
  /**
   * Override the enabled flag — bypasses `readLearnableKHEnabledFlag` when
   * provided. Used primarily by tests and by callers that have already
   * materialised the flag.
   */
  enabled?: boolean;
  /** Optional settings-file path override forwarded to the flag reader. */
  settingsPath?: string;
}

export interface ResolveKHResult {
  /** Effective K_H to use in M6. */
  kH: number;
  /**
   * Source of the returned K_H. `'scalar'` means the caller-supplied MB-1
   * scalar was used (fallback); `'head'` means the learnable head forward
   * was used.
   */
  source: 'scalar' | 'head';
  /** Short diagnostic explaining why the scalar was chosen (on fallback). */
  scalarReason?: 'flag-off' | 'no-head' | 'non-tractable' | 'dim-mismatch';
}

/**
 * Resolve the effective K_H for a `(skill, taskEmbed)` pair, composing the
 * MD-5 head with the MB-1 scalar fallback. See the module header for the
 * full fallback ladder.
 */
export function resolveKH(opts: ResolveKHOptions): ResolveKHResult {
  const enabled = opts.enabled ?? readLearnableKHEnabledFlag(opts.settingsPath);
  if (!enabled) {
    return { kH: opts.scalarKH, source: 'scalar', scalarReason: 'flag-off' };
  }
  const tractability = opts.tractability ?? 'tractable';
  if (tractability !== 'tractable') {
    return { kH: opts.scalarKH, source: 'scalar', scalarReason: 'non-tractable' };
  }
  const head = get(opts.store, opts.skillId);
  if (!head) {
    return { kH: opts.scalarKH, source: 'scalar', scalarReason: 'no-head' };
  }
  if (head.dim !== opts.taskEmbed.length) {
    // Defensive: callers passing a mismatched embedding should not crash the
    // read path; fall back to the MB-1 scalar and surface the diagnostic.
    return { kH: opts.scalarKH, source: 'scalar', scalarReason: 'dim-mismatch' };
  }
  const f = forward(head, opts.taskEmbed);
  return { kH: f.kH, source: 'head' };
}

/**
 * Convenience wrapper when the caller only needs the scalar result.
 */
export function resolveKHScalar(opts: ResolveKHOptions): number {
  return resolveKH(opts).kH;
}
