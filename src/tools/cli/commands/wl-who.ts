/**
 * wl who — Look up a rig's public profile.
 *
 * Shows what they've chosen to share on their character sheet.
 * The output respects the target's reputationVisibility setting
 * AND the viewer's trust level (progressive disclosure).
 *
 * @module wl-who
 */

import pc from 'picocolors';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { hasFlag, extractPositionalArgs } from '../../../integrations/wasteland/cli-utils.js';
import { sqlEscape } from '../../../integrations/wasteland/sql-escape.js';
import { createDoltHubTrustProvider } from '../../../integrations/wasteland/trust-relationship-provider.js';
import {
  WHO_HELP,
  renderPublicProfile,
  renderTrustBadge,
} from '../../../integrations/wasteland/trust-cli-renderer.js';

/**
 * wl who command — look up a rig's public profile.
 *
 * @param args    - CLI arguments
 * @param options - Optional overrides for testing
 * @returns Exit code: 0 success, 1 user error, 2 execution error
 */
export async function wlWhoCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  if (hasFlag(args, 'help', 'h')) {
    console.log(WHO_HELP);
    return 0;
  }

  const positionals = extractPositionalArgs(args);
  const targetHandle = positionals[0];

  if (!targetHandle) {
    console.error(pc.red('Usage: wl who <handle>'));
    return 1;
  }

  try {
    const { config, client } = await bootstrap(args, options);
    const provider = createDoltHubTrustProvider(client);

    // Get viewer's trust level
    const { rows: viewerRows } = await client.query(
      `SELECT trust_level FROM rigs WHERE handle = '${sqlEscape(config.handle)}'`,
    );
    const viewerTrustLevel = viewerRows[0] ? parseInt(viewerRows[0].trust_level, 10) : 1;

    // Get target's trust level
    const { rows: targetRows } = await client.query(
      `SELECT trust_level FROM rigs WHERE handle = '${sqlEscape(targetHandle)}'`,
    );
    if (targetRows.length === 0) {
      console.error(pc.red(`Unknown rig: ${targetHandle}`));
      return 1;
    }
    const targetTrustLevel = parseInt(targetRows[0].trust_level, 10);

    // Get target's character sheet
    const sheet = await provider.getCharacterSheet(targetHandle);

    if (hasFlag(args, 'json')) {
      console.log(JSON.stringify({
        handle: targetHandle,
        trustLevel: targetTrustLevel,
        sheet: sheet ?? null,
      }, null, 2));
      return 0;
    }

    // Render
    const badge = renderTrustBadge(targetTrustLevel);
    console.log(`${pc.bold(targetHandle)} — ${badge}`);

    if (sheet) {
      console.log(renderPublicProfile(sheet, viewerTrustLevel));
    } else {
      console.log(pc.dim('No character sheet shared.'));
    }

    return 0;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(pc.red(`Error: ${msg}`));
    return 2;
  }
}
