/**
 * Type barrel exports for the GSD Skill Creator.
 *
 * Re-exports security types for v1.38 SSH Agent Security milestone.
 * Other type modules are imported directly by path as they predate
 * this barrel file.
 *
 * @module types
 */

export {
  DomainCredentialSchema,
  SecurityEventSchema,
  SandboxProfileSchema,
  ProxyConfigSchema,
  AgentIsolationStateSchema,
} from './security.js';

export type {
  DomainCredential,
  SecurityEvent,
  SandboxProfile,
  ProxyConfig,
  AgentIsolationState,
} from './security.js';

// v1.50.13 Hindsight Corrections — enforcement type re-exports
export type { PacingConfig, PacingResult, ArtifactTimestamp, PacingStatus } from '../validation/pacing-gate/index.js';
export { DEFAULT_PACING_CONFIG } from '../validation/pacing-gate/index.js';
export type { BatchDetectionConfig, BatchDetectionResult, DepthMarker, DepthMarkerCategory, BatchHeuristicResult } from '../validation/batch-detection/index.js';
export { DEFAULT_BATCH_DETECTION_CONFIG } from '../validation/batch-detection/index.js';
