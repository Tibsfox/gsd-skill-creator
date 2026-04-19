/**
 * MA-2 ACE — barrel export.
 *
 * Phase 655 / v1.49.561 Refinement R2. Exposes the complete public surface
 * of the actor-critic wire module. M5's `ActivationSelector` and integration
 * tests import from this barrel.
 *
 * @module ace
 */

// ─── Settings / config ──────────────────────────────────────────────────────
export {
  readAceEnabledFlag,
  tractabilityWeight,
  TRACTABILITY_WEIGHT_FLOOR,
  DEFAULT_GAMMA,
} from './settings.js';
export type { TractabilityClass } from './settings.js';

// ─── TD error ───────────────────────────────────────────────────────────────
export {
  computeTDError,
  averageReinforcementAcrossChannels,
  readingsFromMap,
} from './td-error.js';
export type {
  ChannelReading,
  TDErrorOptions,
  TDErrorResult,
} from './td-error.js';

// ─── Critic ─────────────────────────────────────────────────────────────────
export { AdaptiveCriticElement } from './critic.js';
export type { CriticOptions, CriticSnapshot } from './critic.js';

// ─── Actor update ───────────────────────────────────────────────────────────
export { buildActorSignal, applyActorSignalToScore } from './actor-update.js';
export type { ActorSignal, ActorUpdateOptions } from './actor-update.js';

// ─── Loop ───────────────────────────────────────────────────────────────────
export { AceLoop, runAceLoop } from './loop.js';
export type {
  AceLoopOptions,
  AceLoopTickInput,
  AceLoopTickResult,
} from './loop.js';
