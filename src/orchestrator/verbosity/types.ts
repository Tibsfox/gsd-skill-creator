/**
 * Type definitions for the verbosity controller module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - VerbosityLevel (1-5 integer with default 3)
 * - VERBOSITY_LEVELS named constant (SILENT through TRANSPARENT)
 * - OutputSection (tagged content with minimum verbosity level)
 *
 * All schemas use .passthrough() for forward compatibility.
 */

import { z } from 'zod';

// ============================================================================
// Verbosity Level
// ============================================================================

/**
 * Zod schema for verbosity level (1-5 integer, default 3).
 *
 * 1 = Silent (result only)
 * 2 = Minimal (result + command name)
 * 3 = Standard (result + classification + lifecycle) [DEFAULT]
 * 4 = Detailed (standard + stats, gates, timing)
 * 5 = Transparent (everything visible)
 */
export const VerbosityLevelSchema = z.number().int().min(1).max(5).default(3);

export type VerbosityLevel = z.infer<typeof VerbosityLevelSchema>;

// ============================================================================
// Verbosity Level Constants
// ============================================================================

/**
 * Named constants for the 5 verbosity levels.
 *
 * Use these instead of raw numbers for readability:
 *   filterByVerbosity(sections, VERBOSITY_LEVELS.STANDARD)
 */
export const VERBOSITY_LEVELS = {
  /** Level 1: Only routed command result */
  SILENT: 1,
  /** Level 2: Result + matched command name */
  MINIMAL: 2,
  /** Level 3: Result + classification + lifecycle suggestion (DEFAULT) */
  STANDARD: 3,
  /** Level 4: Standard + discovery stats, gate decisions, timing */
  DETAILED: 4,
  /** Level 5: Everything: all scores, all candidates, all reasoning */
  TRANSPARENT: 5,
} as const;

// ============================================================================
// Output Section
// ============================================================================

/**
 * Zod schema for a tagged output section.
 *
 * Each section of orchestrator output is tagged with a minimum verbosity
 * level. The verbosity controller filters sections by comparing their
 * minLevel against the configured verbosity level.
 *
 * Uses .passthrough() to preserve extra fields for forward compatibility.
 */
export const OutputSectionSchema = z.object({
  /** Section tag (e.g., 'discovery', 'classification', 'lifecycle', 'gate', 'result') */
  tag: z.string(),
  /** The actual output text */
  content: z.string(),
  /** Minimum verbosity level to display this section */
  minLevel: VerbosityLevelSchema,
}).passthrough();

export type OutputSection = z.infer<typeof OutputSectionSchema>;
