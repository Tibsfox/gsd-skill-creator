/**
 * @file Chain report formatter
 * @description Produces human-readable advisory reports from ChainValidationResult.
 *              Consumed by downstream CLI (Phase 561) for display to users.
 * @module tools/commands/lessons-chain
 */
import type { ChainValidationResult } from './chain-runner.js';

/**
 * Formats a ChainValidationResult into a human-readable multi-line advisory report.
 * Includes [PASS]/[FAIL] indicators for each section, catalog summary,
 * promoted patterns, errors, and overall status.
 *
 * @param result - Combined chain validation result to format
 * @returns Multi-line string report
 */
export function formatChainReport(result: ChainValidationResult): string {
  const { chainIntegrity, catalog, overallStatus, errors } = result;
  const lines: string[] = ['Lessons-Learned Chain Advisory Report', '='.repeat(40)];

  // Chain Integrity section
  const integrityIndicator = chainIntegrity.valid ? '[PASS]' : '[FAIL]';
  lines.push('');
  lines.push(`${integrityIndicator} Chain Integrity`);
  lines.push(`  Position: ${chainIntegrity.chainPosition} of ${chainIntegrity.totalInSeries} in series`);
  if (chainIntegrity.priorLessonsFound) {
    lines.push(`  Prior lessons: ${chainIntegrity.priorLessonsPath}`);
  } else {
    lines.push('  Prior lessons: not found');
  }

  // Forward Reference section
  const forwardIndicator = chainIntegrity.forwardReferenceFound ? '[PASS]' : '[FAIL]';
  lines.push('');
  lines.push(`${forwardIndicator} Forward Reference`);
  if (chainIntegrity.forwardReferenceFound) {
    lines.push(`  Referenced in: ${chainIntegrity.forwardReferencePath}`);
  }

  // Catalog Summary section
  lines.push('');
  lines.push('Catalog Summary');
  lines.push(`  Total lessons: ${catalog.totalLessons}`);
  lines.push(`  Unique patterns: ${catalog.uniquePatterns}`);

  // Promoted Patterns section
  lines.push('');
  lines.push('Promoted Patterns');
  if (catalog.promotedPatterns.length > 0) {
    lines.push(`  ${catalog.promotedPatterns.length} pattern(s) flagged for codification:`);
    for (const pattern of catalog.promotedPatterns) {
      lines.push(`  - ${pattern}`);
    }
  } else {
    lines.push('  None');
  }

  // Errors section
  if (errors.length > 0) {
    lines.push('');
    lines.push('Errors');
    for (const error of errors) {
      lines.push(`  - ${error}`);
    }
  }

  // Overall summary
  lines.push('');
  lines.push('-'.repeat(40));
  const summaryMap: Record<string, string> = {
    intact: 'Overall: INTACT - Lessons-learned chain is healthy',
    broken: 'Overall: BROKEN - Chain integrity issues detected',
    incomplete: 'Overall: INCOMPLETE - Chain exists but has gaps',
  };
  lines.push(summaryMap[overallStatus]);

  return lines.join('\n');
}
