/**
 * CLI command for team validation.
 *
 * Validates team configurations using validateTeamFull() from Phase 26.
 * Supports single-team, batch (--all), and three output modes:
 * - Text (default): severity-grouped errors/warnings with resolution hints
 * - Quiet (--quiet/-q): one line per team (name,status)
 * - JSON (--json): structured validation result
 *
 * Exit code 1 when any team has errors, 0 when all pass.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  TeamStore,
  getTeamsBasePath,
  validateTeamFull,
} from '../../teams/index.js';
import type {
  TeamFullValidationResult,
  MemberResolutionResult,
} from '../../teams/index.js';
import type { TeamScope } from '../../teams/team-store.js';

// ============================================================================
// Formatting Functions (tested by team-validate.test.ts)
// ============================================================================

/**
 * Format a validation result into severity-grouped text output.
 *
 * Groups errors before warnings per locked decision. Includes resolution
 * hints for missing agents with fuzzy name suggestions from Phase 26.
 *
 * @param result - Full team validation result
 * @param teamName - Name of the validated team
 * @returns Formatted text, plus separated errors and warnings arrays
 */
export function formatValidationReport(
  result: TeamFullValidationResult,
  teamName: string
): { text: string; errors: string[]; warnings: string[] } {
  const lines: string[] = [];

  // Status header
  if (result.valid) {
    lines.push(`${pc.green('\u2713')} ${pc.bold(teamName)} ${pc.green('PASS')}`);
  } else {
    lines.push(`${pc.red('\u2717')} ${pc.bold(teamName)} ${pc.red('FAIL')}`);
  }

  // Errors section FIRST (severity grouping per locked decision)
  if (result.errors.length > 0) {
    for (const error of result.errors) {
      lines.push(`  ${pc.red('\u2717')} ERROR: ${error}`);
    }
  }

  // Resolution hints for missing agents (after errors, before warnings)
  for (const member of result.memberResolution) {
    if (member.status === 'missing' && member.suggestions && member.suggestions.length > 0) {
      lines.push(`  ${pc.cyan('\u2139')} Did you mean: ${member.suggestions.join(', ')}?`);
    }
  }

  // Warnings section SECOND
  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      lines.push(`  ${pc.yellow('\u26A0')} WARN: ${warning}`);
    }
  }

  return {
    text: lines.join('\n'),
    errors: [...result.errors],
    warnings: [...result.warnings],
  };
}

/**
 * Format a batch summary table showing per-team pass/fail with counts.
 *
 * @param results - Array of per-team validation summaries
 * @returns Formatted table string with summary line
 */
export function formatBatchSummary(
  results: Array<{ name: string; valid: boolean; errorCount: number; warningCount: number }>
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(pc.bold('Validation Summary'));
  lines.push(pc.dim('\u2500'.repeat(50)));

  // Column headers
  lines.push(
    `  ${'Name'.padEnd(25)} ${'Status'.padEnd(8)} ${'Errors'.padEnd(8)} Warnings`
  );
  lines.push(`  ${pc.dim('\u2500'.repeat(25))} ${pc.dim('\u2500'.repeat(8))} ${pc.dim('\u2500'.repeat(8))} ${pc.dim('\u2500'.repeat(8))}`);

  for (const entry of results) {
    const status = entry.valid
      ? pc.green('PASS')
      : pc.red('FAIL');
    lines.push(
      `  ${entry.name.padEnd(25)} ${status.padEnd(8 + (status.length - 4))} ${String(entry.errorCount).padEnd(8)} ${entry.warningCount}`
    );
  }

  // Summary line
  const passCount = results.filter((r) => r.valid).length;
  lines.push('');
  lines.push(`  ${passCount}/${results.length} teams passed validation`);

  return lines.join('\n');
}

/**
 * Format a validation result for quiet output mode.
 *
 * @param teamName - Name of the team
 * @param result - Validation result
 * @returns Single line: "name,pass" or "name,fail"
 */
