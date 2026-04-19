/**
 * MD-3 — Langevin Noise Injection — barrel.
 *
 * Exports:
 *   - `injectLangevinNoise`, `gaussianSample`, `mulberry32` (core primitive)
 *   - `resolveNoiseScale`, `TRACTABILITY_NOISE_GAIN`, `TractabilityClass`
 *     (tractability-gated scale resolver)
 *   - `guardDarkRoom`, `preservesDarkRoom`, `DEFAULT_DARK_ROOM_FLOOR`
 *     (SC-DARK preservation guard)
 *   - `applyLangevinUpdate` (M7 generative-model bridge with MB-2 composition)
 *   - `readLangevinEnabledFlag` (settings reader)
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin
 */

export {
  injectLangevinNoise,
  gaussianSample,
  mulberry32,
} from './noise-injector.js';

export {
  resolveNoiseScale,
  TRACTABILITY_NOISE_GAIN,
  type TractabilityClass,
} from './scale-resolver.js';

export {
  guardDarkRoom,
  preservesDarkRoom,
  DEFAULT_DARK_ROOM_FLOOR,
  type DarkRoomGuardOptions,
  type DarkRoomGuardResult,
} from './dark-room-guard.js';

export {
  applyLangevinUpdate,
  type LangevinBridgeOptions,
  type LangevinBridgeResult,
} from './generative-model-bridge.js';

export { readLangevinEnabledFlag } from './settings.js';
