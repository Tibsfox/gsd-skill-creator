/**
 * MD-6 Representation Audit — barrel export.
 *
 * Re-exports the public surface of the representation-audit module:
 *   - settings: AuditSettings + defaults
 *   - effective-rank: effectiveRank() + buildActivationMatrix() + types
 *   - community-separability: separability() + types
 *   - collapse-detector: detectCollapse() + AuditResult + AuditStatus
 *   - api: runAndCacheAudit() + getLatestAuditResult() + helpers
 *   - cli: representationAuditCommand() + representationAuditHelp()
 *
 * @module representation-audit
 */

// Settings
export {
  resolveSettings,
  DEFAULT_AUDIT_SETTINGS,
} from './settings.js';
export type { AuditSettings } from './settings.js';

// Effective rank
export {
  effectiveRank,
  buildActivationMatrix,
} from './effective-rank.js';
export type { EffectiveRankResult } from './effective-rank.js';

// Community separability
export { separability } from './community-separability.js';
export type {
  SeparabilityResult,
  CommunityMap,
  EmbeddingLookup,
} from './community-separability.js';

// Collapse detector
export { detectCollapse } from './collapse-detector.js';
export type {
  AuditResult,
  AuditStatus,
  DetectorInput,
} from './collapse-detector.js';

// Read API
export {
  runAndCacheAudit,
  getLatestAuditResult,
  clearAuditCache,
  isCritical,
  isHealthy,
} from './api.js';

// CLI
export {
  representationAuditCommand,
  representationAuditHelp,
} from './cli.js';
export type { RepresentationAuditCliOptions } from './cli.js';
