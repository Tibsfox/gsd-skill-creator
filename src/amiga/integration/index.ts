/**
 * Barrel exports for the AMIGA integration module.
 *
 * This module provides cross-component integration between MC-1 (Control Surface)
 * and ME-1 (Mission Environment), validating end-to-end telemetry flow, command
 * dispatch, gate interaction, and mission lifecycle.
 */

export { MissionController } from './mission-controller.js';
export type { MissionControllerConfig, MissionControllerState } from './mission-controller.js';
