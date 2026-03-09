/**
 * wl trust — Manage interpersonal trust connections.
 *
 * Subcommands:
 *   (none)              List active trust connections
 *   add <handle>        Create a trust connection
 *   renew <contract-id> Renew an expiring contract
 *   drop <contract-id>  Archive (or purge) a trust connection
 *
 * Progressive disclosure by trust level:
 *   Seedling:   Simple connection list
 *   Sapling:    Labels, types, bond count
 *   Old Growth: Full detail — harmony, magnitudes, diversity
 *
 * @module wl-trust
 */

import pc from 'picocolors';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { hasFlag, getFlagValue, extractPositionalArgs } from '../../../integrations/wasteland/cli-utils.js';
import { sqlEscape } from '../../../integrations/wasteland/sql-escape.js';
import { createDoltHubTrustProvider } from '../../../integrations/wasteland/trust-relationship-provider.js';
import { createRelationship } from '../../../integrations/wasteland/trust-relationship.js';
import { detectBonds, computeGraphDiversity } from '../../../integrations/wasteland/trust-graph.js';
import {
  TRUST_HELP,
  detailLevel,
  renderTrustOverview,
  renderRelationshipList,
  renderRelationshipDetail,
} from '../../../integrations/wasteland/trust-cli-renderer.js';
import type { TrustContractType } from '../../../integrations/wasteland/trust-relationship.js';

const VALID_TYPES = new Set(['permanent', 'long-term', 'event-scoped', 'project-scoped', 'ephemeral']);

/**
 * wl trust command — manage interpersonal trust connections.
 *
 * @param args    - CLI arguments
 * @param options - Optional overrides for testing
 * @returns Exit code: 0 success, 1 user error, 2 execution error
 */
export async function wlTrustCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  if (hasFlag(args, 'help', 'h')) {
    console.log(TRUST_HELP);
    return 0;
  }

  const positionals = extractPositionalArgs(args, new Set([
    '--type', '--time', '--depth', '--label',
  ]));
  const subcommand = positionals[0]; // add, renew, drop, or undefined (list)

  try {
    const { config, client } = await bootstrap(args, options);
    const provider = createDoltHubTrustProvider(client);

    // Get viewer's trust level
    const { rows } = await client.query(
      `SELECT trust_level FROM rigs WHERE handle = '${sqlEscape(config.handle)}'`,
    );
    const trustLevel = rows[0] ? parseInt(rows[0].trust_level, 10) : 1;
    const level = detailLevel(trustLevel);

    if (!subcommand) {
      // List active trust connections
      const rels = await provider.getRelationshipsForRig(config.handle);
      const now = new Date();
      const bonds = detectBonds(config.handle, rels, now);
      const diversity = computeGraphDiversity(config.handle, rels, now);

      if (hasFlag(args, 'json')) {
        console.log(JSON.stringify({ handle: config.handle, trustLevel, connections: rels, bonds, diversity }, null, 2));
        return 0;
      }

      console.log(renderTrustOverview({
        handle: config.handle,
        trustLevel,
        activeConnections: rels.length,
        bondCount: bonds.length,
        diversity,
      }));
      console.log('');
      console.log(renderRelationshipList(config.handle, rels, level, now));
      return 0;
    }

    if (subcommand === 'add') {
      const targetHandle = positionals[1];
      if (!targetHandle) {
        console.error(pc.red('Usage: wl trust add <handle> --type <type>'));
        return 1;
      }

      const typeStr = getFlagValue(args, 'type') ?? 'ephemeral';
      if (!VALID_TYPES.has(typeStr)) {
        console.error(pc.red(`Invalid type: ${typeStr}. Must be one of: ${[...VALID_TYPES].join(', ')}`));
        return 1;
      }
      const type = typeStr as TrustContractType;

      const time = parseFloat(getFlagValue(args, 'time') ?? '0.1');
      const depth = parseFloat(getFlagValue(args, 'depth') ?? '0.1');
      const label = getFlagValue(args, 'label') ?? null;

      const rel = createRelationship(
        config.handle, targetHandle, type,
        time, depth, 0, 0, // Other side starts at zero — they set their own values
        { fromLabel: label, visibility: 'private' },
      );

      if (!hasFlag(args, 'execute')) {
        console.log(pc.yellow('Dry run — add --execute to create this connection:'));
        console.log('');
        console.log(renderRelationshipDetail(rel, level));
        return 0;
      }

      await provider.saveRelationship(rel);
      console.log(pc.green('Connection created.'));
      console.log(renderRelationshipDetail(rel, level));
      return 0;
    }

    if (subcommand === 'renew') {
      const contractId = positionals[1];
      if (!contractId) {
        console.error(pc.red('Usage: wl trust renew <contract-id>'));
        return 1;
      }

      // Find the relationship with this contract
      const rels = await provider.getRelationshipsForRig(config.handle);
      const rel = rels.find(r => r.contract.id === contractId);
      if (!rel) {
        console.error(pc.red(`Contract not found: ${contractId}`));
        return 1;
      }

      const { renewContract } = await import('../../../integrations/wasteland/trust-relationship.js');
      const renewed = renewContract(rel.contract);
      if (!renewed) {
        console.error(pc.red('This contract cannot be renewed (not auto-renewable or no TTL).'));
        return 1;
      }

      if (!hasFlag(args, 'execute')) {
        console.log(pc.yellow('Dry run — add --execute to renew:'));
        console.log(`  Contract: ${contractId}`);
        console.log(`  New expiry: ${renewed.expiresAt}`);
        console.log(`  Renewal count: ${renewed.renewalCount}`);
        return 0;
      }

      await provider.saveRelationship({ ...rel, contract: renewed });
      console.log(pc.green(`Contract renewed (${renewed.renewalCount}×). Expires: ${renewed.expiresAt}`));
      return 0;
    }

    if (subcommand === 'drop') {
      const contractId = positionals[1];
      if (!contractId) {
        console.error(pc.red('Usage: wl trust drop <contract-id> [--purge]'));
        return 1;
      }

      const purge = hasFlag(args, 'purge');
      const action = purge ? 'purge (hard delete)' : 'archive (soft delete)';

      if (!hasFlag(args, 'execute')) {
        console.log(pc.yellow(`Dry run — add --execute to ${action}:`));
        console.log(`  Contract: ${contractId}`);
        return 0;
      }

      if (purge) {
        await provider.purgeRelationship(contractId);
        console.log(pc.green(`Contract purged: ${contractId}`));
      } else {
        await provider.removeRelationship(contractId);
        console.log(pc.green(`Contract archived: ${contractId}`));
      }
      return 0;
    }

    console.error(pc.red(`Unknown subcommand: ${subcommand}`));
    console.log(TRUST_HELP);
    return 1;

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(pc.red(`Error: ${msg}`));
    return 2;
  }
}
