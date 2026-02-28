/**
 * Hygiene pattern engine module.
 *
 * Public API for security hygiene scanning. Provides pattern detection
 * across three categories: embedded instructions, hidden content, and
 * configuration safety.
 *
 * @module staging/hygiene
 */

// Types (type-only exports)
export type {
  HygieneCategory,
  HygieneSeverity,
  HygienePattern,
  HygieneFinding,
} from './types.js';

// Constants
export { HYGIENE_CATEGORIES, HYGIENE_SEVERITIES } from './types.js';

// Pattern registry
export {
  getPatterns,
  getAllPatterns,
  addPattern,
  resetPatterns,
  BUILTIN_PATTERN_COUNT,
} from './patterns.js';

// Individual scanners
export { scanEmbeddedInstructions } from './scanner-embedded.js';
export { scanHiddenContent } from './scanner-hidden.js';
export { scanConfigSafety } from './scanner-config.js';

// Unified scanner
export { scanContent } from './scanner.js';

// Scope coherence checker
export type {
  ScopeDeclaration,
  CoherenceFinding,
  CoherenceResult,
} from './scope-coherence.js';
export { checkScopeCoherence } from './scope-coherence.js';

// Trust tier types and classification
export type {
  FamiliarityTier,
  TrustClassification,
  ContentSourceInfo,
} from './trust-types.js';
export { FAMILIARITY_TIERS, CRITICAL_PATTERN_IDS } from './trust-types.js';
export { classifyFamiliarity } from './familiarity.js';

// Trust decay store
export type {
  TrustLevel,
  TrustEntry,
  TrustStore,
} from './trust-store.js';
export { TRUST_LEVELS, TRUST_DURATIONS, createTrustStore } from './trust-store.js';

// Finding actions
export type {
  FindingAction,
  FindingActionResult,
} from './finding-actions.js';
export { FINDING_ACTIONS, applyFindingAction } from './finding-actions.js';

// Report generator
export type {
  ImportanceLevel,
  ReportFinding,
  HygieneReport,
} from './report.js';
export { generateHygieneReport } from './report.js';
