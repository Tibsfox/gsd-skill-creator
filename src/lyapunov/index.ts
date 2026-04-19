/**
 * MB-1 Lyapunov-Stable K_H Adaptation — barrel.
 *
 * Exports:
 *   - `evaluateLyapunov`, `verifyDescentCertificate`, `isPositiveDefinite`,
 *     `LyapunovCandidate`, `LyapunovInputs`, `DescentCertificate` (Lyapunov fn)
 *   - `adaptKH`, `buildRegressor`, `resolveTractabilityGain`,
 *     `TRACTABILITY_GAIN_TABLE`, `DEFAULT_GAIN_G`, `DEFAULT_GAIN_GAMMA`,
 *     `DEFAULT_RECENCY_TAU_MS`, `AdaptKHOptions`, `AdaptKHResult`,
 *     `RegressorInputs` (adaptation law)
 *   - `computeLyapunovKH`, `applyLyapunovKHInPlace`, `BridgeInputs`,
 *     `BridgeResult` (M6 bridge)
 *   - `readLyapunovEnabledFlag` (settings reader)
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MB-1-lyapunov-K_H.md
 *
 * @module lyapunov
 */

export {
  evaluateLyapunov,
  verifyDescentCertificate,
  isPositiveDefinite,
  type LyapunovCandidate,
  type LyapunovInputs,
  type DescentCertificate,
} from './lyapunov-function.js';

export {
  adaptKH,
  buildRegressor,
  resolveTractabilityGain,
  TRACTABILITY_GAIN_TABLE,
  DEFAULT_GAIN_G,
  DEFAULT_GAIN_GAMMA,
  DEFAULT_RECENCY_TAU_MS,
  type AdaptKHOptions,
  type AdaptKHResult,
  type RegressorInputs,
} from './k_h-adaptation.js';

export {
  computeLyapunovKH,
  applyLyapunovKHInPlace,
  type BridgeInputs,
  type BridgeResult,
} from './desensitisation-bridge.js';

export { readLyapunovEnabledFlag } from './settings.js';
