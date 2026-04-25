/**
 * HB-07 — AEL fast/slow bandit auto-load — barrel export.
 *
 * v1.49.575 cs25-26-sweep Half B. Source: arXiv:2604.21725. Default-off via
 * `cs25-26-sweep.ael-bandit.enabled`. **CAPCOM HARD GATE.**
 *
 * Composes inside HB-04's `EvolutionExtensionPoint` (see
 * `src/skill-creator/roles/`); the bandit posterior is private to the
 * extension instance, never exposed via any HB-04 surface.
 *
 * Two production CAPCOM scenarios (per spec §HB-07):
 *   1. **Bandit-engagement** — transitioning from existing auto-load to
 *      bandit-driven auto-load. Without the marker file, bandit refuses
 *      to engage and existing auto-load runs unchanged.
 *   2. **Reflection-induced policy update** — slow-loop reflection
 *      proposes a retrieval-policy change. Gated via HB-04's
 *      `'protocol-update'` path (HB-04 stages or activates).
 *
 * @module skill-creator/auto-load
 */

// Settings.
export type { AelBanditConfigBlock } from './settings.js';
export {
  DEFAULT_AEL_BANDIT_CONFIG,
  isAelBanditEnabled,
  readAelBanditConfig,
} from './settings.js';

// Types.
export type {
  PolicyId,
  BetaPosterior,
  BanditState,
  ReflectionInsight,
  AelBanditConfig,
  ReflectionFn,
} from './types.js';

// Posterior + Thompson Sampling.
export {
  EMPTY_POSTERIORS,
  makePosterior,
  posteriorMean,
  updatePosterior,
  updatePosteriorMap,
  sampleBeta,
  thompsonSelect,
} from './posterior.js';

// Reflection.
export { defaultReflectionFn, runReflection } from './reflection.js';

// Bandit core.
export {
  BANDIT_DISABLED_STATE,
  emptyBanditState,
  resolveConfig,
  selectPolicy,
  observeReward,
  maybeReflect,
} from './bandit.js';

// CAPCOM gate.
export type {
  AelBanditGateReason,
  AelBanditGateRecord,
  AelBanditGateResult,
} from './capcom-gate.js';
export {
  AEL_BANDIT_GATE_DISABLED_RESULT,
  defaultBanditCapcomMarkerPath,
  defaultBanditTriggerMarkerPath,
  isBanditCapcomAuthorized,
  isBanditActivationTriggered,
  emitBanditEngagementGate,
  emitReflectionPolicyUpdateGate,
} from './capcom-gate.js';

// Extension (HB-04 integration boundary).
export type { AelBanditExtensionOptions } from './extension.js';
export { AelBandit } from './extension.js';
