import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillIndex, SkillIndexEntry } from '../storage/skill-index.js';
import { BudgetValidator, formatProgressBar } from '../validation/budget-validation.js';

// Format a skill entry for display
function formatSkillEntry(entry: SkillIndexEntry): string {
  const badge = entry.enabled
    ? pc.green('●')
    : pc.dim('○');

  // Truncate long descriptions
  const maxDescLen = 60;
  const desc = entry.description.length > maxDescLen
    ? entry.description.slice(0, maxDescLen) + '...'
    : entry.description;

  // Count triggers
  const triggers: string[] = [];
  if (entry.triggers?.intents?.length) {
    triggers.push(`intents(${entry.triggers.intents.length})`);
  }
  if (entry.triggers?.files?.length) {
    triggers.push(`files(${entry.triggers.files.length})`);
  }
  if (entry.triggers?.contexts?.length) {
    triggers.push(`contexts(${entry.triggers.contexts.length})`);
  }
  const triggerInfo = triggers.length > 0
    ? pc.dim(`  Triggers: ${triggers.join(', ')}`)
    : '';

  return `${badge} ${pc.bold(entry.name)}\n  ${pc.dim(desc)}${triggerInfo ? '\n' + triggerInfo : ''}`;
}

export async function listSkillsWorkflow(skillIndex: SkillIndex): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' Your Skills ')));

  const skills = await skillIndex.getAll();

  if (skills.length === 0) {
    p.log.warn('No skills found. Create one with the create-skill workflow.');
    p.outro('0 skills');
    return;
  }

  // Group by enabled status
  const enabled = skills.filter(s => s.enabled);
  const disabled = skills.filter(s => !s.enabled);

  if (enabled.length > 0) {
    p.log.info(pc.bold(`\nEnabled (${enabled.length}):`));
    for (const skill of enabled) {
      p.log.message(formatSkillEntry(skill));
    }
  }

  if (disabled.length > 0) {
    p.log.info(pc.bold(`\nDisabled (${disabled.length}):`));
    for (const skill of disabled) {
      p.log.message(formatSkillEntry(skill));
    }
  }

  // Budget summary
  try {
    const budgetValidator = BudgetValidator.load();
    const budgetResult = await budgetValidator.checkCumulative('.claude/skills');

    if (budgetResult.skills.length > 0) {
      p.log.message('');
      p.log.message(pc.dim('─'.repeat(40)));

      const bar = formatProgressBar(budgetResult.totalChars, budgetResult.budget, 15);
      const pct = budgetResult.usagePercent.toFixed(0);

      let statusStr: string;
      switch (budgetResult.severity) {
        case 'error':
          statusStr = pc.red(`${bar} ${pct}% budget used`);
          break;
        case 'warning':
          statusStr = pc.yellow(`${bar} ${pct}% budget used`);
          break;
        default:
          statusStr = pc.dim(`${bar} ${pct}% budget used`);
      }

      p.log.message(statusStr);

      if (budgetResult.severity === 'error') {
        p.log.message(pc.red(`Warning: ${budgetResult.hiddenCount} skill(s) may be hidden. Run 'skill-creator budget' for details.`));
      } else if (budgetResult.severity === 'warning') {
        p.log.message(pc.yellow(`Approaching limit. Run 'skill-creator budget' for details.`));
      }
    }
  } catch {
    // Budget check failed silently - don't disrupt list output
  }

  p.outro(`${skills.length} skill(s) found`);
}

// Export formatter for reuse in search workflow
export { formatSkillEntry };
