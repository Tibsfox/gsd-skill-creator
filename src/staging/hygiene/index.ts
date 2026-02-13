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
