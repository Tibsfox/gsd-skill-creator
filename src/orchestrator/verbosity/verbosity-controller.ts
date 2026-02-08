/**
 * Verbosity controller - filters output sections by verbosity level.
 *
 * Pure function module with no I/O. The orchestrator produces output as
 * an array of OutputSection objects, each annotated with a minimum
 * verbosity level. This controller filters sections by comparing their
 * minLevel against the configured verbosity level.
 *
 * At level 1 (Silent), only the routed command result appears.
 * At level 5 (Transparent), everything is visible.
 */

import type { OutputSection, VerbosityLevel } from './types.js';

/**
 * Filter output sections by verbosity level.
 *
 * Returns sections where section.minLevel <= level.
 * Empty array in, empty array out. Preserves section order.
 * Does not mutate the original array.
 *
 * @param sections - Array of tagged output sections
 * @param level - Current verbosity level (1-5)
 * @returns Filtered sections that should be displayed at the given level
 */
export function filterByVerbosity(
  sections: OutputSection[],
  level: VerbosityLevel,
): OutputSection[] {
  return sections.filter((section) => section.minLevel <= level);
}
