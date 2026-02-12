/**
 * Enhanced status command - comprehensive budget dashboard.
 *
 * Shows:
 * - Active skills display with flagged skills (preserved from original)
 * - Total budget usage with visual progress bar
 * - Per-skill breakdown sorted by size
 * - SKILL.md vs reference/script breakdown for progressive disclosure skills
 * - Remaining headroom in characters
 * - Trend over time from JSONL history
 *
 * Usage:
 *   skill-creator status              Show full budget dashboard
 *   skill-creator status --json       Machine-readable output
 *   skill-creator status --help       Show help
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { stat } from 'fs/promises';
import { join } from 'path';
import { BudgetValidator, formatProgressBar } from '../../validation/budget-validation.js';
import { DisclosureBudget } from '../../disclosure/disclosure-budget.js';
import { BudgetHistory } from '../../storage/budget-history.js';
import { createApplicationContext } from '../../index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { DependencyGraph } from '../../composition/dependency-graph.js';
import { SkillMetadata, getExtension } from '../../types/skill.js';

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
 * Color a percentage string based on severity.
 */
function colorBySeverity(text: string, severity: string): string {
  switch (severity) {
    case 'error':
      return pc.red(text);
    case 'warning':
      return pc.yellow(text);
    case 'info':
      return pc.cyan(text);
    default:
      return pc.green(text);
  }
}

/**
 * Check if a skill directory has references/ or scripts/ subdirectories.
 */
async function hasDisclosureDirs(skillPath: string): Promise<boolean> {
  const skillDir = skillPath.replace(/\/SKILL\.md$/, '');
  try {
    const refStat = await stat(join(skillDir, 'references')).catch(() => null);
    const scriptStat = await stat(join(skillDir, 'scripts')).catch(() => null);
    return !!(refStat?.isDirectory() || scriptStat?.isDirectory());
  } catch {
    return false;
  }
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
    // Load budget data
    const validator = BudgetValidator.load();
    const result = await validator.checkCumulative(skillsDir);

    // Load application context for active display
    const { applicator } = createApplicationContext();
    await applicator.initialize();

    // Load budget history for trend
    const history = new BudgetHistory(historyPath);
    const snapshots = await history.read();
    const trend = BudgetHistory.getTrend(snapshots);

    // Calculate headroom
    const headroom = result.budget - result.totalChars;

    if (jsonMode) {
      // JSON output
      const jsonOutput = {
        budget: result.budget,
        totalChars: result.totalChars,
        headroom,
        usagePercent: result.usagePercent,
        skills: result.skills.map(s => ({
          name: s.name,
          totalChars: s.totalChars,
          descriptionChars: s.descriptionChars,
          bodyChars: s.bodyChars,
        })),
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

    // Section 2: Budget overview
    const bar = formatProgressBar(result.totalChars, result.budget);
    const pctStr = result.usagePercent.toFixed(0);
    const pctColored = colorBySeverity(`${pctStr}%`, result.severity);

    console.log(pc.bold('Budget'));
    console.log(`${bar} ${pctColored} (${result.totalChars.toLocaleString()} / ${result.budget.toLocaleString()} chars)`);
    console.log('');

    if (result.skills.length === 0) {
      console.log(pc.dim('No skills found.'));
    } else {
      // Section 3: Per-skill breakdown
      console.log(pc.bold('Per-Skill Breakdown'));
      console.log(pc.dim('(sorted by size, largest first)'));
      console.log('');

      const sortedSkills = [...result.skills].sort((a, b) => b.totalChars - a.totalChars);
      const disclosure = new DisclosureBudget();

      // Build dependency graph for inheritance chain display
      let depGraph: DependencyGraph | null = null;
      try {
        const skillStore = new SkillStore(skillsDir);
        const allNames = await skillStore.list();
        const allSkills = new Map<string, SkillMetadata>();
        for (const name of allNames) {
          try {
            const skill = await skillStore.read(name);
            if (skill) {
              allSkills.set(name, skill.metadata);
            }
          } catch {
            // Skip unreadable skills
          }
        }
        if (allSkills.size > 0) {
          depGraph = DependencyGraph.fromSkills(allSkills);
        }
      } catch {
        // Dependency graph is optional enhancement -- skip on error
      }

      for (const skill of sortedSkills) {
        const pct = ((skill.totalChars / result.budget) * 100).toFixed(1);
        const miniBar = formatProgressBar(skill.totalChars, result.budget, 10);

        const skillPct = (skill.totalChars / validator.getBudget()) * 100;
        let nameColored: string;
        if (skillPct >= 100) {
          nameColored = pc.red(skill.name);
        } else if (skillPct >= 80) {
          nameColored = pc.yellow(skill.name);
        } else {
          nameColored = pc.white(skill.name);
        }

        console.log(`  ${miniBar} ${nameColored} ${pc.dim(`${skill.totalChars.toLocaleString()} chars (${pct}%)`)}`);

        // Show inheritance chain if skill extends another
        if (depGraph) {
          try {
            const parent = depGraph.getParent(skill.name);
            if (parent) {
              const chain = depGraph.getInheritanceChain(skill.name);
              console.log(pc.dim(`    extends: ${chain.join(' -> ')}`));
            }
          } catch {
            // Skip chain display on error (e.g., cycle)
          }
        }

        // Show disclosure breakdown if skill has references/ or scripts/
        const hasDisclosure = await hasDisclosureDirs(skill.path);
        if (hasDisclosure) {
          try {
            const skillDir = skill.path.replace(/\/SKILL\.md$/, '');
            const breakdown = await disclosure.calculateBreakdown(skillDir);
            const refChars = breakdown.references.reduce((sum, f) => sum + f.chars, 0);
            const scriptChars = breakdown.scripts.reduce((sum, f) => sum + f.chars, 0);
            const parts: string[] = [`SKILL.md: ${breakdown.skillMdChars.toLocaleString()}`];
            if (refChars > 0) parts.push(`references: ${refChars.toLocaleString()}`);
            if (scriptChars > 0) parts.push(`scripts: ${scriptChars.toLocaleString()}`);
            console.log(pc.dim(`           ${parts.join(' | ')}`));
          } catch {
            // Skip disclosure breakdown on error
          }
        }
      }
    }

    // Section 4: Headroom
    console.log('');
    console.log(`Remaining headroom: ${pc.bold(headroom.toLocaleString())} chars`);

    // Section 5: Trend
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
