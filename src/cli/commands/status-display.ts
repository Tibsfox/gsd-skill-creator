/**
 * Pure rendering functions for the CLI status display.
 *
 * Separates display logic from CLI I/O concerns:
 * - renderInstalledSection: shows installed skill inventory with proportional sizing
 * - renderProjectionSection: shows loading projection with loaded/deferred breakdown
 * - buildStatusJson: structured object for --json output
 * - budgetColorCode: threshold-based color code (caller applies picocolors)
 */

import pc from 'picocolors';
import { formatProgressBar, type CumulativeBudgetResult } from '../../validation/budget-validation.js';

// ============================================================================
// Color coding (BC-09)
// ============================================================================

/**
 * Determine color code based on budget usage percentage.
 *
 * Thresholds:
 * - < 60%: green
 * - 60-79%: cyan
 * - 80-99%: yellow
 * - >= 100%: red
 *
 * Returns a string code — caller applies picocolors.
 */
export function budgetColorCode(percent: number): 'green' | 'cyan' | 'yellow' | 'red' {
  if (percent >= 100) return 'red';
  if (percent >= 80) return 'yellow';
  if (percent >= 60) return 'cyan';
  return 'green';
}

// ============================================================================
// Installed Skills section (BC-01, BC-04, BC-07)
// ============================================================================

/**
 * Render the Installed Skills section.
 *
 * Shows every skill with:
 * - Percentage of total installed (BC-04: denominator is installedTotal, not budget)
 * - Mini bar relative to the largest skill (BC-07: not relative to budget or total)
 * - Total installed character count
 *
 * Skills are sorted by size descending.
 */
export function renderInstalledSection(result: CumulativeBudgetResult): string {
  const lines: string[] = [];
  const { skills, installedTotal } = result;

  lines.push(pc.bold('Installed Skills'));

  if (skills.length === 0) {
    lines.push(pc.dim('No skills installed.'));
    return lines.join('\n');
  }

  lines.push(pc.dim(`${skills.length} skills, ${installedTotal.toLocaleString()} chars total`));
  lines.push('');

  // Sort by size descending
  const sorted = [...skills].sort((a, b) => b.totalChars - a.totalChars);

  // Largest skill char count for relative mini bars
  const largestChars = sorted[0].totalChars;

  for (const skill of sorted) {
    const pct = ((skill.totalChars / installedTotal) * 100).toFixed(1);
    const miniBar = formatProgressBar(skill.totalChars, largestChars, 10);
    lines.push(
      `  ${miniBar} ${skill.name}  ${skill.totalChars.toLocaleString()} chars (${pct}%)`,
    );
  }

  return lines.join('\n');
}

// ============================================================================
// Loading Projection section (BC-02, BC-03, BC-05, BC-06, BC-09)
// ============================================================================

/**
 * Render the Loading Projection section.
 *
 * Shows:
 * - Progress bar for loading budget usage (BC-03: loadedTotal vs budgetLimit)
 * - Color-coded budget percentage (BC-09)
 * - Loaded/deferred counts, or count-based summary when over budget (BC-05)
 * - No negative headroom values (BC-06)
 * - Deferred skill listing with reason
 * - Oversized skill warnings
 *
 * When no projection data is available (no profile), shows informational message.
 */
export function renderProjectionSection(result: CumulativeBudgetResult): string {
  const lines: string[] = [];
  const { projection } = result;

  if (!projection) {
    lines.push(pc.dim('Run with --profile to see loading projection'));
    return lines.join('\n');
  }

  lines.push(pc.bold('Loading Projection') + pc.dim(` (${projection.profileName})`));

  // Budget bar (BC-03: uses loadedTotal vs budgetLimit)
  const bar = formatProgressBar(projection.loadedTotal, projection.budgetLimit);
  const budgetPct = (projection.loadedTotal / projection.budgetLimit) * 100;
  const colorCode = budgetColorCode(budgetPct);
  const budgetText = `${budgetPct.toFixed(0)}% (${projection.loadedTotal.toLocaleString()} / ${projection.budgetLimit.toLocaleString()} chars)`;
  const colorFn = pc[colorCode] as (s: string) => string;
  lines.push(`${bar} ${colorFn(budgetText)}`);

  // Count summary
  const totalSkills = projection.loaded.length + projection.deferred.length;
  const totalCharsAllSkills = projection.loadedTotal + projection.deferredTotal;
  const isOverBudget = totalCharsAllSkills > projection.budgetLimit;

  if (isOverBudget && projection.deferred.length > 0) {
    // Over-budget: count-based summary (BC-05)
    lines.push(`${projection.loaded.length} of ${totalSkills} skills fit`);
  } else {
    lines.push(`${projection.loaded.length} loaded, ${projection.deferred.length} deferred`);
  }

  // Headroom (BC-06: never show negative values)
  const headroom = projection.budgetLimit - projection.loadedTotal;
  if (headroom >= 0) {
    lines.push(`Headroom: ${headroom.toLocaleString()} chars`);
  } else {
    lines.push(`Budget exceeded — ${projection.deferred.length} skills deferred`);
  }

  // Deferred skills listing
  if (projection.deferred.length > 0) {
    lines.push('');
    for (const skill of projection.deferred) {
      let line = `  [deferred] ${skill.name}  ${skill.charCount.toLocaleString()} chars`;
      if (skill.oversized) {
        line += ' ⚠ oversized';
      }
      lines.push(line);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// JSON output (BC-08)
// ============================================================================

/**
 * Build structured JSON object for --json output.
 *
 * Returns:
 * - budget: cumulative budget limit
 * - totalInstalled: total installed characters
 * - installed: array of { name, charCount, percentOfInstalled }
 * - projection: null | { profileName, budgetLimit, loadedTotal, deferredTotal, loaded, deferred }
 */
export function buildStatusJson(result: CumulativeBudgetResult): Record<string, unknown> {
  const { skills, installedTotal, budget, projection } = result;

  // Sort by size descending
  const sorted = [...skills].sort((a, b) => b.totalChars - a.totalChars);

  const installed = sorted.map(skill => ({
    name: skill.name,
    charCount: skill.totalChars,
    percentOfInstalled: installedTotal > 0
      ? Math.round(((skill.totalChars / installedTotal) * 100) * 10) / 10
      : 0,
  }));

  let projectionJson: Record<string, unknown> | null = null;
  if (projection) {
    projectionJson = {
      profileName: projection.profileName,
      budgetLimit: projection.budgetLimit,
      loadedTotal: projection.loadedTotal,
      deferredTotal: projection.deferredTotal,
      loaded: projection.loaded.map(s => ({
        name: s.name,
        charCount: s.charCount,
        tier: s.tier,
        oversized: s.oversized,
      })),
      deferred: projection.deferred.map(s => ({
        name: s.name,
        charCount: s.charCount,
        tier: s.tier,
        oversized: s.oversized,
      })),
    };
  }

  return {
    budget,
    totalInstalled: installedTotal,
    installed,
    projection: projectionJson,
  };
}
