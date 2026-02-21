/**
 * Barrel exports for the AMIGA integration module.
 *
 * This module provides cross-component integration between MC-1 (Control Surface),
 * ME-1 (Mission Environment), CE-1 (Commons Engine), and GL-1 (Governance Layer),
 * validating end-to-end telemetry flow, attribution recording, governance evaluation,
 * command dispatch, gate interaction, and mission lifecycle.
 */

export { MissionController } from './mission-controller.js';
export type { MissionControllerConfig, MissionControllerState } from './mission-controller.js';

export { FullStackController } from './full-stack-controller.js';
export type { FullStackConfig, FullStackResult } from './full-stack-controller.js';
