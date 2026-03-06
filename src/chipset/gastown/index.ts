/**
 * Gastown orchestration chipset barrel export.
 *
 * Re-exports all public types, the StateManager class, and the
 * validateChipset function as a single entry point for consumers.
 *
 * Usage:
 *   import { gastown } from './chipset/index.js';
 *   const state = new gastown.StateManager({ stateDir: '.chipset/state' });
 *   const result = gastown.validateChipset(yaml, schemaPath);
 */

export * from './types.js';
export { StateManager } from './state-manager.js';
export type { StateManagerOptions } from './state-manager.js';
export { validateChipset } from './validate-chipset.js';
export type { ValidationResult, SectionResult } from './validate-chipset.js';
