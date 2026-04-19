/**
 * MD-3 — Generative Model Bridge.
 *
 * Adapter that wraps M7's online generative-model parameter update with
 * MD-3 Langevin noise injection. Composes correctly with MB-2's simplex
 * projection: the order is **noise → guard → project → commit** so the
 * post-noise parameters are pulled back onto the simplex before any
 * downstream consumer (free-energy, action policy) sees them.
 *
 * Flag-off (default) the bridge runs the same compose pipeline minus the
 * noise step, producing a vector byte-identical to MB-2's flag-off / M7
 * baseline path. SC-MD3-01: `applyLangevinUpdate(params, ..., enabled=false)`
 * equals MB-2's `projectModelRow(params)` exactly.
 *
 * The bridge does **not** mutate `src/umwelt/generativeModel.ts`. It is a
 * standalone adapter that callers (sc-dev-team, exploration harness) can
 * compose into their own update path. Per task constraint: extend via
 * bridge only.
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin/generative-model-bridge
 */

import { projectModelRow, type RowProjectionResult } from '../projection/generative-model-projector.js';
import { injectLangevinNoise } from './noise-injector.js';
import { resolveNoiseScale, type TractabilityClass } from './scale-resolver.js';
import { guardDarkRoom, DEFAULT_DARK_ROOM_FLOOR } from './dark-room-guard.js';
import { readLangevinEnabledFlag } from './settings.js';

/**
 * Options for {@link applyLangevinUpdate}.
 */
export interface LangevinBridgeOptions {
  /** Override the langevin-enabled flag. Test-only. */
  langevinEnabled?: boolean;
  /** Override path to settings.json. */
  settingsPath?: string;
  /** Base noise scale (e.g. SGLD schedule output). Default 0 (no noise). */
  baseScale?: number;
  /**
   * Tractability class for the skill being updated. Drives the noise gain
   * via {@link resolveNoiseScale}. Default `'unknown'`.
   */
  tractability?: TractabilityClass;
  /** Confidence on the tractability classification, [0, 1]. Default 1. */
  tractabilityConfidence?: number;
  /**
   * Uniform `[0, 1)` PRNG. When omitted, `Math.random` is used. Tests
   * should pass a seeded Mulberry32 for determinism.
   */
  rng?: () => number;
  /** SC-DARK floor. Default 0.1 (matches actionPolicy default). */
  minActivity?: number;
  /**
   * Enable MB-2 projection via the row projector. When omitted the
   * projector reads its own `gsd-skill-creator.lyapunov.projection.enabled`
   * flag. Pass `true`/`false` here to override (test-only).
   */
  projectionEnabled?: boolean;
}

/**
 * Result of the bridge update.
 */
export interface LangevinBridgeResult {
  /** Final parameter vector ready to commit to M7. Always simplex-admissible. */
  params: number[];
  /** Whether the langevin-enabled flag was on for this update. */
  langevinEnabled: boolean;
  /** Resolved scale used for noise (0 when flag-off or safety valve). */
  effectiveScale: number;
  /** Tractability class consulted. */
  tractability: TractabilityClass;
  /** Whether the dark-room guard rejected the noisy update. */
  darkRoomRejected: boolean;
  /** Activity (sum) of the noisy vector pre-projection. */
  noisyActivity: number;
  /** Activity (sum) of the original vector. */
  originalActivity: number;
  /** Underlying MB-2 row-projection diagnostics. */
  projection: RowProjectionResult;
}

/**
 * Compose a Langevin-style update over M7's online parameter row.
 *
 * Pipeline:
 *   1. Read langevin-enabled flag (or use the explicit override).
 *   2. Resolve effective scale via tractability gain.
 *   3. Inject Gaussian noise (skipped when flag-off, scale=0, or
 *      tractability gain collapses scale).
 *   4. Run dark-room guard on the noisy vector; revert to original on
 *      rejection.
 *   5. Project the (possibly noisy) vector onto the simplex via MB-2.
 *
 * Pure with respect to inputs except for the rng (and any side effects of
 * `readLangevinEnabledFlag` / `readProjectionEnabledFlag`, both of which
 * only read settings.json).
 *
 * SC-MD3-01: when `langevinEnabled === false` (default), the result is
 * byte-identical to `projectModelRow(params, { projectionEnabled })`.
 */
export function applyLangevinUpdate(
  params: readonly number[],
  opts: LangevinBridgeOptions = {},
): LangevinBridgeResult {
  const langevinEnabled =
    opts.langevinEnabled ?? readLangevinEnabledFlag(opts.settingsPath);
  const tractability = opts.tractability ?? 'unknown';
  const baseScale = opts.baseScale ?? 0;
  const minActivity = opts.minActivity ?? DEFAULT_DARK_ROOM_FLOOR;

  // ── Step 1-2: scale resolution ──────────────────────────────────────────
  const effectiveScale = langevinEnabled
    ? resolveNoiseScale(baseScale, tractability, opts.tractabilityConfidence)
    : 0;

  // ── Step 3: noise injection (or pass-through copy) ──────────────────────
  let candidate: number[];
  let noisyActivity: number;
  let originalActivity = 0;
  for (let i = 0; i < params.length; i++) {
    const x = params[i];
    if (Number.isFinite(x)) originalActivity += Math.max(0, x as number);
  }

  let darkRoomRejected = false;
  if (effectiveScale > 0) {
    const rng = opts.rng ?? Math.random;
    const noisy = injectLangevinNoise(params, effectiveScale, rng);

    // ── Step 4: dark-room guard ───────────────────────────────────────────
    const guard = guardDarkRoom(params, noisy, { minActivity });
    candidate = guard.accepted;
    noisyActivity = guard.noisyActivity;
    darkRoomRejected = guard.rejected;
  } else {
    // No noise — pass-through fresh copy preserves SC-MD3-01.
    candidate = new Array<number>(params.length);
    for (let i = 0; i < params.length; i++) candidate[i] = params[i]!;
    noisyActivity = originalActivity;
  }

  // ── Step 5: project to simplex via MB-2 ────────────────────────────────
  const projection = projectModelRow(candidate, {
    projectionEnabled: opts.projectionEnabled,
    settingsPath: opts.settingsPath,
    tractability,
  });

  return {
    params: projection.projected,
    langevinEnabled,
    effectiveScale,
    tractability,
    darkRoomRejected,
    noisyActivity,
    originalActivity,
    projection,
  };
}
