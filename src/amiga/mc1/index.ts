/**
 * Barrel exports for the MC-1 Control Surface module.
 *
 * MC-1 provides three capabilities:
 * - Stub ME-1: Test data source emitting valid ICD-01 telemetry events
 * - Dashboard: State manager that consumes telemetry and produces view models
 * - Command Parser: Converts text input to structured ICD-01 command objects
 */

// Stub ME-1 telemetry emitter
export {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createGateSequence,
  createFullLifecycleSequence,
} from './stub-me1.js';
export type { StubME1Config, StubEvent } from './stub-me1.js';

// Command parser
export { parseCommand, SUPPORTED_COMMANDS } from './command-parser.js';
export type { ParseResult, ParseError, SupportedCommand } from './command-parser.js';

// Dashboard state manager
export { Dashboard } from './dashboard.js';
export type {
  DashboardView,
  MissionView,
  TeamStatusView,
  CheckpointView,
} from './dashboard.js';
