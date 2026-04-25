/**
 * HB-07 AEL bandit — HB-04 Evolution-role extension.
 *
 * Implements {@link EvolutionExtensionPoint} from `src/skill-creator/roles/`.
 * This is the integration boundary between HB-07's bandit and HB-04's
 * Worker / Evaluator / Evolution split. Per the convergent-discovery report
 * §5: HB-04 supplies the per-episode adversarial check; HB-07 supplies
 * the cross-episode reflection-bandit.
 *
 * Composition flow:
 *
 *   1. HB-04's `evolutionPropose` fires the role-split CAPCOM gate. If
 *      that gate is not authorized, this extension's `proposePolicyUpdate`
 *      is **not invoked** (HB-04 short-circuits).
 *   2. When invoked, the AelBandit *first* emits its own
 *      bandit-engagement CAPCOM gate. Without bandit-engagement auth,
 *      the bandit returns null and existing auto-load runs unchanged
 *      — i.e., the bandit refuses to mutate state.
 *   3. The bandit consults the snapshot, updates its private posterior
 *      from the worker/evaluator state, and (if the failure threshold
 *      is crossed) runs slow-loop reflection to produce insights.
 *   4. If reflection produces an actionable insight, the bandit emits
 *      a `reflection-policy-update` gate (its own trace) and returns a
 *      {@link PolicyUpdateProposal}. HB-04 then fires its own
 *      `'protocol-update'` gate before activation — the *double-gate*
 *      semantic.
 *
 * Posterior storage is **private**: the bandit holds its own
 * {@link BanditState} in the extension instance. HB-04 has no surface
 * that can read or write it (verified by `posterior-isolation.test.ts`).
 *
 * @module skill-creator/auto-load/extension
 */

import type {
  EvolutionExtensionPoint,
  EvolutionSnapshot,
  PolicyUpdateProposal,
} from '../roles/types.js';
import {
  emitBanditEngagementGate,
  emitReflectionPolicyUpdateGate,
} from './capcom-gate.js';
import {
  emptyBanditState,
  maybeReflect,
  observeReward,
  resolveConfig,
  selectPolicy,
} from './bandit.js';
import { isAelBanditEnabled } from './settings.js';
import type {
  AelBanditConfig,
  BanditState,
  PolicyId,
  ReflectionInsight,
} from './types.js';

/**
 * Options that drive a single extension invocation. Marker + settings paths
 * are exposed so tests can inject temp dirs; production callers pass
 * nothing and the defaults resolve to the project root.
 */
export interface AelBanditExtensionOptions {
  readonly arms: ReadonlyArray<PolicyId>;
  readonly config?: AelBanditConfig;
  readonly settingsPath?: string;
  readonly capcomMarkerPath?: string;
}

/**
 * The HB-07 AEL bandit, packaged as an HB-04 Evolution extension.
 *
 * Construction is cheap — the bandit posterior is empty until
 * `proposePolicyUpdate` is called and the bandit-engagement gate
 * authorizes operation. Each invocation is one fast-loop step + a
 * possible slow-loop reflection.
 */
export class AelBandit implements EvolutionExtensionPoint {
  readonly id: string;

  // Posterior storage is PRIVATE. HB-04 sees only `id` + `proposePolicyUpdate`
  // through the `EvolutionExtensionPoint` interface. We use the `#` private
  // syntax so even reflection-based access from outside the class is denied.
  #state: BanditState = emptyBanditState();
  #lastInsights: ReadonlyArray<ReflectionInsight> = Object.freeze([]);
  readonly #options: AelBanditExtensionOptions;

  constructor(options: AelBanditExtensionOptions) {
    this.#options = options;
    this.id = options.config?.id ?? 'ael-bandit-v1';
  }

