/**
 * Unified hygiene scan engine.
 *
 * Combines all category-specific scanners into a single scanContent
 * function that checks for embedded instructions, hidden content,
 * and configuration safety issues.
 *
 * @module staging/hygiene/scanner
 */

import { scanEmbeddedInstructions } from './scanner-embedded.js';
import { scanHiddenContent } from './scanner-hidden.js';
import { scanConfigSafety } from './scanner-config.js';
import type { HygieneFinding } from './types.js';

/**
 * Scan content for all hygiene issues across every category.
 *
 * Runs the embedded-instructions, hidden-content, and config-safety
 * scanners in sequence and returns a single flat array of findings.
 *
 * @param content - Text content to scan
 * @returns Combined findings from all scanners (empty if clean)
 */
export function scanContent(content: string): HygieneFinding[] {
  return [
    ...scanEmbeddedInstructions(content),
    ...scanHiddenContent(content),
    ...scanConfigSafety(content),
  ];
}
