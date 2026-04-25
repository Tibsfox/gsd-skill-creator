/**
 * HB-07 — AEL fast/slow bandit auto-load types.
 *
 * Source paper: arXiv:2604.21725 — Agent Evolving Learning. Two-timescale
 * structure: a fast Thompson Sampling bandit selects retrieval policies
 * per-episode; a slow LLM-driven reflection loop diagnoses recurring
 * failure patterns and proposes prior updates.
 *
 * The bandit composes inside HB-04's Evolution-role extension point
 * ({@link EvolutionExtensionPoint}); the bandit's posterior storage is
 * private to this extension (HB-04 deliberately exposes no shared store).
 *
 * Default-off via `cs25-26-sweep.ael-bandit.enabled`; flag-off auto-load
 * behavior is byte-identical to v1.49.574.
 *
 * @module skill-creator/auto-load/types
 */

import type { CrossSkillPattern } from '../roles/types.js';

/** Bandit-arm identifier — names a retrieval policy. */
export type PolicyId = string;

/**
 * Beta-distribution posterior for a single arm. Conjugate to Bernoulli
 * success/failure observations: each success increments alpha by 1; each
 * failure increments beta by 1. Posterior mean = alpha / (alpha + beta).
 */
export interface BetaPosterior {
  readonly alpha: number;
  readonly beta: number;
}

/**
 * Bandit state — owned privately by the AelBandit extension. Not exposed
 * via any HB-04 surface (verified by `posterior-isolation.test.ts`).
 */
export interface BanditState {
  /** Beta posterior per policy id. */
  readonly policies: Readonly<Record<PolicyId, BetaPosterior>>;
  /** Last selected policy id (read by the slow loop for reflection). */
  readonly lastSelection: PolicyId | null;
  /** Episode counter — monotonically increments on each observation. */
  readonly episode: number;
  /** Failure count since last reflection — drives slow-loop trigger. */
  readonly failuresSinceReflection: number;
}

/**
 * Insight produced by the slow LLM reflection step. Read-only; written by
 * the reflection step into the policy-prior store via the documented
 * read-contract (the bandit posterior itself is NOT mutated by reflection
 * — `posterior-isolation.test.ts` enforces this).
 */
export interface ReflectionInsight {
  readonly failureClass: string;
  readonly rootCausePattern: string;
  readonly proposedPolicyChange: string;
  /** Confidence in (0, 1] — drives whether reflection emits a proposal. */
  readonly confidence: number;
  readonly producedAt: string;
}

/**
 * Configuration for an AEL bandit instance. All knobs are explicit so the
 * spec ADR's "silent regime drift" Risk note is addressed by review.
 */
export interface AelBanditConfig {
  /** Stable extension id; defaults to `'ael-bandit-v1'`. */
  readonly id?: string;
  /** Initial Beta(α, β) prior for each declared arm. Default: Beta(1,1). */
  readonly priorAlpha?: number;
  readonly priorBeta?: number;
  /** Failure-count threshold that triggers the slow reflection loop. */
  readonly reflectionThreshold?: number;
  /** Pluggable LLM-call function — mocked in tests. */
  readonly reflectFn?: ReflectionFn;
  /** Pluggable PRNG — defaults to Math.random. Tests inject deterministic. */
  readonly random?: () => number;
}

/**
 * The slow-loop reflection callback. Receives a frozen window of cross-skill
 * patterns + the currently-selected policy and returns insights.
 *
 * Returning an empty array means "no actionable insight". The actual LLM
 * invocation is the responsibility of the caller; in tests we inject a
 * deterministic function.
 */
export type ReflectionFn = (input: {
  readonly patterns: ReadonlyArray<CrossSkillPattern>;
  readonly currentPolicy: PolicyId | null;
  readonly episode: number;
}) => ReadonlyArray<ReflectionInsight>;