export function formatValidationQuiet(
  teamName: string,
  result: TeamFullValidationResult
): string {
  return `${teamName},${result.valid ? 'pass' : 'fail'}`;
}

/**
 * Format a validation result as a JSON-serializable object.
 *
 * @param teamName - Name of the team
 * @param result - Validation result
 * @returns Object with name, valid, errors, warnings, and memberResolution
 */
export function formatValidationJson(
  teamName: string,
  result: TeamFullValidationResult
): object {
  return {
    name: teamName,
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    memberResolution: result.memberResolution,
  };
}

// ============================================================================
// CLI Command
// ============================================================================

/**
 * Parse a --key=value flag from args.
 */
function parseFlag(args: string[], flag: string): string | undefined {
  const prefix = `--${flag}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

/**
 * Show help text for team validate command.
 */
function showTeamValidateHelp(): void {
  console.log(`
skill-creator team validate - Validate team configurations

Usage:
  skill-creator team validate <team-name>   Validate a specific team
  skill-creator team validate --all         Validate all teams
  skill-creator tm v my-team                Validate 'my-team'
  skill-creator tm v -a                     Validate all teams

Options:
  --all, -a           Validate all discovered teams
  --scope=<scope>     Storage scope: project (default) or user
  --quiet, -q         Minimal output (name,status per team)
  --json              JSON output for scripting
  --help, -h          Show this help

Output Modes:
  text (default)      Severity-grouped errors/warnings with resolution hints
  quiet               One line per team: name,pass or name,fail
  json                Full validation result as JSON

Exit Codes:
  0   All teams valid (or only warnings)
  1   One or more teams have errors

Examples:
  skill-creator team validate my-team       # Validate one team
  skill-creator tm v --all                  # Validate all teams
  skill-creator tm v my-team --json         # JSON output
  skill-creator tm v -a -q                  # Quick pass/fail check
`);
}

/**
 * Discover teams from one or both scopes.
 *
 * @param scope - If specified, only search that scope. Otherwise search both.
 * @returns Array of { name, scope } for each discovered team
 */
async function discoverTeams(
  scope?: TeamScope
): Promise<Array<{ name: string; scope: TeamScope }>> {
  const scopes: TeamScope[] = scope ? [scope] : ['project', 'user'];
  const teams: Array<{ name: string; scope: TeamScope }> = [];
  const seen = new Set<string>();

  for (const s of scopes) {
    const basePath = getTeamsBasePath(s);
    const store = new TeamStore(basePath);
    const names = await store.list();

    for (const name of names) {
      if (!seen.has(name)) {
        seen.add(name);
        teams.push({ name, scope: s });
      }
    }
  }

  return teams;
}

/**
 * CLI command for team validation.
 *
 * Validates team configurations using the Phase 26 validateTeamFull()
 * orchestrator and displays severity-grouped output.
 *
 * @param args - Command-line arguments (after 'team validate')
 * @returns Exit code (0 = valid, 1 = errors found)
 */
export async function teamValidateCommand(args: string[]): Promise<number> {
  // Parse flags
  const isHelp = args.includes('--help') || args.includes('-h');
  const isAll = args.includes('--all') || args.includes('-a');
  const isQuiet = args.includes('--quiet') || args.includes('-q');
  const isJson = args.includes('--json');
  const scopeFlag = parseFlag(args, 'scope') as TeamScope | undefined;

  // First non-flag arg is team name
  const teamName = args.find(
    (a) => !a.startsWith('-') && !a.startsWith('--')
  );

  // Help
  if (isHelp) {
    showTeamValidateHelp();
    return 0;
  }

  // No args: show help
  if (!teamName && !isAll) {
    showTeamValidateHelp();
    return 0;
  }

  // ---- Single team validation ----
  if (teamName && !isAll) {
    return validateSingleTeam(teamName, scopeFlag, isQuiet, isJson);
  }

  // ---- Batch validation (--all) ----
  return validateAllTeams(scopeFlag, isQuiet, isJson);
}

/**
 * Validate a single team by name.
 */
async function validateSingleTeam(
  teamName: string,
  scope: TeamScope | undefined,
  quiet: boolean,
  json: boolean
): Promise<number> {
  // Find team in stores
  const scopes: TeamScope[] = scope ? [scope] : ['project', 'user'];
  let config: unknown = null;
  let foundScope: TeamScope | undefined;

  for (const s of scopes) {
    const basePath = getTeamsBasePath(s);
    const store = new TeamStore(basePath);
    if (await store.exists(teamName)) {
      config = await store.read(teamName);
      foundScope = s;
      break;
    }
  }

  if (!config) {
    if (json) {
      console.log(JSON.stringify({ error: `Team "${teamName}" not found` }));
    } else if (!quiet) {
      p.log.error(`Team "${teamName}" not found.`);
      p.log.message('Check that the team exists in .claude/teams/ or ~/.claude/teams/');
    }
    return 1;
  }

  const result = await validateTeamFull(config);

  if (json) {
    console.log(JSON.stringify(formatValidationJson(teamName, result), null, 2));
    return result.valid ? 0 : 1;
  }

  if (quiet) {
    console.log(formatValidationQuiet(teamName, result));
    return result.valid ? 0 : 1;
  }

  // Text output
  const report = formatValidationReport(result, teamName);
  console.log('');
  console.log(report.text);
  console.log('');

  return result.valid ? 0 : 1;
}

/**
 * Validate all discovered teams.
 */
async function validateAllTeams(
  scope: TeamScope | undefined,
  quiet: boolean,
  json: boolean
): Promise<number> {
  let spinner: ReturnType<typeof p.spinner> | undefined;

  if (!quiet && !json) {
    spinner = p.spinner();
    spinner.start('Discovering teams...');
  }

  const teams = await discoverTeams(scope);

  if (teams.length === 0) {
    if (spinner) spinner.stop('No teams found');
    if (json) {
      console.log(JSON.stringify({ teams: [], summary: '0/0 teams passed validation' }));
    } else if (!quiet) {
      p.log.info('No teams found in .claude/teams/ or ~/.claude/teams/');
    }
    return 0;
  }

  if (spinner) spinner.stop(`Found ${teams.length} team(s)`);

  const batchResults: Array<{
    name: string;
    valid: boolean;
    errorCount: number;
    warningCount: number;
    result: TeamFullValidationResult;
  }> = [];

  // Validate each team
  for (const team of teams) {
    const basePath = getTeamsBasePath(team.scope);
    const store = new TeamStore(basePath);
    const config = await store.read(team.name);
    const result = await validateTeamFull(config);

    batchResults.push({
      name: team.name,
      valid: result.valid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      result,
    });
  }

  // JSON output
  if (json) {
    const passCount = batchResults.filter((r) => r.valid).length;
    const jsonOutput = {
      teams: batchResults.map((r) => formatValidationJson(r.name, r.result)),
      summary: `${passCount}/${batchResults.length} teams passed validation`,
    };
    console.log(JSON.stringify(jsonOutput, null, 2));
    return batchResults.some((r) => !r.valid) ? 1 : 0;
  }

  // Quiet output
  if (quiet) {
    for (const entry of batchResults) {
      console.log(formatValidationQuiet(entry.name, entry.result));
    }
    return batchResults.some((r) => !r.valid) ? 1 : 0;
  }

  // Text output: per-team reports then summary
  console.log('');
  for (const entry of batchResults) {
    const report = formatValidationReport(entry.result, entry.name);
    console.log(report.text);
    console.log('');
  }

  const summary = formatBatchSummary(
    batchResults.map((r) => ({
      name: r.name,
      valid: r.valid,
      errorCount: r.errorCount,
      warningCount: r.warningCount,
    }))
  );
  console.log(summary);
  console.log('');

  return batchResults.some((r) => !r.valid) ? 1 : 0;
}
