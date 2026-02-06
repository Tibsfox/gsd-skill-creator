/**
 * CLI command for listing agent teams.
 *
 * Discovers teams from both project and user scopes using TeamStore.
 * Supports three-tier output: text (styled table), quiet (CSV-like),
 * and JSON. Follows the detect-conflicts command pattern.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { TeamStore, getTeamsBasePath } from '../../teams/index.js';
import type { TeamConfig } from '../../types/team.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Entry representing a discovered team for display.
 */
interface TeamListEntry {
  name: string;
  topology: string;
  memberCount: number;
  scope: 'project' | 'user';
}

// ============================================================================
// Help
// ============================================================================

/**
 * Show help text for the team list command.
 */
function showTeamListHelp(): void {
  console.log(`
skill-creator team list - List all teams

Usage:
  skill-creator team list                  Show teams from all scopes
  skill-creator team list --scope=project  Show only project-level teams
  skill-creator tm ls --json               JSON output for scripting

Options:
  --scope=<scope>   Filter by scope: project, user (default: show both)
  --quiet, -q       Machine-readable output (CSV-like)
  --json            JSON output for scripting
  --help, -h        Show this help
`);
}

// ============================================================================
// Discovery
// ============================================================================

/**
 * Discover teams from the specified scopes.
 *
 * Reads team configs from each scope's TeamStore and collects
 * name, topology, member count, and scope into a flat list.
 *
 * @param scopesToScan - Scopes to discover teams from
 * @returns Array of team list entries
 */
async function discoverTeams(
  scopesToScan: Array<'project' | 'user'>
): Promise<TeamListEntry[]> {
  const entries: TeamListEntry[] = [];

  for (const scope of scopesToScan) {
    const store = new TeamStore(getTeamsBasePath(scope));
    const names = await store.list();

    for (const name of names) {
      try {
        const config = await store.read(name);
        entries.push({
          name: config.name,
          topology:
            ((config as Record<string, unknown>).topology as string) ??
            'custom',
          memberCount: config.members.length,
          scope,
        });
      } catch {
        // Skip unreadable configs
      }
    }
  }

  return entries;
}

// ============================================================================
// Output Formatters
// ============================================================================

/**
 * Format entries as JSON and print to stdout.
 */
function outputJson(entries: TeamListEntry[]): void {
  console.log(JSON.stringify(entries, null, 2));
}

/**
 * Format entries as CSV-like quiet output: name,topology,memberCount,scope
 */
function outputQuiet(entries: TeamListEntry[]): void {
  for (const entry of entries) {
    console.log(
      `${entry.name},${entry.topology},${entry.memberCount},${entry.scope}`
    );
  }
}

/**
 * Truncate a string to maxLen, appending ellipsis if needed.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '\u2026';
}

/**
 * Pad a string to the right to reach the desired width.
 */
function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
}

/**
 * Pad a string to the left to reach the desired width.
 */
function padLeft(text: string, width: number): string {
  if (text.length >= width) return text;
  return ' '.repeat(width - text.length) + text;
}

/**
 * Format entries as a styled text table using clack/picocolors.
 */
function outputText(entries: TeamListEntry[]): void {
  // Column widths
  const nameW = 20;
  const patternW = 15;
  const membersW = 7;
  const scopeW = 7;

  p.log.message('');
  p.log.message(pc.bold('Teams:'));
  p.log.message('');

  // Header
  const header =
    `  ${padRight('Name', nameW)}  ` +
    `${padRight('Pattern', patternW)}  ` +
    `${padLeft('Members', membersW)}  ` +
    `${padRight('Scope', scopeW)}`;
  p.log.message(header);

  // Separator
  const separator =
    `  ${'\u2500'.repeat(nameW)}  ` +
    `${'\u2500'.repeat(patternW)}  ` +
    `${'\u2500'.repeat(membersW)}  ` +
    `${'\u2500'.repeat(scopeW)}`;
  p.log.message(pc.dim(separator));

  // Rows
  for (const entry of entries) {
    const row =
      `  ${padRight(truncate(entry.name, nameW), nameW)}  ` +
      `${padRight(truncate(entry.topology, patternW), patternW)}  ` +
      `${padLeft(String(entry.memberCount), membersW)}  ` +
      `${padRight(entry.scope, scopeW)}`;
    p.log.message(row);
  }

  p.log.message('');
  p.log.message(pc.dim(`Found ${entries.length} team(s).`));
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * CLI command for listing agent teams.
 *
 * Discovers teams from project and/or user scopes and outputs
 * in text, quiet, or JSON format.
 *
 * @param args - Command-line arguments (after 'team list')
 * @returns Exit code (always 0 -- listing is informational)
 */
export async function teamListCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showTeamListHelp();
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

  // Discover teams
  const entries = await discoverTeams(scopesToScan);

  // Empty state
  if (entries.length === 0) {
    if (json) {
      console.log(JSON.stringify([]));
    } else if (!quiet) {
      p.log.info(
        'No teams found. Create one with: skill-creator team create'
      );
    }
    return 0;
  }

  // Output in requested format
  if (json) {
    outputJson(entries);
  } else if (quiet) {
    outputQuiet(entries);
  } else {
    outputText(entries);
  }

  return 0;
}
