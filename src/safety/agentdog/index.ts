/**
 * HB-02 AgentDoG — barrel export.
 *
 * v1.49.575 cs25-26-sweep Half B. Source: arXiv:2601.18491.
 * Default-off via `cs25-26-sweep.agentdog-schema.enabled`.
 *
 * @module safety/agentdog
 */

// Settings.
export type { AgentDogModule, AgentDogConfig } from './settings.js';
export {
  DEFAULT_AGENTDOG_CONFIG,
  isAgentDogEnabled,
  readAgentDogConfig,
} from './settings.js';

// Where axis.
export type { WhereAxis } from './where.js';
export { captureWhereAxis } from './where.js';

// How axis.
export type {
  HowAxis,
  VulnerabilityVector,
  EscalationPattern,
} from './how.js';
export {
  captureHowAxis,
  VULNERABILITY_VECTORS,
  ESCALATION_PATTERNS,
} from './how.js';

// What axis.
export type { WhatAxis, BlastRadius } from './what.js';
export {
  captureWhatAxis,
  clipAssetLabel,
  IMPACTED_ASSET_MAX_LEN,
  BLAST_RADII,
} from './what.js';

// Composite types + emitter.
export type {
  AgentDogDiagnostic,
  BlockContext,
  AgentDogEmitResult,
} from './types.js';
export { AGENTDOG_SCHEMA_VERSION } from './types.js';
export { emitAgentDogDiagnostic, AGENTDOG_DISABLED_RESULT } from './emitter.js';

// Integration shim.
export { enrichBlockWithAgentDog, hasAgentDogDiagnostic } from './integration.js';
