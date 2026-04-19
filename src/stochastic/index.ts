/**
 * MA-3 + MD-2 — Stochastic Selection barrel export.
 *
 * Exports all public surface of the stochastic sub-module:
 *   - softmax (pure numerically-stable softmax)
 *   - sampler (softmax-weighted sampler with injectable RNG)
 *   - temperature-resolver (tractability-scaled temperature)
 *   - selector-bridge (M5 integration adapter, flag-off byte-identical)
 *   - settings (feature-flag reader)
 *
 * @module stochastic
 */

// Softmax
export { softmax, TEMPERATURE_EPSILON } from './softmax.js';

// Sampler
export { sampleByScore, mulberry32 } from './sampler.js';
export type { SampleResult } from './sampler.js';

// Temperature resolver
export { resolveTemperature, TRACTABILITY_TEMPERATURE_SCALE } from './temperature-resolver.js';

// Selector bridge
export { applyStochasticBridge } from './selector-bridge.js';
export type { BridgeOptions } from './selector-bridge.js';

// Settings
export { readStochasticEnabledFlag } from './settings.js';
