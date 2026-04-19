/**
 * MD-4 Temperature Schedule — Barrel export.
 *
 * Public API surface for the `temperature` module:
 *   - `currentTemperature()` — module-level read API for MA-3+MD-2
 *   - `currentEta0()` — module-level read API for MD-3
 *   - `defaultApi` — default TemperatureApi singleton
 *   - `TemperatureApi` — class for isolated instances (testing, multi-context)
 *   - `computeTemperature` — pure function for stateless consumers
 *   - `resetTemperature` — warm-restart pure function
 *   - `mapQuintessenceToBaseTemp`, `mapSnapshotToBaseTemp` — mapper layer
 *   - `computeTractTempering`, `applyTractTempering` — tempering layer
 *   - `createSettings`, `DEFAULT_SETTINGS`, `SENTINEL_TEMPERATURE` — settings
 *   - All relevant types
 *
 * @module temperature
 */

// Settings
export {
  DEFAULT_SETTINGS,
  SENTINEL_TEMPERATURE,
  createSettings,
} from './settings.js';
export type { TemperatureScheduleSettings } from './settings.js';

// Quintessence mapper
export {
  mapQuintessenceToBaseTemp,
  mapSnapshotToBaseTemp,
  extractQuintessenceSignal,
} from './quintessence-mapper.js';
export type { QuintessenceSignal } from './quintessence-mapper.js';

// Tractability tempering
export {
  computeTractTempering,
  applyTractTempering,
  factorForClass,
  EMPTY_MIX_DEFAULT,
  TRACT_TEMPERING_FLOOR,
  TRACT_TEMPERING_CEILING,
} from './tract-tempering.js';
export type { SkillMixEntry } from './tract-tempering.js';

// Schedule (core pure function)
export {
  computeTemperature,
  resetTemperature,
} from './schedule.js';
export type { TemperatureResult } from './schedule.js';

// Read API
export {
  TemperatureApi,
  defaultApi,
  currentTemperature,
  currentEta0,
  ETA0_SCALE,
} from './api.js';
