/**
 * ME-1 Tractability Classifier — barrel export.
 *
 * Re-exports the public surface of the tractability module:
 *   - classifier: pure classifySkill() + types
 *   - audit: repo-wide runAudit() + report types
 *   - selector-api: getTractabilityClass() + convenience predicates
 *   - cli: tractabilityCommand() + tractabilityHelp()
 *
 * @module tractability
 */

// Core classifier
export {
  classifySkill,
  classifySkillFromRaw,
} from './classifier.js';
export type {
  ClassificationResult,
  TractabilityEvidence,
  ObservationStats,
  TractabilityClass,
} from './classifier.js';

// Audit
export {
  runAudit,
  formatAuditReport,
  DEFAULT_SCAN_DIRS,
} from './audit.js';
export type {
  AuditReport,
  AuditEntry,
  AuditOptions,
  ClassCounts,
} from './audit.js';

// Selector API (phase 655 wiring point)
export {
  getTractabilityClass,
  isTractable,
  isCoinFlip,
  tractabilityWeight,
  batchClassify,
} from './selector-api.js';

// CLI
export {
  tractabilityCommand,
  tractabilityHelp,
} from './cli.js';
export type { TractabilityCliOptions } from './cli.js';
