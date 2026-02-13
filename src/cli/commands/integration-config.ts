/**
 * CLI command: `skill-creator integration`
 *
 * Provides `validate` and `show` subcommands for the integration config
 * stored at `.planning/skill-creator.json`.
 *
 * - validate: Runs Zod schema validation and reports field-level errors
 * - show: Displays the effective config (file merged with defaults)
 *
 * Exit codes:
 * - 0: Config is valid (or file missing — defaults are used)
 * - 1: Config has validation errors or unparseable JSON
 *
 * @module cli/commands/integration-config
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { readFile } from 'fs/promises';
import {
  IntegrationConfigSchema,
  DEFAULT_INTEGRATION_CONFIG,
} from '../../integration/config/index.js';
import type { IntegrationConfig } from '../../integration/config/index.js';

/** Default integration config file path. */
const DEFAULT_CONFIG_PATH = '.planning/skill-creator.json';

/**
 * Execute the `integration` CLI command.
 *
 * @param args - CLI arguments after `integration`
 * @returns Exit code (0 = ok, 1 = errors found)
 */
export async function integrationConfigCommand(args: string[]): Promise<number> {
  // Handle --help / -h at top level
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return 0;
  }

  // Determine subcommand (default to 'validate')
  const subcommand = args.find((a) => !a.startsWith('-')) ?? 'validate';
  const subArgs = args.filter((a) => a !== subcommand);

  switch (subcommand) {
    case 'validate':
      return handleValidate(subArgs);
    case 'show':
      return handleShow(subArgs);
    default:
      p.log.error(`Unknown subcommand: ${subcommand}`);
      p.log.message(`Run ${pc.cyan('skill-creator integration --help')} for usage.`);
      return 1;
  }
}

/**
 * Handle the `validate` subcommand.
 *
 * Reads config from disk, validates against the Zod schema, and reports
 * field-level errors. Missing file is not an error (exit 0 with defaults message).
 */
async function handleValidate(args: string[]): Promise<number> {
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
          config: DEFAULT_INTEGRATION_CONFIG,
          message: `No integration config found at ${configPath}. Using defaults.`,
        }, null, 2));
      } else {
        p.log.info(`No integration config found at ${pc.dim(configPath)}. Using defaults.`);
      }
      return 0;
    }
    if (jsonMode) {
      console.log(JSON.stringify({
        valid: false,
        errors: [{ field: '(file)', message: `Could not read config: ${nodeErr.message}` }],
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
        errors: [{ field: '(file)', message: 'Invalid JSON in config file' }],
      }, null, 2));
    } else {
      p.log.error('Invalid JSON in config file');
    }
    return 1;
  }

  // Validate with Zod
  const result = IntegrationConfigSchema.safeParse(raw);

  if (result.success) {
    if (jsonMode) {
      console.log(JSON.stringify({
        valid: true,
        errors: [],
        config: result.data,
      }, null, 2));
    } else {
      displayValidationSuccess(result.data, configPath);
    }
    return 0;
  }

  // Validation failed — format errors
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

  if (jsonMode) {
    console.log(JSON.stringify({
      valid: false,
      errors,
    }, null, 2));
  } else {
    displayValidationErrors(errors, configPath);
  }
  return 1;
}

/**
 * Display a formatted success report for valid config.
 */
function displayValidationSuccess(config: IntegrationConfig, configPath: string): void {
  p.intro(pc.bgCyan(pc.black(' Integration Config Validation ')));
  p.log.message(`Source: ${configPath}`);
  p.log.message('');

  // Feature toggles summary
  const toggles = config.integration;
  const enabledCount = Object.values(toggles).filter(Boolean).length;
  const totalCount = Object.keys(toggles).length;
  p.log.message(pc.bold('Feature Toggles:'));
  p.log.message(`  ${enabledCount}/${totalCount} features enabled`);

  // Token budget summary
  p.log.message(pc.bold('Token Budget:'));
  p.log.message(`  max: ${config.token_budget.max_percent}%, warn at: ${config.token_budget.warn_at_percent}%`);

  // Observation summary
  p.log.message(pc.bold('Observation:'));
  p.log.message(`  retention: ${config.observation.retention_days}d, max entries: ${config.observation.max_entries}`);

  // Suggestions summary
  p.log.message(pc.bold('Suggestions:'));
  p.log.message(`  min occurrences: ${config.suggestions.min_occurrences}, cooldown: ${config.suggestions.cooldown_days}d`);

  p.log.message('');
  p.outro(pc.green('Configuration is valid. No issues found.'));
}

