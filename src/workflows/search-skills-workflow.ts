import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { SkillIndex } from '../storage/skill-index.js';
import { formatSkillEntry } from './list-skills-workflow.js';

export async function searchSkillsWorkflow(skillIndex: SkillIndex): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' Search Skills ')));

  const query = await p.text({
    message: 'Search query (name or description):',
    placeholder: 'e.g., typescript, testing, api',
    validate: (value) => {
      if (!value || value.length < 2) {
        return 'Enter at least 2 characters';
      }
    }
  });

  if (p.isCancel(query)) {
    p.cancel('Search cancelled');
    return;
  }

  const searchTerm = query as string;
  const results = await skillIndex.search(searchTerm);

  if (results.length === 0) {
    p.log.warn(`No skills found matching "${searchTerm}"`);
    p.outro('0 results');
    return;
  }

  p.log.info(pc.bold(`\nMatching Skills:`));
  for (const skill of results) {
    p.log.message(formatSkillEntry(skill));
  }

  p.outro(`${results.length} result(s) for "${searchTerm}"`);
}
