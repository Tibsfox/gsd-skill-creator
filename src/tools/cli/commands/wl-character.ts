/**
 * wl character — Manage your character sheet (the consent layer).
 *
 * Subcommands:
 *   (none)   Show your character sheet
 *   set      Create or update your character sheet
 *
 * The character sheet is what you choose to share. Nothing more.
 *
 * @module wl-character
 */

import pc from 'picocolors';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { hasFlag, getFlagValue } from '../../../integrations/wasteland/cli-utils.js';
import { createDoltHubTrustProvider } from '../../../integrations/wasteland/trust-relationship-provider.js';
import { createCharacterSheet } from '../../../integrations/wasteland/trust-relationship.js';
import {
  CHARACTER_HELP,
  renderCharacterSheet,
} from '../../../integrations/wasteland/trust-cli-renderer.js';

/**
 * wl character command — manage your character sheet.
 *
 * @param args    - CLI arguments
 * @param options - Optional overrides for testing
 * @returns Exit code: 0 success, 1 user error, 2 execution error
 */
export async function wlCharacterCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  if (hasFlag(args, 'help', 'h')) {
    console.log(CHARACTER_HELP);
    return 0;
  }

  try {
    const { config, client } = await bootstrap(args, options);
    const provider = createDoltHubTrustProvider(client);

    const isSet = args.includes('set');

    if (!isSet) {
      // Show current character sheet
      const sheet = await provider.getCharacterSheet(config.handle);
      if (!sheet) {
        console.log(pc.dim('No character sheet yet.'));
        console.log(pc.dim('Use `wl character set --name "Your Name"` to create one.'));
        return 0;
      }

      if (hasFlag(args, 'json')) {
        console.log(JSON.stringify(sheet, null, 2));
        return 0;
      }

      console.log(renderCharacterSheet(sheet));
      return 0;
    }

    // Set/update character sheet
    const name = getFlagValue(args, 'name') ?? config.display_name ?? config.handle;
    const icon = getFlagValue(args, 'icon');
    const bio = getFlagValue(args, 'bio');
    const camp = getFlagValue(args, 'camp');
    const visibility = getFlagValue(args, 'visibility') as 'full' | 'summary' | 'minimal' | undefined;

    if (visibility && !['full', 'summary', 'minimal'].includes(visibility)) {
      console.error(pc.red(`Invalid visibility: ${visibility}. Must be: full, summary, minimal`));
      return 1;
    }

    const sheet = createCharacterSheet(config.handle, name, {
      icon,
      bio,
      homeCamp: camp,
      reputationVisibility: visibility,
    });

    if (!hasFlag(args, 'execute')) {
      console.log(pc.yellow('Dry run — add --execute to save:'));
      console.log('');
      console.log(renderCharacterSheet(sheet));
      return 0;
    }

    await provider.saveCharacterSheet(sheet);
    console.log(pc.green('Character sheet saved.'));
    console.log(renderCharacterSheet(sheet));
    return 0;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(pc.red(`Error: ${msg}`));
    return 2;
  }
}
