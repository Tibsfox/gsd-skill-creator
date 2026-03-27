import * as p from '@clack/prompts';
import pc from 'picocolors';
import { BudgetValidator, formatProgressBar } from '../../validation/budget-validation.js';

/**
 * Budget command - shows current character budget usage across all skills.
 *
 * Displays:
 * - Overall budget usage with visual progress bar
 * - Per-skill breakdown sorted by size
 * - Warnings if approaching or exceeding limit
 * - Actionable suggestions for large skills
 *
 * @param options - Optional configuration including skillsDir
 */
export async function budgetCommand(options?: { skillsDir?: string }): Promise<number> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  p.intro(pc.bgCyan(pc.black(' Skill Budget Status ')));

  try {
    const validator = BudgetValidator.load();
    const result = await validator.checkCumulative(skillsDir);

    // Main budget display
    const bar = formatProgressBar(result.totalChars, result.budget);
    const pctStr = result.usagePercent.toFixed(0);

    // Color based on severity
    let pctColored: string;
    switch (result.severity) {
      case 'error':
        pctColored = pc.red(`${pctStr}%`);
        break;
      case 'warning':
        pctColored = pc.yellow(`${pctStr}%`);
        break;
      case 'info':
        pctColored = pc.cyan(`${pctStr}%`);
        break;
      default:
        pctColored = pc.green(`${pctStr}%`);
    }

    p.log.message('');
    p.log.message(pc.bold('Character Budget'));
    p.log.message(`${bar} ${pctColored} (${result.totalChars.toLocaleString()} / ${result.budget.toLocaleString()} chars)`);
    p.log.message('');

    if (result.skills.length === 0) {
      p.log.info('No skills found.');
      p.outro('Done.');
      return 0;
    }

    // Per-skill breakdown
    p.log.message(pc.bold('Per-Skill Breakdown'));
    p.log.message(pc.dim('(sorted by size, largest first)'));
    p.log.message('');

    // Sort skills by size descending
    const sortedSkills = [...result.skills].sort((a, b) => b.totalChars - a.totalChars);

    for (const skill of sortedSkills) {
      const pct = ((skill.totalChars / result.budget) * 100).toFixed(1);
      const miniBar = formatProgressBar(skill.totalChars, result.budget, 10);

      // Color name based on individual usage
      const skillPct = (skill.totalChars / validator.getBudget()) * 100;
      let nameColored: string;
      if (skillPct >= 100) {
        nameColored = pc.red(skill.name);
      } else if (skillPct >= 80) {
        nameColored = pc.yellow(skill.name);
      } else {
        nameColored = pc.white(skill.name);
      }

      p.log.message(`  ${miniBar} ${nameColored}`);
      p.log.message(pc.dim(`       ${skill.totalChars.toLocaleString()} chars (${pct}% of budget)`));
      p.log.message(pc.dim(`       desc: ${skill.descriptionChars}, body: ${skill.bodyChars}`));
    }

    // Warnings
    if (result.hiddenCount > 0) {
      p.log.message('');
      p.log.error(`${result.hiddenCount} skill(s) may be hidden by Claude Code due to budget overflow.`);
    }

    if (result.severity === 'warning' || result.severity === 'error') {
      p.log.message('');
      p.log.warn('Tips to reduce budget usage:');
      p.log.message('  - Shorten long descriptions (keep under 200 chars)');
      p.log.message('  - Move detailed content to reference files (reference.md)');
      p.log.message('  - Disable rarely-used skills');
      p.log.message('  - Split large skills into focused smaller skills');
    }

    // Environment info
    p.log.message('');
    p.log.message(pc.dim(`Budget: ${result.budget.toLocaleString()} chars (set via SLASH_COMMAND_TOOL_CHAR_BUDGET)`));

    p.outro('Done.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`Failed to check budget: ${message}`);
    return 1;
  }
}
