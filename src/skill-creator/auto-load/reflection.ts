/**
 * HB-07 AEL bandit — slow-loop reflection.
 *
 * The reflection step runs at a configurable cadence (driven by failure
 * count) and produces {@link ReflectionInsight}s suggesting prior updates.
 * The actual LLM call is injected as a {@link ReflectionFn} for testability;
 * production deployments wire in their preferred reflection model.
 *
 * Important: reflection NEVER mutates the bandit posterior directly. Per
 * spec §5 (state-isolation invariant), insights flow only through the
 * Evolution-role's {@link PolicyUpdateProposal} return path, which is then
 * gated by HB-04's `protocol-update` CAPCOM gate before any change becomes
 * active. The `posterior-isolation.test.ts` fixture enforces this.
 *
 * @module skill-creator/auto-load/reflection
 */

import type { CrossSkillPattern } from '../roles/types.js';
import type { PolicyId, ReflectionFn, ReflectionInsight } from './types.js';

/**
 * Default deterministic reflection function (used when no LLM-call function
 * is injected). Heuristic: emit a single insight for each cross-skill
 * pattern with ≥2 occurrences, with confidence proportional to occurrence
 * concentration. This is *not* the production path — it exists so the
 * module behaves predictably in tests and offline.
 */
export const defaultReflectionFn: ReflectionFn = ({ patterns, currentPolicy, episode }) => {
  const insights: ReflectionInsight[] = [];
  for (const p of patterns) {
    if (p.occurrences < 2) continue;
    const confidence = Math.min(1, p.occurrences / 5);
    insights.push(
      Object.freeze({
        failureClass: p.failureClass,
        rootCausePattern: `recurring ${p.failureClass} on ${p.affectedCandidates.length} candidates`,
        proposedPolicyChange: `bias against policy '${currentPolicy ?? 'unknown'}' for failureClass=${p.failureClass}`,
        confidence,
        producedAt: new Date(0).toISOString(),
      }),
    );
  }
  void episode;
  return Object.freeze(insights);
};

/**
 * Run the reflection step. Pure relative to inputs; mockable via injected
 * {@link ReflectionFn}.
 */
export function runReflection(
  fn: ReflectionFn,
  patterns: ReadonlyArray<CrossSkillPattern>,
  currentPolicy: PolicyId | null,
  episode: number,
): ReadonlyArray<ReflectionInsight> {
  const result = fn({ patterns, currentPolicy, episode });
  // Defensive freeze + filter — caller-provided functions could return
  // non-frozen arrays; we never propagate mutable structures.
  const filtered = result.filter(
    (i) => Number.isFinite(i.confidence) && i.confidence > 0 && i.confidence <= 1,
  );
  return Object.freeze(filtered.map((i) => Object.freeze({ ...i })));
}
