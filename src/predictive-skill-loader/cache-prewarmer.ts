/**
 * Predictive Skill Loader — cache pre-warmer bridge.
 *
 * Issues pre-warm requests to the existing cache hook API. CRITICAL CAPCOM
 * preservation rule: this module imports nothing from `src/orchestration/`.
 * It composes via the structural `PreWarmHook` interface (see types.ts) which
 * any cache implementation can satisfy. The reference implementation in
 * `src/cache/preload.ts` already conforms (Preloader.preload + isEnabled).
 *
 * Flag-off behaviour: when the predictive-skill-loader flag is false, the
 * caller passes an empty predictions array, the pre-warmer issues zero
 * preload calls, and orchestration sees no traffic at all (Gate G12 byte-
 * identical).
 *
 * @module predictive-skill-loader/cache-prewarmer
 */

import type { PreWarmHook, SkillPrediction } from './types.js';

export interface CachePrewarmerOptions {
  /** Hard cap on preloads issued in one call. Default unlimited. */
  maxPreloads?: number;
  /** Minimum prediction score to be eligible for preload. Default 0. */
  minScore?: number;
}

/**
 * NoopPreWarmHook — a structurally valid hook that records (but does not
 * forward) preload requests. Used in tests + as the safe default when the
 * caller has not wired in a real cache.
 */
export class NoopPreWarmHook implements PreWarmHook {
  public readonly callLog: string[][] = [];
  private readonly _enabled: boolean;
  constructor(enabled = true) {
    this._enabled = enabled;
  }
  preload(skillIds: ReadonlyArray<string>): void {
    this.callLog.push([...skillIds]);
  }
  isEnabled(): boolean {
    return this._enabled;
  }
}

/**
 * Pre-warm the cache by submitting the predicted skill ids to the hook.
 *
 * Returns the count of skills actually submitted. When the hook is disabled
 * OR predictions is empty OR all predictions fall below `minScore`, this is
 * a strict no-op (zero preload calls, return 0).
 */
export function prewarmCacheVia(
  hook: PreWarmHook,
  predictions: ReadonlyArray<SkillPrediction>,
  opts: CachePrewarmerOptions = {},
): number {
  if (!hook.isEnabled()) return 0;
  if (predictions.length === 0) return 0;

  const minScore = opts.minScore ?? 0;
  const eligible: string[] = [];
  for (const p of predictions) {
    if (p.via === 'disabled') continue;
    if (p.score < minScore) continue;
    eligible.push(p.skillId);
  }
  if (eligible.length === 0) return 0;

  const cap =
    typeof opts.maxPreloads === 'number' && opts.maxPreloads > 0
      ? Math.floor(opts.maxPreloads)
      : eligible.length;
  const sliced = eligible.slice(0, cap);
  hook.preload(sliced);
  return sliced.length;
}