  /**
   * EvolutionExtensionPoint contract — invoked by `evolutionPropose` after
   * the role-split CAPCOM gate is authorized.
   *
   * Returns null when the bandit-engagement gate is not authorized (existing
   * auto-load runs unchanged) or when there is no actionable reflection
   * insight to propose this episode.
   */
  proposePolicyUpdate(snapshot: EvolutionSnapshot): PolicyUpdateProposal | null {
    // Defense in depth: HB-04 already checks the flag, but the bandit
    // re-checks because its own settings flag is independent.
    if (!isAelBanditEnabled(this.#options.settingsPath)) {
      return null;
    }

    // Bandit-engagement gate. Without authorization, the bandit refuses
    // to engage AT ALL — no posterior update, no reflection. Existing
    // auto-load (HB-04's in-house Evolution heuristic + the legacy
    // skill-creator path) runs unchanged.
    const engagementGate = emitBanditEngagementGate({
      note: 'ael-bandit:engagement',
      markerPath: this.#options.capcomMarkerPath,
      settingsPath: this.#options.settingsPath,
    });
    if (!engagementGate.authorized) {
      return null;
    }

    // Fast loop — select an arm and observe a synthetic reward derived
    // from the snapshot. Reward = 1 iff the snapshot has zero adversarial
    // diagnostics (Worker output passed Evaluator); else 0.
    const arms = this.#options.arms;
    if (arms.length === 0) return null;

    const config = this.#options.config ?? {};
    const selected = selectPolicy(this.#state, arms, config);
    if (selected === null) return null;
    const reward: 0 | 1 = snapshot.evaluatorState.diagnostics.length === 0 ? 1 : 0;
    this.#state = observeReward(this.#state, selected, reward, config);

    // Slow loop — reflect when the failure threshold is crossed.
    const reflection = maybeReflect(this.#state, snapshot.patterns, config);
    this.#state = reflection.state;
    this.#lastInsights = reflection.insights;
    if (reflection.insights.length === 0) return null;

    // Pick the highest-confidence insight and shape it into a proposal.
    const insight = [...reflection.insights].sort(
      (a, b) => b.confidence - a.confidence,
    )[0]!;

    // Emit the bandit's own reflection-policy-update gate trace.
    // (HB-04 will independently fire its `'protocol-update'` gate in
    // `evolutionPropose` before activation — the double-gate semantic.)
    emitReflectionPolicyUpdateGate({
      note: `ael-bandit:reflect:${insight.failureClass}`,
      markerPath: this.#options.capcomMarkerPath,
      settingsPath: this.#options.settingsPath,
    });

    // Pick the trigger pattern that matches the insight's failureClass,
    // falling back to the first pattern (we know patterns is non-empty
    // because reflection only fires when there's something to reflect on,
    // which the default reflectFn enforces; but if a custom reflectFn
    // returns insights without patterns, we still need a trigger value).
    const trigger =
      snapshot.patterns.find((p) => p.failureClass === insight.failureClass) ??
      snapshot.patterns[0] ??
      Object.freeze({
        failureClass: insight.failureClass,
        occurrences: 0,
        affectedCandidates: Object.freeze([]) as ReadonlyArray<string>,
      });

    const cfg = resolveConfig(config);
    return Object.freeze({
      role: 'evolution',
      protocol: 'auto-load',
      change: insight.proposedPolicyChange,
      rationale: `AEL slow-loop reflection (confidence=${insight.confidence.toFixed(3)}): ${insight.rootCausePattern}`,
      trigger,
      source: cfg.id,
      producedAt: new Date().toISOString(),
    });
  }

  /**
   * Test-only escape hatch returning a structural snapshot of the
   * bandit's last insights. Production code MUST NOT depend on this.
   */
  _testGetLastInsights(): ReadonlyArray<ReflectionInsight> {
    return this.#lastInsights;
  }

  /**
   * Test-only escape hatch returning a STRUCTURAL CLONE of the current
   * bandit state. The returned value cannot be used to mutate the
   * extension's private state. Production code MUST NOT depend on this.
   */
  _testGetStateClone(): BanditState {
    return Object.freeze({
      policies: Object.freeze({ ...this.#state.policies }),
      lastSelection: this.#state.lastSelection,
      episode: this.#state.episode,
      failuresSinceReflection: this.#state.failuresSinceReflection,
    });
  }
}
