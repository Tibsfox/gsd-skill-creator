/**
 * Mission-State World-Model layer — public API.
 *
 * Default-off module shipped by Phase 732 (v1.49.571 Heuristics-Free Skill Space).
 * Source: Maes, Le Lidec, Scieur, LeCun, Balestriero 2026, LeWorldModel.
 *
 * HARD CAPCOM PRESERVATION — the predictor sits UNDER the CAPCOM human-gate.
 * Every returned plan is advisory. The action enum excludes every gate-bypass
 * variant by construction, and a runtime guard (`assertNoGateBypassAction`)
 * double-checks against hostile string inputs.
 *
 * Opt-in via `.claude/gsd-skill-creator.json`:
 *
 *     "heuristics-free-skill-space": {
 *       "mission_world_model": { "enabled": true }
 *     }
 *
 * @module mission-world-model
 */

export type {
  MissionAction,
  MissionState,
  MissionLatent,
  MissionWorldModelConfig,
  AdvisoryPlan,
} from './types.js';

export { DEFAULT_CONFIG, FORBIDDEN_ACTION_NAMES } from './types.js';

export { encodeMissionState } from './encoder.js';

export {
  predictNextLatent,
  rollout,
  assertNoGateBypassAction,
} from './predictor.js';

export { planWaveAdvisory } from './cem.js';
