/**
 * CLI command for dissolving agent teams.
 *
 * Delegates to TeamLifecycleManager.dissolveTeam() for full lifecycle
 * tracking including DISSOLVING -> DISSOLVED state transitions and
 * JSONL event log entries.
 */

import { TeamStore, getTeamsBasePath } from '../../teams/team-store.js';
import { TeamLifecycleManager } from '../../teams/team-lifecycle.js';

/**
 * Show help text for the team dissolve command.
 */
function showTeamDissolveHelp(): void {
  console.log(`
skill-creator team dissolve - Dissolve a team with lifecycle tracking

Usage:
  skill-creator team dissolve <name>
  skill-creator tm d <name> [options]

Options:
  --scope=<scope>       Storage scope: project (default) or user
  --help, -h            Show this help

Examples:
  skill-creator team dissolve my-team
  skill-creator tm d research-team --scope=user
`);
}

/**
 * Parse a flag value from args in --key=value format.
 */
function parseFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * CLI command for dissolving agent teams.
 *
 * Parses CLI flags and delegates to TeamLifecycleManager for
 * lifecycle-tracked dissolution.
 *
 * @param args - Command-line arguments (after 'team dissolve')
 * @returns Exit code (0 for success, 1 for error)
 */
export async function teamDissolveCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showTeamDissolveHelp();
    return 0;
  }

  // Get team name from first positional arg
  const teamName = args.find((a) => !a.startsWith('--'));
  if (!teamName) {
    console.error('Error: Team name is required. Usage: skill-creator team dissolve <name>');
    return 1;
  }

  const scope = parseFlag(args, 'scope') ?? 'project';
  const teamsDir = getTeamsBasePath(scope as 'project' | 'user');
  const store = new TeamStore(teamsDir);
  const manager = new TeamLifecycleManager(store, teamsDir);

  try {
    await manager.dissolveTeam(teamName, 'cli:dissolve');
    console.log(`Team '${teamName}' dissolved.`);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
