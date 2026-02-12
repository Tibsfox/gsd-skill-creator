/**
 * CLI command: `skill-creator config validate`
 *
 * Reads the project's GSD config.json, runs it through the config
 * validation engine, and displays a formatted report of errors,
 * warnings, and security implications.
 *
 * Exit codes:
 * - 0: Config is valid (may have warnings or security notes)
 * - 1: Config has hard errors (type mismatches, out-of-range)
 *
 * @module cli/commands/config-validate
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'fs/promises';
import { validateConfig } from '../../orchestrator/state/config-validator.js';
import type { ConfigValidationResult, ConfigIssue } from '../../orchestrator/state/config-validator.js';

/** Default config file path. */
const DEFAULT_CONFIG_PATH = '.planning/config.json';

/**
 * Execute the `config validate` CLI command.
 *
 * @param args - CLI arguments after `config validate`
 * @returns Exit code (0 = ok, 1 = errors found)
 */
export async function configValidateCommand(args: string[]): Promise<number> {
  // Handle --help / -h
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return 0;
  }

  // Parse flags
  const jsonMode = args.includes('--json');
  const configArg = args.find((a) => a.startsWith('--config='));
  const configPath = configArg ? configArg.slice('--config='.length) : DEFAULT_CONFIG_PATH;

  // Read config file
  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      if (jsonMode) {
        console.log(JSON.stringify({
          valid: true,
          errors: [],
          warnings: [],
          securityIssues: [],
          message: `No config.json found at ${configPath}. Using defaults.`,
        }, null, 2));
      } else {
        p.log.info(`No config.json found at ${configPath}. Using defaults.`);
      }
      return 0;
    }
    if (jsonMode) {
      console.log(JSON.stringify({
        valid: false,
        errors: [{ field: '(file)', message: `Could not read config: ${nodeErr.message}`, severity: 'error' }],
        warnings: [],
        securityIssues: [],
      }, null, 2));
    } else {
      p.log.error(`Could not read config: ${nodeErr.message}`);
    }
    return 1;
  }

  // Parse JSON
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    if (jsonMode) {
      console.log(JSON.stringify({
        valid: false,
        errors: [{ field: '(file)', message: 'Invalid JSON in config file', severity: 'error' }],
        warnings: [],
        securityIssues: [],
      }, null, 2));
    } else {
      p.log.error('Invalid JSON in config file');
    }
    return 1;
  }

  // Run validation
  const result = validateConfig(raw);

  // Output
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    displayReport(result, configPath);
  }

  return result.valid ? 0 : 1;
}

/**
 * Display a formatted validation report using clack/prompts.
 */
function displayReport(result: ConfigValidationResult, configPath: string): void {
  p.intro(pc.bgCyan(pc.black(' Config Validation Report ')));
  p.log.message(`Source: ${configPath}`);

  // Errors
  if (result.errors.length > 0) {
    p.log.message('');
    p.log.error(`Errors (${result.errors.length}):`);
    for (const issue of result.errors) {
      p.log.message(`  ${pc.red('x')} ${issue.field}: ${issue.message}`);
      if (issue.expectedRange) {
        const rangeInfo = formatRange(issue.expectedRange);
        if (rangeInfo) {
          p.log.message(`    ${pc.dim(rangeInfo)}`);
        }
      }
    }
  }

  // Warnings
  if (result.warnings.length > 0) {
    p.log.message('');
    p.log.warn(`Warnings (${result.warnings.length}):`);
    for (const issue of result.warnings) {
      p.log.message(`  ${pc.yellow('!')} ${issue.field}: ${issue.message}`);
      if (issue.expectedRange?.default !== undefined) {
        p.log.message(`    ${pc.dim(`default: ${String(issue.expectedRange.default)}`)}`);
      }
    }
  }

  // Security
  if (result.securityIssues.length > 0) {
    p.log.message('');
    p.log.message(pc.bold(`Security (${result.securityIssues.length}):`));
    for (const issue of result.securityIssues) {
      p.log.message(`  ${pc.magenta('*')} ${issue.field}: ${issue.message}`);
    }
  }

  // Summary line
  p.log.message('');
  const parts: string[] = [];
  if (result.errors.length > 0) parts.push(`${result.errors.length} error(s)`);
  if (result.warnings.length > 0) parts.push(`${result.warnings.length} warning(s)`);
  if (result.securityIssues.length > 0) parts.push(`${result.securityIssues.length} security note(s)`);

  if (parts.length === 0) {
    p.outro(pc.green('Configuration is valid. No issues found.'));
  } else {
    const summaryText = `Summary: ${parts.join(', ')}`;
    if (result.valid) {
      p.outro(pc.yellow(summaryText));
    } else {
      p.outro(pc.red(summaryText));
    }
  }
}

/**
 * Format expected range info for display.
 */
function formatRange(range: ConfigIssue['expectedRange']): string | null {
  if (!range) return null;
  const parts: string[] = [];
  if (range.min !== undefined) parts.push(`min: ${range.min}`);
  if (range.max !== undefined) parts.push(`max: ${range.max}`);
  if (range.default !== undefined) parts.push(`default: ${String(range.default)}`);
  if (range.validValues) parts.push(`valid: ${range.validValues.join(', ')}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Display help text for the config validate command.
 */
function showHelp(): void {
  console.log(`
skill-creator config validate - Validate GSD configuration

Usage:
  skill-creator config validate [options]

Options:
  --config=PATH   Path to config.json (default: .planning/config.json)
  --json          Output results as JSON
  --help, -h      Show this help message

Checks:
  - Type validation (string where number expected, etc.)
  - Range validation (min/max bounds for numeric fields)
  - Enum validation (mode, depth, model_profile)
  - Deviation warnings (significant departures from defaults)
  - Security implications (yolo mode, disabled tests, etc.)

Exit Codes:
  0   Config is valid (may have warnings or security notes)
  1   Config has hard errors (type mismatches, out-of-range)

Examples:
  skill-creator config validate
  skill-creator config validate --json
  skill-creator config validate --config=/path/to/config.json
`);
}
