/**
 * @file Pacing report formatter
 * @description Produces human-readable advisory reports from PacingResult arrays.
 *              Consumed by downstream CLI (Phase 561) for display to users.
 * @module core/validation/pacing-gate
 */
import type { PacingResult } from './pacing-types.js';

/**
 * Format an array of PacingResult objects into a human-readable multi-line report.
 *
 * Each result renders as a section with a [PASS] or [WARN] indicator,
 * session ID, timestamp, and any advisory messages. The report ends
 * with an overall summary line.
 *
 * @param results - Array of PacingResult objects to format
 * @returns Multi-line string report
 */
export function formatPacingReport(results: PacingResult[]): string {
  const lines: string[] = ['Pacing Advisory Report', '='.repeat(40)];

  if (results.length === 0) {
    lines.push('', 'No pacing checks performed');
    return lines.join('\n');
  }

  let warnCount = 0;

  for (const result of results) {
    const indicator = result.status === 'pass' ? '[PASS]' : '[WARN]';
    if (result.status !== 'pass') warnCount++;

    lines.push('');
    lines.push(`${indicator} Session: ${result.sessionId} (${result.timestamp})`);

    if (result.advisories.length > 0) {
      for (const advisory of result.advisories) {
        lines.push(`  - ${advisory}`);
      }
    }
  }

  lines.push('');
  lines.push('-'.repeat(40));
  if (warnCount === 0) {
    lines.push('Overall: PASS - All checks within limits');
  } else {
    lines.push(`Overall: WARN - ${warnCount} advisory warning(s) detected`);
  }

  return lines.join('\n');
}
