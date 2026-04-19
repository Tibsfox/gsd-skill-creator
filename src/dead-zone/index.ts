/**
 * MB-5 Dead-Zone Bounded Learning — barrel export.
 *
 * Re-exports all public types and functions from the `src/dead-zone/` subtree.
 *
 * Phase 663, Wave R5 Stability Rails, Living Sensoria v1.49.561.
 *
 * Feature flag: `gsd-skill-creator.lyapunov.dead_zone.enabled` (default OFF).
 * When off, callers fall back to M4's hard 20%-diff bound + 7-day cooldown
 * (SC-MB5-01 byte-identical gate).
 *
 * @module dead-zone/index
 */

// smooth-dead-zone
export type { DeadZoneResult } from './smooth-dead-zone.js';
export { deadZone, hardDeadZone } from './smooth-dead-zone.js';

// diff-bound-adapter
export type { DeadZoneParams } from './diff-bound-adapter.js';
export {
  DEFAULT_DEAD_ZONE_PARAMS,
  TRACTABILITY_BW_SCALE,
  adaptationScale,
} from './diff-bound-adapter.js';

// cooldown-adapter
export type { CooldownAdapterParams } from './cooldown-adapter.js';
export {
  DEFAULT_COOLDOWN_ADAPTER_PARAMS,
  recoveryScale,
  smoothDaysRemaining,
} from './cooldown-adapter.js';

// lyapunov-composer
export type { ComposedStep, ComposedDescentCertificate } from './lyapunov-composer.js';
export {
  composedVdot,
  verifyComposedDescent,
  buildFixtureTrajectory,
} from './lyapunov-composer.js';

// settings
export { readDeadZoneEnabledFlag } from './settings.js';
