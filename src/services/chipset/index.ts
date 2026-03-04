/**
 * Top-level barrel for the chipset architecture module.
 *
 * Re-exports all 5 sub-modules as namespaces to avoid name collisions
 * across the copper, blitter, teams, exec, and integration subsystems.
 *
 * Usage:
 *   import { copper, blitter, teams, exec, integration } from './chipset/index.js';
 *   const sync = new copper.LifecycleSync();
 *   const bridge = new integration.StackBridge();
 */

export * as copper from './copper/index.js';
export * as blitter from './blitter/index.js';
export * as teams from './teams/index.js';
export * as exec from './exec/index.js';
export * as integration from './integration/index.js';

// Muse chipset system
export {
  validateMuseChipset,
  isMuseChipset,
  getMuseOrientation,
} from './muse-schema-validator.js';
export type {
  MuseId,
  MuseType,
  MuseOrientation,
  MuseVoice,
  MuseValidationResult,
  VoiceStyle,
} from './muse-schema-validator.js';

// Muse plane engine
export { MusePlaneEngine } from './muse-plane-engine.js';
export type {
  MusePlanePosition,
  MuseDistance,
  MuseActivation,
  CartesianPosition,
} from './muse-plane-types.js';
