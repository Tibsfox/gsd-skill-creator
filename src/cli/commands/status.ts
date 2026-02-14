/**
 * Enhanced status command - comprehensive budget dashboard.
 *
 * Shows:
 * - Active skills display with flagged skills (preserved from original)
 * - Installed Skills section with proportional percentages and mini bars
 * - Loading Projection section with loaded/deferred breakdown
 * - Trend over time from JSONL history
 *
 * Usage:
 *   skill-creator status              Show full budget dashboard
 *   skill-creator status --json       Machine-readable output
 *   skill-creator status --help       Show help
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { BudgetValidator } from '../../validation/budget-validation.js';
import { BudgetHistory } from '../../storage/budget-history.js';
import { createApplicationContext } from '../../index.js';
import { renderInstalledSection, renderProjectionSection, buildStatusJson } from './status-display.js';
import { getBudgetProfile } from '../../application/budget-profiles.js';

const HELP_TEXT = `
Usage: skill-creator status [options]

Display comprehensive budget dashboard with per-skill breakdown,
remaining headroom, and trend over time.

Options:
  --json           Output as JSON
  --help, -h       Show this help message

Aliases: st

Examples:
  skill-creator status              Show full budget dashboard
  skill-creator status --json       Machine-readable output
`;

const DEFAULT_HISTORY_PATH = '.planning/patterns/budget-history.jsonl';

/**
 * Check if a boolean flag is present in args.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(
    flag => args.includes(`--${flag}`) || args.includes(`-${flag.charAt(0)}`),
  );
}

/**
 * Enhanced status command with budget breakdown and trend.
 *
 * @param args - Command-line arguments after 'status'
 * @param options - Optional configuration for testing
 * @returns Exit code (0 for success, 1 for error)
 */
export async function statusCommand(
  args: string[],
  options?: { skillsDir?: string; historyPath?: string },
): Promise<number> {
  // Handle help
  if (hasFlag(args, 'help', 'h') || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  const jsonMode = args.includes('--json');
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  const historyPath = options?.historyPath ?? DEFAULT_HISTORY_PATH;

  try {
    // Load budget data with optional profile for loading projection
    const validator = BudgetValidator.load();
    const profile = getBudgetProfile('gsd-executor');
    const result = await validator.checkCumulative(skillsDir, profile);

    // Load application context for active display
    const { applicator } = createApplicationContext();
    await applicator.initialize();

    // Load budget history for trend
    const history = new BudgetHistory(historyPath);
    const snapshots = await history.read();
    const trend = BudgetHistory.getTrend(snapshots);

    if (jsonMode) {
      // JSON output using buildStatusJson for structured installed + projection data
      const jsonData = buildStatusJson(result);
      const jsonOutput = {
        ...jsonData,
        trend: trend ? {
          charDelta: trend.charDelta,
          skillDelta: trend.skillDelta,
          periodSnapshots: trend.periodSnapshots,
        } : null,
      };

      console.log(JSON.stringify(jsonOutput, null, 2));

      // Append snapshot to history (even in JSON mode)
      await history.append({
        timestamp: new Date().toISOString(),
        totalChars: result.totalChars,
        skillCount: result.skills.length,
      });

      return 0;
    }

    // === Formatted output ===

    // Section 1: Active skills display (preserved behavior)
    console.log(applicator.getActiveDisplay());

    const report = applicator.getReport();
    if (report.flaggedSkills.length > 0) {
      console.log('');
      console.log('Flagged for review (cost > savings):');
      report.flaggedSkills.forEach(name => console.log(`  - ${name}`));
    }

    console.log('');

    // Section 2: Installed Skills (from renderInstalledSection)
    console.log(renderInstalledSection(result));

    // Section 3: Loading Projection (from renderProjectionSection)
    console.log('');
    console.log(renderProjectionSection(result));

    // Section 4: Trend
    console.log('');
    if (trend) {
      const charSign = trend.charDelta >= 0 ? '+' : '';
      const skillSign = trend.skillDelta >= 0 ? '+' : '';
      const skillPart = trend.skillDelta !== 0
        ? ` (${skillSign}${trend.skillDelta} skill${Math.abs(trend.skillDelta) !== 1 ? 's' : ''})`
        : '';
      console.log(`Trend: ${charSign}${trend.charDelta.toLocaleString()} chars over last ${trend.periodSnapshots} snapshots${skillPart}`);
    } else {
      console.log(pc.dim('No trend data yet (run status again to start tracking)'));
    }

    // Append snapshot to history
    await history.append({
      timestamp: new Date().toISOString(),
      totalChars: result.totalChars,
      skillCount: result.skills.length,
    });

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`Failed to show status: ${message}`);
    return 1;
  }
}
