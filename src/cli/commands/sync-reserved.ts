import * as p from '@clack/prompts';
import pc from 'picocolors';
import { ReservedNameValidator } from '../../validation/reserved-names.js';

/**
 * Sync command - shows current reserved names and provides manual update instructions.
 *
 * Per RESEARCH.md: starting with manual sync + documentation.
 * Automatic fetch from GitHub releases can be added in future iteration.
 */
export async function syncReservedCommand(): Promise<number> {
  p.intro(pc.bgCyan(pc.black(' Sync Reserved Names ')));

  try {
    // Load current config
    const validator = await ReservedNameValidator.load();
    const metadata = validator.getMetadata();

    p.log.info(`Current version: ${pc.cyan(`v${metadata.version}`)}`);
    p.log.info(`Last synced: ${pc.dim(new Date(metadata.lastSync).toLocaleDateString())}`);
    p.log.info(`Source: ${pc.dim(metadata.sourceVersion)}`);
    p.log.message('');

    // Show current reserved names summary
    const allNames = validator.getAllReservedNames();
    let totalCount = 0;

    p.log.message(pc.bold('Current reserved names by category:'));
    p.log.message('');

    for (const [category, data] of Object.entries(allNames)) {
      const count = data.names.length;
      totalCount += count;
      p.log.message(`  ${pc.cyan(category)}: ${count} names`);
      p.log.message(pc.dim(`    ${data.description}`));

      // Show first few names as examples
      const examples = data.names.slice(0, 5);
      const remaining = data.names.length - examples.length;
      const exampleStr = examples.map(n => pc.yellow(n)).join(', ');
      const moreStr = remaining > 0 ? pc.dim(` +${remaining} more`) : '';
      p.log.message(`    Examples: ${exampleStr}${moreStr}`);
      p.log.message('');
    }

    p.log.message(pc.bold(`Total: ${totalCount} reserved names`));
    p.log.message('');

    // Manual update instructions
    p.log.step('How to update:');
    p.log.message('');
    p.log.message('  1. Check Claude Code documentation for new reserved names');
    p.log.message(`  2. Edit ${pc.cyan('config/reserved-names.json')}`);
    p.log.message('  3. Update the version and lastSync fields');
    p.log.message('  4. Add/remove names in the appropriate category');
    p.log.message('');
    p.log.message(pc.dim('Reference: https://code.claude.com/docs/en/skills'));
    p.log.message(pc.dim('Automatic sync from Claude Code releases planned for future version.'));

    p.outro('Done.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    p.log.error(`Failed to load reserved names config: ${message}`);
    return 1;
  }
}
