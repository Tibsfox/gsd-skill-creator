/**
 * HB-07 AEL fast/slow bandit — core engine.
 *
 * Source: arXiv:2604.21725 (AEL, two-timescale Thompson Sampling +
 * LLM-driven reflection). Composes inside HB-04's Evolution-role
 * extension point ({@link EvolutionExtensionPoint}); see
 * `src/skill-creator/auto-load/extension.ts` for the integration boundary.
 *
 * Default-off via `cs25-26-sweep.ael-bandit.enabled`.
 *
 * Two timescales:
 *   - Fast: per-episode Thompson Sampling over Beta posteriors (one per
 *     declared retrieval policy / arm).
 *   - Slow: every `reflectionThreshold` failures, run the injected
 *     reflection function over cross-skill patterns + the current policy.
 *
 * State isolation:
 *   - The bandit owns its posterior store privately (no HB-04 surface
 *     exposes it).
 *   - Reflection NEVER mutates the posterior directly; insights flow back
 *     through Evolution's `PolicyUpdateProposal` path and are gated.
 *
 * @module skill-creator/auto-load/bandit
 */

import type { CrossSkillPattern } from '../roles/types.js';
import {
  EMPTY_POSTERIORS,
  makePosterior,
  thompsonSelect,
  updatePosteriorMap,
} from './posterior.js';
import { runReflection, defaultReflectionFn } from './reflection.js';
import type {
  AelBanditConfig,
  BanditState,
  PolicyId,
  ReflectionFn,
  ReflectionInsight,
} from './types.js';

/** Frozen disabled bandit-state sentinel. */
export const BANDIT_DISABLED_STATE: BanditState = Object.freeze({
  policies: EMPTY_POSTERIORS,
  lastSelection: null,
  episode: 0,
  failuresSinceReflection: 0,
});

/** Construct an empty bandit state. */
export function emptyBanditState(): BanditState {
  return BANDIT_DISABLED_STATE;
}

/** Resolve config with explicit defaults applied. */
interface ResolvedConfig {
  readonly id: string;
  readonly priorAlpha: number;
  readonly priorBeta: number;
  readonly reflectionThreshold: number;
  readonly reflectFn: ReflectionFn;
  readonly random: () => number;
}

export function resolveConfig(c: AelBanditConfig = {}): ResolvedConfig {
  return Object.freeze({
    id: c.id ?? 'ael-bandit-v1',
    priorAlpha: c.priorAlpha ?? 1,
    priorBeta: c.priorBeta ?? 1,
    reflectionThreshold: c.reflectionThreshold ?? 5,
    reflectFn: c.reflectFn ?? defaultReflectionFn,
    random: c.random ?? Math.random,
  });
}

/**
 * Fast loop — select an arm via Thompson Sampling. Returns null when no
 * arms are declared.
 */
export function selectPolicy(
  state: BanditState,
  arms: ReadonlyArray<PolicyId>,
  config: AelBanditConfig = {},
): PolicyId | null {
  const cfg = resolveConfig(config);
  const prior = makePosterior(cfg.priorAlpha, cfg.priorBeta);
  return thompsonSelect(state.policies, arms, cfg.random, prior);
}

/**
 * Fast loop — record an observation against the most recently selected
 * arm. Returns a NEW frozen state; input is not mutated.
 */
export function observeReward(
  state: BanditState,
  policy: PolicyId,
  reward: 0 | 1,
  config: AelBanditConfig = {},
): BanditState {
  const cfg = resolveConfig(config);
  const prior = makePosterior(cfg.priorAlpha, cfg.priorBeta);
  const policies = updatePosteriorMap(state.policies, policy, reward, prior);
  const failuresSinceReflection =
    reward === 0 ? state.failuresSinceReflection + 1 : state.failuresSinceReflection;
  return Object.freeze({
    policies,
    lastSelection: policy,
    episode: state.episode + 1,
    failuresSinceReflection,
  });
}

/**
 * Slow loop — run reflection if the failure threshold is crossed. Returns
 * `{ insights, state }` where `state.failuresSinceReflection` resets to 0
 * on a fire. When the threshold is not crossed, returns empty insights and
 * the unchanged state.
 *
 * Reflection NEVER mutates the posterior store — see the module-level
 * note + `posterior-isolation.test.ts`.
 */
export function maybeReflect(
  state: BanditState,
  patterns: ReadonlyArray<CrossSkillPattern>,
  config: AelBanditConfig = {},
): { insights: ReadonlyArray<ReflectionInsight>; state: BanditState } {
  const cfg = resolveConfig(config);
  if (state.failuresSinceReflection < cfg.reflectionThreshold) {
    return { insights: Object.freeze([]) as ReadonlyArray<ReflectionInsight>, state };
  }
  const insights = runReflection(cfg.reflectFn, patterns, state.lastSelection, state.episode);
  const next: BanditState = Object.freeze({
    ...state,
    failuresSinceReflection: 0,
  });
  return { insights, state: next };
}
