/**
 * Simulated work detector for artifact verification.
 *
 * Inspects artifact content for signs of faked or minimal-effort output:
 * - Empty or whitespace-only content
 * - Insufficient size (below threshold)
 * - Missing required sections (regex pattern checks)
 * - Low uniqueness ratio (too many repeated lines)
 * - High repeated block ratio (consecutive identical lines)
 *
 * Returns human-readable explanations suitable for display
 * in commit rejection messages.
 *
 * @module autonomy/simulated-work-detector
 */

import type { GateCheck } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for simulated work detection checks.
 *
 * All fields are optional; defaults are applied for unspecified thresholds.
 */
export interface SimulatedWorkCheck {
  /** Minimum content size in bytes */
  min_size_bytes?: number;
  /** Required content sections as regex patterns */
  required_sections?: GateCheck[];
  /** Minimum ratio of unique lines to total non-empty lines (default 0.3) */
  min_unique_line_ratio?: number;
  /** Maximum ratio of lines in repeated blocks to total non-empty lines (default 0.4) */
  max_repeated_block_ratio?: number;
}

/**
 * Result of simulated work detection.
 *
 * `simulated` is true if any heuristic flagged the content.
 * `reasons` contains human-readable explanations for each failure.
 */
export interface SimulatedWorkResult {
  /** Whether the content appears to be simulated/faked work */
  simulated: boolean;
  /** Human-readable explanations for each detection (empty if not simulated) */
  reasons: string[];
}

// ============================================================================
// Heuristic helpers
// ============================================================================

/**
 * Splits content into non-empty, trimmed lines.
 */
function getNonEmptyLines(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Computes the ratio of unique lines to total non-empty lines.
 */
function computeUniqueLineRatio(lines: string[]): number {
  if (lines.length === 0) return 1;
  const uniqueSet = new Set(lines);
  return uniqueSet.size / lines.length;
}

/**
 * Detects runs of 3+ consecutive identical non-empty lines.
 *
 * Returns the total count of lines participating in repeated blocks
 * and the number of distinct repeated blocks found.
 */
function detectRepeatedBlocks(lines: string[]): { linesInBlocks: number; blockCount: number } {
  let linesInBlocks = 0;
  let blockCount = 0;
  let i = 0;

  while (i < lines.length) {
    let runLength = 1;
    while (i + runLength < lines.length && lines[i + runLength] === lines[i]) {
      runLength++;
    }

    if (runLength >= 3) {
      linesInBlocks += runLength;
      blockCount++;
    }

    i += runLength;
  }

  return { linesInBlocks, blockCount };
}

// ============================================================================
// detectSimulatedWork
// ============================================================================

/**
 * Inspects artifact content for signs of faked or minimal-effort output.
 *
 * Runs all heuristics without short-circuiting, collecting every
 * reason for detection. Returns a result with `simulated: true`
 * if any heuristic triggered.
 *
 * Heuristics:
 * 1. Empty/whitespace-only content
 * 2. Content below min_size_bytes
 * 3. Missing required sections (regex patterns)
 * 4. Low unique line ratio (below min_unique_line_ratio, default 0.3)
 * 5. High repeated block ratio (above max_repeated_block_ratio, default 0.4)
 *
 * @param content - Artifact content to inspect
 * @param checks - Configuration specifying thresholds and required sections
 * @returns SimulatedWorkResult with detection status and reasons
 */
export function detectSimulatedWork(
  content: string,
  checks: SimulatedWorkCheck,
): SimulatedWorkResult {
  const reasons: string[] = [];

  // Check 1: Empty or whitespace-only content
  if (content.trim().length === 0) {
    reasons.push('Content is empty or whitespace-only');
  }

  // Check 2: Size threshold
  if (checks.min_size_bytes !== undefined) {
    const actualSize = Buffer.byteLength(content, 'utf-8');
    if (actualSize < checks.min_size_bytes) {
      reasons.push(
        `Content size ${actualSize} bytes is below minimum ${checks.min_size_bytes} bytes`,
      );
    }
  }

  // Check 3: Required sections
  if (checks.required_sections) {
    for (const section of checks.required_sections) {
      if (!section.required) continue;

      try {
        const regex = new RegExp(section.pattern, 'm');
        if (!regex.test(content)) {
          const desc = section.description || section.pattern;
          reasons.push(`Missing required section: ${desc}`);
        }
      } catch {
        reasons.push(`Invalid regex pattern in required section: ${section.pattern}`);
      }
    }
  }

  // Only run uniqueness/repetition checks on non-empty content
  if (content.trim().length > 0) {
    const lines = getNonEmptyLines(content);

    // Check 4: Unique line ratio
    if (lines.length > 0) {
      const minRatio = checks.min_unique_line_ratio ?? 0.3;
      const ratio = computeUniqueLineRatio(lines);
      if (ratio < minRatio) {
        reasons.push(
          `Unique line ratio ${ratio.toFixed(2)} is below minimum ${minRatio} — content appears to be repeated boilerplate`,
        );
      }
    }

    // Check 5: Repeated block detection
    if (lines.length > 0) {
      const maxRatio = checks.max_repeated_block_ratio ?? 0.4;
      const { linesInBlocks, blockCount } = detectRepeatedBlocks(lines);
      const blockRatio = linesInBlocks / lines.length;
      if (blockRatio > maxRatio) {
        reasons.push(
          `Repeated block ratio ${blockRatio.toFixed(2)} exceeds maximum ${maxRatio} — detected ${blockCount} repeated blocks`,
        );
      }
    }
  }

  return {
    simulated: reasons.length > 0,
    reasons,
  };
}
