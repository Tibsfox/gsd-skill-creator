import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillIndex, SkillIndexEntry } from '../storage/skill-index.js';

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

  p.outro(`${skills.length} skill(s) found`);
}

// Export formatter for reuse in search workflow
export { formatSkillEntry };