/**
 * Display formatted validation errors.
 */
function displayValidationErrors(
  errors: Array<{ field: string; message: string }>,
  configPath: string,
): void {
  p.intro(pc.bgCyan(pc.black(' Integration Config Validation ')));
  p.log.message(`Source: ${configPath}`);
  p.log.message('');
  p.log.error(`Errors (${errors.length}):`);
  for (const error of errors) {
    p.log.message(`  ${pc.red('x')} ${error.field}: ${error.message}`);
  }
  p.log.message('');
  p.outro(pc.red(`${errors.length} error(s) found. Fix the config file and re-run.`));
}

/**
 * Handle the `show` subcommand.
 *
 * Reads config from disk, merges with defaults, and displays the effective
 * config. Missing file shows all defaults.
 */
async function handleShow(args: string[]): Promise<number> {
  const jsonMode = args.includes('--json');
  const configArg = args.find((a) => a.startsWith('--config='));
  const configPath = configArg ? configArg.slice('--config='.length) : DEFAULT_CONFIG_PATH;

  let config: IntegrationConfig;

  try {
    let content: string;
    try {
      content = await readFile(configPath, 'utf-8');
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        // No file — use defaults
        config = DEFAULT_INTEGRATION_CONFIG;
        if (!jsonMode) {
          p.log.info(`No config file at ${pc.dim(configPath)}. Showing defaults.`);
        }
        outputConfig(config, jsonMode);
        return 0;
      }
      throw err;
    }

    // Parse JSON
    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      if (jsonMode) {
        console.log(JSON.stringify({ error: 'Invalid JSON in config file' }, null, 2));
      } else {
        p.log.error('Invalid JSON in config file');
      }
      return 1;
    }

    // Validate and merge with defaults
    const result = IntegrationConfigSchema.safeParse(raw);
    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      );
      if (jsonMode) {
        console.log(JSON.stringify({ error: 'Validation failed', errors }, null, 2));
      } else {
        p.log.error('Config validation failed:');
        for (const e of errors) {
          p.log.message(`  ${pc.red('x')} ${e}`);
        }
      }
      return 1;
    }

    config = result.data;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (jsonMode) {
      console.log(JSON.stringify({ error: msg }, null, 2));
    } else {
      p.log.error(`Failed to read config: ${msg}`);
    }
    return 1;
  }

  outputConfig(config, jsonMode);
  return 0;
}

/**
 * Output the effective config, either as formatted display or raw JSON.
 */
function outputConfig(config: IntegrationConfig, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(config, null, 2));
  } else {
    p.intro(pc.bgCyan(pc.black(' Effective Integration Config ')));
    console.log(JSON.stringify(config, null, 2));
    p.outro('');
  }
}

/**
 * Display help text for the integration command.
 */
function showHelp(): void {
  console.log(`
skill-creator integration - Manage integration configuration

Usage:
  skill-creator integration [subcommand] [options]
  skill-creator int [subcommand] [options]

Subcommands:
  validate      Validate integration config (default)
  show          Display effective config (file merged with defaults)

Options:
  --config=PATH   Path to config file (default: .planning/skill-creator.json)
  --json          Output results as JSON (machine-readable)
  --help, -h      Show this help message

The integration config controls skill-creator's integration with GSD:
  - Feature toggles (auto-load skills, session observation, etc.)
  - Token budget limits for skill loading
  - Observation retention settings
  - Suggestion thresholds

If no config file exists, all defaults are used. A partial config file
is merged with defaults — you only need to specify values you want to
override.

Exit Codes:
  0   Config is valid (or missing — defaults used)
  1   Config has validation errors (type mismatch, out-of-range)

Examples:
  skill-creator integration validate
  skill-creator integration validate --json
  skill-creator integration show
  skill-creator integration show --json
  skill-creator int validate --config=/custom/path.json
`);
}
