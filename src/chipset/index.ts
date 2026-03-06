/**
 * Top-level barrel for the chipset architecture module.
 *
 * Re-exports all 6 sub-modules as namespaces to avoid name collisions
 * across the copper, blitter, teams, exec, integration, and gastown subsystems.
 *
 * Usage:
 *   import { copper, blitter, teams, exec, integration, gastown } from './chipset/index.js';
 *   const sync = new copper.LifecycleSync();
 *   const bridge = new integration.StackBridge();
 *   const state = new gastown.StateManager({ stateDir: '.chipset/state' });
 */

export * as copper from './copper/index.js';
export * as blitter from './blitter/index.js';
export * as teams from './teams/index.js';
export * as exec from './exec/index.js';
export * as integration from './integration/index.js';
export * as gastown from './gastown/index.js';
export * from './muse-schema-validator.js';
