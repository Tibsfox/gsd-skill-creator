/**
 * CLI command for displaying team details and validation summary.
 *
 * Shows team configuration including name, pattern, description,
 * lead agent, member table, and a compact validation summary with
 * error and warning counts.
 *
 * Three-tier output: text (styled table), quiet (CSV-like), JSON.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  TeamStore,
  getTeamsBasePath,
  validateTeamFull,
} from '../../teams/index.js';
import type { TeamConfig } from '../../types/team.js';

// ============================================================================
// Help
// ============================================================================

/**
 * Show help text for the team status command.
 */
function showTeamStatusHelp(): void {
  console.log(`
skill-creator team status - Show team details

Usage:
  skill-creator team status <team-name>
  skill-creator tm s my-team

Displays team configuration, members, and validation summary.

Options:
  --scope=<scope>   Scope to search: project, user, or both (default)
  --quiet, -q       Machine-readable output
  --json            JSON output
  --help, -h        Show this help
`);
}

// ============================================================================
// Discovery
// ============================================================================

/**
 * Locate and read a team config from project and/or user scope.
 *
 * @param teamName - Name of the team to find
 * @param scopesToScan - Scopes to search
 * @returns TeamConfig if found, null otherwise
 */
async function findTeam(
  teamName: string,
  scopesToScan: Array<'project' | 'user'>
): Promise<TeamConfig | null> {
  for (const scope of scopesToScan) {
    const store = new TeamStore(getTeamsBasePath(scope));
    if (await store.exists(teamName)) {
      return store.read(teamName);
    }
  }
  return null;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Pad a string to the right to reach the desired width.
 */
function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
}

/**
 * Truncate a string to maxLen, appending ellipsis if needed.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

// ============================================================================
// Output Formatters
// ============================================================================

/**
 * Format team config and validation as JSON and print to stdout.
 */
function outputJson(
  config: TeamConfig,
  validation: { valid: boolean; errors: string[]; warnings: string[] }
): void {
  const topology =
    ((config as Record<string, unknown>).topology as string) ?? 'custom';

  const output = {
    name: config.name,
    topology,
    description: config.description ?? null,
    leadAgentId: config.leadAgentId,
    members: config.members.map((m) => ({
      agentId: m.agentId,
      name: m.name,
      agentType: m.agentType ?? null,
      model: m.model ?? null,
    })),
    validation: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

/**
 * Format team status as quiet CSV-like output.
 * Format: name,topology,memberCount,valid
 */
function outputQuiet(
  config: TeamConfig,
  valid: boolean
): void {
  const topology =
    ((config as Record<string, unknown>).topology as string) ?? 'custom';
  console.log(
    `${config.name},${topology},${config.members.length},${valid}`
  );
}

/**
 * Display styled text output showing full team details.
 *
 * Includes team header, member table with columns for Agent ID,
 * Name, Type, and Model, plus a compact validation summary.
 */
function outputText(
  config: TeamConfig,
  validation: { valid: boolean; errors: string[]; warnings: string[] }
): void {
  const topology =
    ((config as Record<string, unknown>).topology as string) ?? 'custom';

  // Team header
  p.log.message('');
  p.log.message(`  Team: ${pc.bold(config.name)}`);
  p.log.message(`  Pattern: ${pc.cyan(topology)}`);
  if (config.description) {
    p.log.message(`  Description: ${config.description}`);
  }
  p.log.message(`  Lead Agent: ${config.leadAgentId}`);
  if (config.createdAt) {
    const dateStr = config.createdAt.slice(0, 10);
    p.log.message(`  Created: ${dateStr}`);
  }

  // Member table
  const agentIdW = 16;
  const nameW = 18;
  const typeW = 14;
  const modelW = 10;

  p.log.message('');
  p.log.message(`  Members (${config.members.length}):`);

  // Header row
  const header =
    `    ${padRight('Agent ID', agentIdW)}  ` +
    `${padRight('Name', nameW)}  ` +
    `${padRight('Type', typeW)}  ` +
    `${padRight('Model', modelW)}`;
  p.log.message(header);

  // Separator
  const separator =
    `    ${'\u2500'.repeat(agentIdW)}  ` +
    `${'\u2500'.repeat(nameW)}  ` +
    `${'\u2500'.repeat(typeW)}  ` +
    `${'\u2500'.repeat(modelW)}`;
  p.log.message(pc.dim(separator));

  // Member rows
  for (const member of config.members) {
    const row =
      `    ${padRight(truncate(member.agentId, agentIdW), agentIdW)}  ` +
      `${padRight(truncate(member.name, nameW), nameW)}  ` +
      `${padRight(truncate(member.agentType ?? '-', typeW), typeW)}  ` +
      `${padRight(member.model ?? '-', modelW)}`;
    p.log.message(row);
  }

  // Validation summary
  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;
  const statusLabel = validation.valid
    ? pc.green('PASS')
    : pc.red('FAIL');

  p.log.message('');
  p.log.message(
    `  Validation: ${statusLabel} (${errorCount} errors, ${warningCount} warnings)`
  );

  // Show errors if any
  if (errorCount > 0) {
    for (const error of validation.errors) {
      p.log.message(`    ${pc.red('ERR:')} ${error}`);
    }
  }

  // Show warnings if any
  if (warningCount > 0) {
    for (const warning of validation.warnings) {
      p.log.message(`    ${pc.yellow('WARN:')} ${warning}`);
    }
  }

  p.log.message('');
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * CLI command for displaying team details and validation summary.
 *
 * Reads the team config, runs validateTeamFull for a compact
 * validation summary, and displays configuration details with
 * member table and validation results.
 *
 * @param args - Command-line arguments (after 'team status')
 * @returns Exit code (always 0 -- status is informational)
 */
export async function teamStatusCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showTeamStatusHelp();
    return 0;
  }

  // Parse output mode flags
  const quiet = args.includes('--quiet') || args.includes('-q');
  const json = args.includes('--json');

  // Parse scope filter
  const scopeArg = args
    .find((a) => a.startsWith('--scope='))
    ?.split('=')[1];

  const scopesToScan: Array<'project' | 'user'> = [];
  if (scopeArg === 'project') {
    scopesToScan.push('project');
  } else if (scopeArg === 'user') {
    scopesToScan.push('user');
  } else {
    scopesToScan.push('project', 'user');
  }

  // Extract team name (first non-flag argument)
  const teamName = args.find((a) => !a.startsWith('-'));

  if (!teamName) {
    if (json) {
      console.log(JSON.stringify({ error: 'Team name is required' }));
    } else if (!quiet) {
      console.error(
        'Usage: skill-creator team status <team-name>'
      );
    }
    return 1;
  }

  // Locate and read team config
  const config = await findTeam(teamName, scopesToScan);

  if (!config) {
    if (json) {
      console.log(
        JSON.stringify({ error: `Team '${teamName}' not found.` })
      );
    } else if (!quiet) {
      p.log.error(`Team '${teamName}' not found.`);
    }
    return 1;
  }

  // Run full validation for the summary
  const validationResult = await validateTeamFull(config);

  const validation = {
    valid: validationResult.valid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
  };

  // Output in requested format
  if (json) {
    outputJson(config, validation);
  } else if (quiet) {
    outputQuiet(config, validation.valid);
  } else {
    outputText(config, validation);
  }

  return 0;
}
