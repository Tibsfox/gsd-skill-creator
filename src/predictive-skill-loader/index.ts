/**
 * Predictive Skill Loader — public API (UIP-18 / Phase 770).
 *
 * GNN link-formation prediction layer for skill cache pre-warming. Composes
 * over the College-of-Knowledge graph as a social-learning-network per
 * Spatiotemporal Link Formation Prediction in Social Learning Networks
 * (Mohammadiasl et al., arXiv:2604.18888, EDM 2026).
 *
 * ## Opt-in mechanism
 *
 * Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "predictive-skill-loader": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, `predictNextSkills()` returns `[]` with a
 * `disabled: true` marker on a wrapper object (see `predictNextSkillsWithMeta`)
 * and `prewarmCache()` is a strict no-op. This is the Gate G12 invariant:
 * orchestration is byte-identical to phase-769 tip.
 *
 * ## Hard preservation invariants (Gate G12)
 *
 * 1. `src/orchestration/` byte-identical with flag off (verified by the
 *    `orchestration-byte-identical.test.ts` test).
 * 2. Hook via existing API only: this module declares a structural
 *    `PreWarmHook` interface and never imports orchestration internals.
 * 3. No mutation of the College tree (`.college/` is read-only).
 * 4. Default-off byte-identical: `predictNextSkills` returns `[]` immediately
 *    and reads zero files.
 *
 * @module predictive-skill-loader
 */

import { loadCollegeGraph } from './college-graph.js';
import { buildLinkFormationModel, predictLinks } from './gnn-predictor.js';
import {
  NoopPreWarmHook,
  prewarmCacheVia,
  type CachePrewarmerOptions,
} from './cache-prewarmer.js';
import {
  isPredictiveSkillLoaderEnabled,
  readPredictiveSkillLoaderConfig,
  DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG,
  type PredictiveSkillLoaderConfig,
} from './settings.js';
import type {
  CollegeGraph,
  LinkFormationModel,
  LoadContext,
  PreWarmHook,
  SkillPrediction,
} from './types.js';

export type {
  CollegeGraph,
  LinkFormationModel,
  LoadContext,
  PreWarmHook,
  SkillPrediction,
} from './types.js';

export type { CachePrewarmerOptions } from './cache-prewarmer.js';
export type { PredictiveSkillLoaderConfig } from './settings.js';

export {
  loadCollegeGraph,
  getNeighbors,
  type CollegeGraphLoadOptions,
  type InMemoryConcept,
} from './college-graph.js';

export { buildLinkFormationModel, predictLinks } from './gnn-predictor.js';

export {
  NoopPreWarmHook,
  prewarmCacheVia,
} from './cache-prewarmer.js';

export {
  DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG,
  isPredictiveSkillLoaderEnabled,
  readPredictiveSkillLoaderConfig,
} from './settings.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PredictNextSkillsOptions {
  /** Override the auto-loaded model (test ergonomics). */
  model?: LinkFormationModel;
  /** Override the auto-loaded graph (test ergonomics). */
  graph?: CollegeGraph;
  /** Override the settings file path (test ergonomics). */
  settingsPath?: string;
  /** Override the resolved config (test ergonomics). */
  config?: PredictiveSkillLoaderConfig;
}

export interface PredictionResult {
  predictions: SkillPrediction[];
  /** True when the flag was off; `predictions` is guaranteed empty. */
  disabled: boolean;
}

/**
 * Predict the next likely skills from the current skill + load context.
 *
 * Default-off contract: when the flag is false, returns
 * `{ predictions: [], disabled: true }` immediately. Reads no files.
 */
export async function predictNextSkills(
  currentSkill: string,
  context: LoadContext = {},
  opts: PredictNextSkillsOptions = {},
): Promise<SkillPrediction[]> {
  const result = await predictNextSkillsWithMeta(currentSkill, context, opts);
  return result.predictions;
}

/**
 * Same as `predictNextSkills` but returns the disabled marker alongside the
 * predictions, used by tests + the cache-prewarmer integration to disambiguate
 * "predicted nothing" vs "feature off".
 */
export async function predictNextSkillsWithMeta(
  currentSkill: string,
  context: LoadContext = {},
  opts: PredictNextSkillsOptions = {},
): Promise<PredictionResult> {
  const cfg =
    opts.config ?? readPredictiveSkillLoaderConfig(opts.settingsPath);
  if (!cfg.enabled) {
    return { predictions: [], disabled: true };
  }
  const model =
    opts.model ??
    buildLinkFormationModel(opts.graph ?? loadCollegeGraph(), {
      hops: cfg.hops,
      decay: cfg.decay,
    });
  const topK = context.topK ?? cfg.topK;
  const predictions = predictLinks(model, currentSkill, context, topK);
  return { predictions, disabled: false };
}

/**
 * Pre-warm the cache via the supplied hook. Default-off: when no hook is
 * supplied OR the hook reports disabled, returns 0.
 */
export async function prewarmCache(
  predictions: ReadonlyArray<SkillPrediction>,
  hook: PreWarmHook | null = null,
  opts: CachePrewarmerOptions = {},
): Promise<number> {
  if (hook === null) return 0;
  return prewarmCacheVia(hook, predictions, opts);
}

// Internal re-exports purely for the byte-identical test:
export { isPredictiveSkillLoaderEnabled as _isEnabled };

// Used by integration tests — kept lightweight (NoopPreWarmHook).
export function makeDefaultHook(enabled = true): PreWarmHook {
  return new NoopPreWarmHook(enabled);
}

// Symbol re-export so consumers can pin the default config in tests.
export { DEFAULT_PREDICTIVE_SKILL_LOADER_CONFIG as _DEFAULT_CONFIG };
