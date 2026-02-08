/**
 * Deterministic markdown renderer for CapabilityManifest.
 *
 * Converts a CapabilityManifest into CAPABILITIES.md content with
 * YAML frontmatter and markdown tables. Same input always produces
 * byte-identical output for staleness detection.
 */

import type { CapabilityManifest } from './types.js';

/**
 * Render a CapabilityManifest as a markdown string with YAML frontmatter.
 */
export function renderManifest(_manifest: CapabilityManifest): string {
  throw new Error('Not implemented');
}
