/**
 * Activation Steering Runtime — public API (Phase 767, T1c W5).
 *
 * Inference-time activation steering for gsd-skill-creator agents, built on
 * the local-linearity property of LLM activations from
 *
 *   - arXiv:2604.19018 (Skifstad, Yang, Chou — *Local Linearity of LLMs*)
 *
 * and composed *on top of* the v1.49.572 T1c semantic-channel formalism at
 * [`docs/substrate/semantic-channel.md`](../../docs/substrate/semantic-channel.md).
 *
 * The module is **default-OFF**. With the opt-in flag absent or false:
 *
 *   - `steer(input, role, target)` returns
 *     `{ disabled: true, vector: [...input], delta: [0,...], deltaNorm: 0, gain: 0 }`
 *     — a zero-side-effect passthrough;
 *   - no DACP byte is read or written;
 *   - no file I/O occurs beyond the single `fs.readFileSync` performed by
 *     the settings reader.
 *
 * ## Hard preservation invariants — Gate G11
 *
 *   1. `src/dacp/` is byte-identical pre and post `npx vitest run
 *      src/activation-steering`. Enforced by
 *      `__tests__/dacp-byte-identical.test.ts` which hashes every file
 *      under `src/dacp/` with SHA-256 before and after running this
 *      module's surface (with the flag off).
 *   2. No DACP wire-format mutation. The steering layer is an additional
 *      metadata channel on top of the (intent / data / code) bundle, not
 *      a modification of it. This module never imports DACP at runtime
 *      (only `import type` is permitted, and currently it imports zero
 *      DACP types — the controller works on raw activation vectors).
 *   3. Default-off byte-identical: passthrough with flag off.
 *   4. No runtime imports from CAPCOM-path or orchestrator-path code.
 *      Enforced by a grep sweep in the test suite (the source-regex
 *      sweep checked at gate close).
 *
 * ## Public API
 *
 *   - `steer(activationVector, craftRole, target) => SteeringResult` — the
 *     headline entry point.
 *   - `buildTarget(role, tier, dim)` — deterministic activation-space
 *     target for a (role, tier) pair.
 *   - `validateLocalLinearity(samples, threshold?)` — runtime advisory
 *     check on the linearity assumption.
 *   - `isActivationSteeringEnabled()` — settings reader.
 *
 * @module activation-steering
 */

import { buildTarget } from './craft-role-mapper.js';
import { validateLocalLinearity } from './local-linearity-validator.js';
import {
  DEFAULT_STEERING_GAIN,
  isActivationSteeringEnabled,
  readActivationSteeringConfig,
} from './settings.js';
import { controllerStep, passthroughStep } from './steering-controller.js';
import type { CRAFTRole, SteeringResult, SteeringTarget } from './types.js';

// ---------------------------------------------------------------------------
// Type re-exports
// ---------------------------------------------------------------------------

export type {
  CRAFTRole,
  LinearityFit,
  ModelTier,
  SteeringResult,
  SteeringTarget,
} from './types.js';

export { CRAFT_ROLES, MODEL_TIERS } from './types.js';

// ---------------------------------------------------------------------------
// Settings re-exports
// ---------------------------------------------------------------------------

export type { ActivationSteeringConfig } from './settings.js';

export {
  DEFAULT_ACTIVATION_STEERING_CONFIG,
  DEFAULT_LINEARITY_THRESHOLD,
  DEFAULT_STEERING_GAIN,
  isActivationSteeringEnabled,
  readActivationSteeringConfig,
} from './settings.js';

// ---------------------------------------------------------------------------
// Mapper / validator / controller re-exports
// ---------------------------------------------------------------------------

export { buildTarget, enumerateAllTargets } from './craft-role-mapper.js';
export { controllerStep, passthroughStep } from './steering-controller.js';
export {
  validateLocalLinearity,
  type LinearitySample,
} from './local-linearity-validator.js';

