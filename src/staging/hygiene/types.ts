/**
 * Type definitions for the hygiene pattern engine.
 *
 * Defines categories, severities, pattern structure, and finding
 * structure for security hygiene scanning.
 *
 * @module staging/hygiene/types
 */

/** Hygiene scan categories. */
export type HygieneCategory =
  | 'embedded-instructions'
  | 'hidden-content'
  | 'config-safety';

/** All hygiene categories as a const array for runtime use. */
export const HYGIENE_CATEGORIES = [
  'embedded-instructions',
  'hidden-content',
  'config-safety',
] as const;

/** Severity levels for hygiene findings, from most to least severe. */
export type HygieneSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** All severity levels as a const array for runtime use. */
export const HYGIENE_SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;

/**
 * A hygiene pattern that detects a specific security concern.
 *
 * Each pattern belongs to a category and has a severity level.
 * Detection is performed via either a regex (simple matching)
 * or a detect function (complex logic). At least one must be defined.
 */
export interface HygienePattern {
  /** Unique identifier (e.g., 'embedded-ignore-previous'). */
  id: string;
  /** Which category this pattern belongs to. */
  category: HygieneCategory;
  /** Human-readable name. */
  name: string;
  /** What this pattern detects and why it matters. */
  description: string;
  /** Severity level of findings from this pattern. */
  severity: HygieneSeverity;
  /** Optional regex for simple pattern matching. */
  regex?: RegExp;
  /** Optional function for complex detection logic. */
  detect?: (content: string) => HygieneFinding[];
}

/**
 * A single finding produced by a hygiene pattern scan.
 */
export interface HygieneFinding {
  /** Which pattern triggered this finding. */
  patternId: string;
  /** Category of the triggering pattern. */
  category: HygieneCategory;
  /** Severity of this finding. */
  severity: HygieneSeverity;
  /** Human-readable description of what was found. */
  message: string;
  /** Line number where found (1-based), if available. */
  line?: number;
  /** Character offset in content, if available. */
  offset?: number;
  /** The matched text, if available. */
  match?: string;
}
