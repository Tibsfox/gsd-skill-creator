/**
 * ME-2 Per-Skill Model Affinity — Dispatch actuator (pure functions).
 *
 * Turns the advisory `AffinityDecision.escalateTo` (produced by `evaluateMatch`)
 * into a concrete dispatch-model decision for a *dispatched agent*. This is the
 * ME-2 *actuator*: where ME-2 previously only *suggested* an escalation via the
 * CLI ("Escalation suggestion: upgrade session to …"), this module resolves the
 * suggestion into the model string a dispatched agent is actually spawned with.
 *
 * Scope (per the ME-2 actuator spec / Ship 1.2):
 *   - Applies ONLY to *dispatched* agents — i.e. the agent-definition boundary
 *     that emits an Agent-tool `model:` field (see `src/agents/agent-generator.ts`).
 *     It NEVER touches the in-context M5 selector: the current session's model
 *     cannot be changed mid-flight, so escalating it would not recover signal.
 *   - Gated by the existing `gsd-skill-creator.model_affinity.enabled` flag,
 *     threaded in as the pure `featureEnabled` parameter. When `false` (the
 *     default), `resolveDispatchModel` returns the base model unchanged
 *     (CF-ME2-01 byte-identical path) — the caller emits an identical agent.
 *
 * All functions are pure — no I/O, no side effects, no flag reads. The flag is
 * read at the call boundary (via `readModelAffinityEnabledFlag`) and passed in.
 *
 * @module model-affinity/actuator
 */

import type { AffinityDecision } from './policy.js';

// ---------------------------------------------------------------------------
// DispatchModel vocabulary
// ---------------------------------------------------------------------------

/**
 * The model vocabulary a dispatched agent is spawned with. Mirrors `ModelAlias`
 * (`src/types/agent.ts`) byte-for-byte — the three Claude families plus
 * `inherit` ("use the parent/session model"). This is the value written to an
 * agent's `model:` frontmatter and consumed by the harness Agent-tool `model:`
 * parameter.
 *
 * `escalateTo` (a `ModelFamily` from `pickNextTierUp`) is always one of the
 * three concrete families — never `unknown` — so it maps directly into this
 * type; `unknown` / malformed targets are guarded out by `resolveDispatchModel`.
 */
export type DispatchModel = 'inherit' | 'haiku' | 'sonnet' | 'opus';

/**
 * Cost-ordered tier for a {@link DispatchModel}. `inherit` sits below `haiku`
 * (tier −1) because it expresses "no opinion" — any concrete escalation is
 * strictly above it and therefore replaces it.
 */
const DISPATCH_TIER: Record<DispatchModel, number> = {
  inherit: -1,
  haiku: 0,
  sonnet: 1,
  opus: 2,
};

/** Type guard — `true` only for the four valid {@link DispatchModel} values. */
function isDispatchModel(value: unknown): value is DispatchModel {
  return (
    value === 'inherit' ||
    value === 'haiku' ||
    value === 'sonnet' ||
    value === 'opus'
  );
}

// ---------------------------------------------------------------------------
// Resolution outcome
// ---------------------------------------------------------------------------

/** The outcome of resolving a dispatch model from a set of affinity decisions. */
export interface DispatchModelResolution {
  /** The model the agent should be dispatched with. */
  model: DispatchModel;
  /** Whether `model` was raised above `baseModel` by an escalation. */
  escalated: boolean;
  /** The base model before escalation (present only when `escalated`). */
  from?: DispatchModel;
  /** The escalated model (present only when `escalated`; equals `model`). */
  to?: DispatchModel;
  /**
   * Skill ids whose escalation drove the chosen tier (present only when
   * `escalated`). Useful for audit / log lines explaining the upgrade.
   */
  drivers?: string[];
}

// ---------------------------------------------------------------------------
// Core resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the model a *dispatched* agent should run on, given the model-affinity
 * decisions of the skills it bundles.
 *
 * **Flag-off guarantee (CF-ME2-01):** when `featureEnabled === false` (the
 * default), returns `{ model: baseModel, escalated: false }` regardless of the
 * decisions — the caller emits a byte-identical agent definition. The decisions
 * are not even inspected.
 *
 * When enabled, picks the highest escalation tier among decisions where
 * `shouldEscalate === true` and `escalateTo` is a concrete family. If that tier
 * is strictly above the base model's tier, the agent is escalated to it;
 * otherwise the base model is kept (it is already capable enough). Because
 * `inherit` has tier −1, any concrete escalation replaces `inherit` with the
 * escalated model.
 *
 * @param decisions - Per-skill affinity decisions keyed by skill id. `null`
 *   entries (no affinity declared / reliable / flag-off upstream) never
 *   escalate. Decisions with `shouldEscalate === false` never escalate
 *   (CF-ME2-02: coin-flip skills are not recoverable by a model upgrade).
 * @param baseModel - The model the agent would run on absent any escalation
 *   (typically the generator's configured `model`).
 * @param featureEnabled - The ME-2 feature flag value. `false` → no-op
 *   (byte-identical). Read at the call boundary via `readModelAffinityEnabledFlag`.
 * @returns A {@link DispatchModelResolution} describing the chosen model.
 */
export function resolveDispatchModel(
  decisions: ReadonlyMap<string, AffinityDecision | null>,
  baseModel: DispatchModel,
  featureEnabled: boolean,
): DispatchModelResolution {
  // Flag-off path — byte-identical, decisions ignored entirely (CF-ME2-01).
  if (!featureEnabled) {
    return { model: baseModel, escalated: false };
  }

  // Find the strongest escalation target across all bundled skills.
  let bestTarget: DispatchModel | undefined;
  let bestTier = Number.NEGATIVE_INFINITY;
  let drivers: string[] = [];

  for (const [id, decision] of decisions) {
    if (!decision || !decision.shouldEscalate) continue;
    const target = decision.escalateTo;
    // `escalateTo` is a `ModelFamily` and is always concrete in practice
    // (pickNextTierUp filters 'unknown'); guard defensively against
    // 'unknown' / undefined / malformed values. `isDispatchModel` admits
    // 'haiku' | 'sonnet' | 'opus' here (a ModelFamily is never 'inherit').
    if (!isDispatchModel(target)) continue;

    const tier = DISPATCH_TIER[target];
    if (tier > bestTier) {
      bestTier = tier;
      bestTarget = target;
      drivers = [id];
    } else if (tier === bestTier) {
      drivers.push(id);
    }
  }

  // No escalation, or the escalation is not above the base model → keep base.
  if (bestTarget === undefined || bestTier <= DISPATCH_TIER[baseModel]) {
    return { model: baseModel, escalated: false };
  }

  return {
    model: bestTarget,
    escalated: true,
    from: baseModel,
    to: bestTarget,
    drivers,
  };
}
