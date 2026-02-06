/**
 * CLI command for creating agent teams.
 *
 * Thin wrapper around the team creation wizard from Phase 25.
 * Delegates to teamCreationWizard for interactive mode (when name/pattern
 * missing) and nonInteractiveCreate for flag-based mode (when both provided).
 */

import { teamCreationWizard } from '../../teams/index.js';
import type { WizardOptions } from '../../teams/index.js';

/**
 * Show help text for the team create command.
 */
function showTeamCreateHelp(): void {
  console.log(`
skill-creator team create - Create a new team

Usage:
  skill-creator team create                    Interactive wizard
  skill-creator team create --pattern=leader-worker --name=my-team
  skill-creator tm c --pattern=pipeline --name=data-flow --members=4

Options:
  --pattern=<pattern>   Team pattern: leader-worker, pipeline, swarm
  --name=<name>         Team name (lowercase, hyphens)
  --members=<n>         Number of workers (default: 3)
  --scope=<scope>       Storage scope: project (default) or user
  --description=<text>  Team description
  --help, -h            Show this help
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
 * CLI command for creating agent teams.
 *
 * Parses CLI flags and delegates to the team creation wizard.
 * Interactive mode is used when name or pattern are not provided.
 * Non-interactive mode is used when both name and pattern are given.
 *
 * @param args - Command-line arguments (after 'team create')
 * @returns Exit code (0 for success, 1 for error)
 */
export async function teamCreateCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showTeamCreateHelp();
    return 0;
  }

  // Parse flags
  const opts: WizardOptions = {
    pattern: parseFlag(args, 'pattern'),
    name: parseFlag(args, 'name'),
    members: parseFlag(args, 'members'),
    scope: parseFlag(args, 'scope'),
    description: parseFlag(args, 'description'),
  };

  try {
    // Wizard routes to interactive or non-interactive based on name + pattern presence
    await teamCreationWizard(opts);
    return 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
