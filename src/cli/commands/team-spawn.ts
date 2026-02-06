/**
 * CLI command for checking team spawn readiness.
 *
 * Validates that all member agent files exist and are resolvable.
 * When agents are missing, displays fuzzy name suggestions and
 * offers to generate the missing files interactively.
 *
 * Three-tier output: text (styled with spinners), quiet (CSV-like), JSON.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  TeamStore,
  getTeamsBasePath,
  validateMemberAgents,
  writeTeamAgentFiles,
} from '../../teams/index.js';
import type { MemberResolutionResult } from '../../teams/index.js';
import type { TeamConfig } from '../../types/team.js';

// ============================================================================
// Help
// ============================================================================

/**
 * Show help text for the team spawn command.
 */
function showTeamSpawnHelp(): void {
  console.log(`
skill-creator team spawn - Check team readiness

Usage:
  skill-creator team spawn <team-name>
  skill-creator tm sp my-team

Validates that all member agent files exist and are resolvable.
Offers to generate missing agent files interactively.

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
// Output Formatters
// ============================================================================

/**
 * JSON output structure for the spawn readiness check.
 */
interface SpawnJsonOutput {
  name: string;
  ready: boolean;
  members: Array<{
    agentId: string;
    status: 'found' | 'missing';
    path?: string;
    suggestions?: string[];
  }>;
}

/**
 * Format results as JSON and print to stdout.
 */
function outputJson(
  teamName: string,
  results: MemberResolutionResult[]
): void {
  const allFound = results.every((r) => r.status === 'found');
  const output: SpawnJsonOutput = {
    name: teamName,
    ready: allFound,
    members: results.map((r) => ({
      agentId: r.agentId,
      status: r.status,
      ...(r.path ? { path: r.path } : {}),
      ...(r.suggestions ? { suggestions: r.suggestions } : {}),
    })),
  };
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Format results as quiet CSV-like output.
 */
function outputQuiet(teamName: string, allReady: boolean): void {
  console.log(`${teamName},${allReady ? 'ready' : 'not-ready'}`);
}

// ============================================================================
// Interactive Fix
// ============================================================================

/**
 * Offer to generate missing agent files interactively.
 *
 * For each missing agent, prompts the user to confirm generation.
 * Uses writeTeamAgentFiles from the teams module to create agent files.
 *
 * @param config - The team configuration
 * @param missingResults - Resolution results for missing agents only
 * @returns Number of agents generated
 */
async function offerInteractiveFix(
  config: TeamConfig,
  missingResults: MemberResolutionResult[]
): Promise<number> {
  let generated = 0;

  for (const result of missingResults) {
    const member = config.members.find(
      (m) => m.agentId === result.agentId
    );
    if (!member) continue;

    const shouldGenerate = await p.confirm({
      message: `Generate missing agent file for '${result.agentId}'?`,
    });

    if (p.isCancel(shouldGenerate) || !shouldGenerate) {
      continue;
    }

    // Determine tools from the member's index signature
    const tools =
      ((member as Record<string, unknown>).tools as string[]) ?? [];

    const agentResult = writeTeamAgentFiles(
      [
        {
          agentId: member.agentId,
          name: member.name,
          agentType: member.agentType,
          tools,
        },
      ],
      config.name,
      '.claude/agents'
    );

    if (agentResult.created.length > 0) {
      p.log.success(
        `Created agent file: .claude/agents/${result.agentId}.md`
      );
      generated++;
    } else {
      p.log.warn(`Agent file already exists for '${result.agentId}'.`);
    }
  }

  return generated;
}

// ============================================================================
// Text Output
// ============================================================================

/**
 * Display styled text output for readiness check results.
 *
 * Shows found agents in green and missing agents in red with
 * search paths and fuzzy name suggestions.
 */
function outputText(
  teamName: string,
  results: MemberResolutionResult[]
): void {
  const found = results.filter((r) => r.status === 'found');
  const missing = results.filter((r) => r.status === 'missing');

  if (missing.length === 0) {
    const memberList = found.map((r) => r.agentId).join(', ');
    p.log.success(
      `Team '${teamName}' is ready. ${found.length} members resolved: ${memberList}`
    );
    return;
  }

  // Show found agents
  if (found.length > 0) {
    p.log.message('');
    p.log.message(
      `${pc.green(String(found.length))} agent(s) resolved:`
    );
    for (const r of found) {
      p.log.message(`  ${pc.green('+')} ${r.agentId} ${pc.dim(r.path ?? '')}`);
    }
  }

  // Show missing agents with suggestions
  p.log.message('');
  p.log.message(
    `${pc.red(String(missing.length))} agent(s) not found:`
  );
  for (const r of missing) {
    p.log.message(`  ${pc.red('x')} Agent '${r.agentId}' not found.`);
    if (r.searchedPaths.length > 0) {
      p.log.message(
        `    ${pc.dim('Searched:')} ${r.searchedPaths.join(', ')}`
      );
    }
    if (r.suggestions && r.suggestions.length > 0) {
      p.log.message(
        `    ${pc.dim('Did you mean:')} ${r.suggestions.join(', ')}?`
      );
    }
  }
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * CLI command for checking team spawn readiness.
 *
 * Validates that all member agent files exist and are resolvable.
 * Offers to generate missing agent files interactively when not
 * in quiet or JSON mode.
 *
 * @param args - Command-line arguments (after 'team spawn')
 * @returns Exit code: 0 when all members resolved, 1 when any missing
 */
export async function teamSpawnCommand(args: string[]): Promise<number> {
  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    showTeamSpawnHelp();
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
        'Usage: skill-creator team spawn <team-name>'
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

  // Run member agent resolution
  const results = validateMemberAgents(config.members);
  const found = results.filter((r) => r.status === 'found');
  const missing = results.filter((r) => r.status === 'missing');
  const allReady = missing.length === 0;

  // Output results in requested format
  if (json) {
    outputJson(teamName, results);
    return allReady ? 0 : 1;
  }

  if (quiet) {
    outputQuiet(teamName, allReady);
    return allReady ? 0 : 1;
  }

  // Text output with interactive fix for missing agents
  outputText(teamName, results);

  if (missing.length > 0) {
    p.log.message('');
    const generated = await offerInteractiveFix(config, missing);

    if (generated > 0) {
      p.log.message('');
      p.log.message(
        pc.dim(
          `Generated ${generated} agent file(s). Re-run spawn to verify readiness.`
        )
      );
    }
  }

  return allReady ? 0 : 1;
}
