/**
 * Test Quality — Classifier for test evidence quality
 *
 * Distinguishes shape-only checks (file existence, line counts, export counts)
 * from behavioral assertions (function output, error handling, state transitions).
 * Used by the verification gate to produce advisory (non-blocking) warnings.
 */

// ============================================================================
// Pattern definitions
// ============================================================================

/**
 * Patterns that indicate shape-only test evidence.
 * These checks prove code EXISTS but not that it WORKS.
 */
const SHAPE_ONLY_PATTERNS = [
  { pattern: /existsSync|\.exists\b|file.*exists|stat\(/i, label: 'file existence check' },
  { pattern: /lineCount|line.*count|lines\.length|split.*\n.*length/i, label: 'line count check' },
  { pattern: /\.length\s*={1,3}\s*\d+|exports\.length|count\s*={1,3}\s*\d+/i, label: 'export/count check' },
  { pattern: /min_lines|min_size|fileSize/i, label: 'size threshold check' },
];

/**
 * Patterns that indicate behavioral test evidence.
 * These checks prove code DOES something correct.
 */
const BEHAVIORAL_PATTERNS = [
  { pattern: /expect\(.*\)\.toBe\(/i, label: 'output assertion' },
  { pattern: /expect\(.*\)\.toEqual\(/i, label: 'deep equality assertion' },
  { pattern: /expect\(.*\)\.toThrow\(/i, label: 'error handling assertion' },
  { pattern: /expect\(.*\)\.toThrow$/im, label: 'error handling assertion' },
  { pattern: /expect\(.*\.state\)/i, label: 'state transition assertion' },
  { pattern: /expect\(.*Status\)/i, label: 'status assertion' },
  { pattern: /lifecycleState/i, label: 'lifecycle state check' },
  { pattern: /expect\(.*\)\.toHaveBeenCalled/i, label: 'side effect assertion' },
  { pattern: /\.mock\.(calls|results)/i, label: 'mock verification' },
  { pattern: /expect\(.*\)\.toContain\(/i, label: 'content matching assertion' },
  { pattern: /expect\(.*\)\.toMatch\(/i, label: 'pattern matching assertion' },
  { pattern: /expect\(.*\)\.not\.toBe\(/i, label: 'negation assertion' },
  { pattern: /expect\(.*\)\.toBeNull\(\)/i, label: 'null assertion' },
];

// ============================================================================
// classifyTestEvidence
// ============================================================================

/**
 * Classify test evidence text as shape-only, behavioral, or unknown.
 *
 * @param {string} evidenceText - The test code or evidence description to classify
 * @returns {{ classification: 'shape-only'|'behavioral'|'unknown', reason: string }}
 */
function classifyTestEvidence(evidenceText) {
  if (!evidenceText || evidenceText.trim() === '') {
    return { classification: 'unknown', reason: 'No test evidence provided' };
  }

  const shapeMatches = [];
  const behavioralMatches = [];

  for (const { pattern, label } of SHAPE_ONLY_PATTERNS) {
    if (pattern.test(evidenceText)) {
      shapeMatches.push(label);
    }
  }

  for (const { pattern, label } of BEHAVIORAL_PATTERNS) {
    if (pattern.test(evidenceText)) {
      behavioralMatches.push(label);
    }
  }

  // Behavioral trumps shape-only
  if (behavioralMatches.length > 0) {
    const unique = [...new Set(behavioralMatches)];
    return {
      classification: 'behavioral',
      reason: unique.join(', '),
    };
  }

  if (shapeMatches.length > 0) {
    const unique = [...new Set(shapeMatches)];
    return {
      classification: 'shape-only',
      reason: unique.join(', '),
    };
  }

  return { classification: 'unknown', reason: 'No test evidence provided' };
}

// ============================================================================
// formatAdvisoryMessage
// ============================================================================

/**
 * Format a human-readable advisory message for test quality classification.
 *
 * @param {{ reqId: string, classification: 'shape-only'|'behavioral'|'unknown', reason: string }} params
 * @returns {string} Formatted advisory message
 */
function formatAdvisoryMessage({ reqId, classification, reason }) {
  if (classification === 'behavioral') {
    return `✓ Requirement ${reqId}: behavioral evidence confirmed (${reason})`;
  }

  if (classification === 'shape-only') {
    return [
      `⚠ ADVISORY: Requirement ${reqId} has insufficient behavioral evidence`,
      `  Evidence: ${reason}`,
      `  Classification: shape-only (checks file existence, line counts, or export counts)`,
      ``,
      `  What "behavioral" means: Tests that assert function outputs, side effects,`,
      `  error handling, or state transitions — proving the code DOES something correct.`,
      ``,
      `  What "shape-only" means: Tests that only verify files exist, line counts meet`,
      `  thresholds, or exports are present — proving the code EXISTS but not that it works.`,
      ``,
      `  This is advisory (non-blocking). Improve coverage by adding behavioral tests.`,
    ].join('\n');
  }

  // unknown
  return `⚠ ADVISORY: Requirement ${reqId} has no test evidence (${reason})`;
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  classifyTestEvidence,
  formatAdvisoryMessage,
  SHAPE_ONLY_PATTERNS,
  BEHAVIORAL_PATTERNS,
};