// ---------------------------------------------------------------------------
// `steer()` — headline API
// ---------------------------------------------------------------------------

export interface SteerOptions {
  /** Override the settings file path (used by tests). */
  readonly settingsPath?: string;
  /** Force the flag on or off, bypassing the settings file (tests). */
  readonly forceEnabled?: boolean;
  /** Override the proportional gain (0, 1]. */
  readonly gain?: number;
}

/**
 * Steer an activation vector toward the (role, tier) target.
 *
 * With the flag off (the default), this is a pure passthrough: the result
 * has `disabled: true`, the input vector cloned, and a zero-vector delta.
 *
 * @param activationVector  Current activation (any length ≥ 1).
 * @param craftRole         CRAFT role used by the role mapper.
 * @param target            Pre-built target, OR caller may pass a tier and
 *                          let the function build the target via
 *                          `buildTarget(role, tier, dim)`. We accept a full
 *                          `SteeringTarget` so the caller can re-use a
 *                          target vector across many `steer()` calls.
 * @param options           Optional overrides.
 */
export function steer(
  activationVector: readonly number[],
  craftRole: CRAFTRole,
  target: SteeringTarget,
  options: SteerOptions = {},
): SteeringResult {
  // Validate inputs cheaply.
  if (!Array.isArray(activationVector) && !(activationVector instanceof Float64Array)) {
    throw new Error('steer: activationVector must be an array of numbers');
  }
  if (target.role !== craftRole) {
    // Not fatal — the caller may want to steer toward a different role's
    // target as a counterfactual. But we surface it via a label.
    // (No throw: the controller does not care what the label says.)
  }

  // Resolve flag.
  const cfg = readActivationSteeringConfig(options.settingsPath);
  const enabled =
    typeof options.forceEnabled === 'boolean'
      ? options.forceEnabled
      : cfg.enabled === true;

  if (!enabled) {
    const step = passthroughStep(activationVector);
    return {
      disabled: true,
      vector: step.nextActivation,
      delta: step.delta,
      deltaNorm: step.deltaNorm,
      gain: step.gain,
      targetLabel: target.label,
    };
  }

  // Active path: dimension check, then a single controller step.
  if (activationVector.length !== target.vector.length) {
    throw new Error(
      `steer: dim mismatch — activation=${activationVector.length} target=${target.vector.length}`,
    );
  }
  const gain = options.gain ?? cfg.gain ?? DEFAULT_STEERING_GAIN;
  const step = controllerStep(activationVector, target.vector, gain);
  return {
    disabled: false,
    vector: step.nextActivation,
    delta: step.delta,
    deltaNorm: step.deltaNorm,
    gain: step.gain,
    targetLabel: target.label,
  };
}

/**
 * Convenience wrapper: build a target from (role, tier, dim) on the fly,
 * then steer once. Useful for one-shot calls.
 */
export function steerToward(
  activationVector: readonly number[],
  craftRole: CRAFTRole,
  tier: import('./types.js').ModelTier,
  options: SteerOptions = {},
): SteeringResult {
  const target = buildTarget(craftRole, tier, activationVector.length);
  return steer(activationVector, craftRole, target, options);
}

/**
 * Quick advisory linearity check from a small recent activation history.
 * The caller passes the most recent (x_n, x_{n+1}) pairs; the validator
 * returns a `LinearityFit` whose `warning` field is non-undefined if the
 * residual exceeds the configured threshold.
 */
export function quickLinearityCheck(
  samples: readonly { x: readonly number[]; y: readonly number[] }[],
  options: { threshold?: number; settingsPath?: string } = {},
): import('./types.js').LinearityFit {
  const cfg = readActivationSteeringConfig(options.settingsPath);
  const threshold =
    options.threshold ?? cfg.linearityThreshold ?? 0.1;
  return validateLocalLinearity(samples, threshold);
}

// Re-export for callers who want the helper alongside the headline API.
export { isActivationSteeringEnabled as _isEnabled };
