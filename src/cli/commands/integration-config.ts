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
import { readFile, writeFile } from 'fs/promises';
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
    case 'migrate':
      return handleMigrate(subArgs);
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
 * Handle the `migrate` subcommand (v1.49.984).
 *
 * Migrates a 5.1b-era config that pinned `observation.mine_active_skills: false`
 * explicitly (when the field shipped dark-behind-flag, default-false) so it
 * re-inherits the 5.1c default (`true`). The fix DELETES the explicit key rather
 * than flipping it to `true`, so the config self-heals on any future default
 * change and matches what a fresh / absent-key install looks like.
 *
 * Only an EXPLICIT `false` is a migration target: an absent key already inherits
 * the new default (no-op), and a `true` value is already enabled (no-op).
 *
 * Dry-run by default (reports the action); `--apply` writes, after backing the
 * original up to `<path>.bak.<timestamp>` and re-validating the mutated config.
 * The ONLY mutation permitted is removing `observation.mine_active_skills`; any
 * other delta aborts the write (allowlist guard — mirrors the Ship 5.2 apply-guard
 * discipline, and protects sibling keys like `observation.retention_days`).
 * Idempotent (no-op on absent / already-true). NOT wired into install.cjs
 * auto-run — operator-invoked only, preserving the "never touch your config"
 * installer contract.
 */
async function handleMigrate(args: string[]): Promise<number> {
  const jsonMode = args.includes('--json');
  const apply = args.includes('--apply');
  const configArg = args.find((a) => a.startsWith('--config='));
  const configPath = configArg ? configArg.slice('--config='.length) : DEFAULT_CONFIG_PATH;

  // Read config file.
  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return reportMigrate(jsonMode, {
        path: configPath, action: 'none', applied: false,
        reason: `No config at ${configPath}; fresh installs already default mine_active_skills:true.`,
      }, 0);
    }
    return reportMigrate(jsonMode, {
      path: configPath, action: 'error', applied: false,
      reason: `Could not read config: ${nodeErr.message}`,
    }, 1);
  }

  // Parse JSON.
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return reportMigrate(jsonMode, {
      path: configPath, action: 'error', applied: false,
      reason: 'Invalid JSON in config file',
    }, 1);
  }

  // Detect an EXPLICIT observation.mine_active_skills === false.
  const obs = (raw && typeof raw === 'object')
    ? (raw as Record<string, unknown>).observation
    : undefined;
  const hasKey = !!obs && typeof obs === 'object'
    && Object.prototype.hasOwnProperty.call(obs, 'mine_active_skills');
  const isExplicitFalse = hasKey && (obs as Record<string, unknown>).mine_active_skills === false;

  if (!isExplicitFalse) {
    return reportMigrate(jsonMode, {
      path: configPath, action: 'none', applied: false,
      reason: hasKey
        ? 'observation.mine_active_skills is already true (or non-false); nothing to migrate.'
        : 'observation.mine_active_skills is absent; it already inherits the default (true).',
    }, 0);
  }

  // Build the migrated object by deleting exactly the one key.
  const after = JSON.parse(content) as Record<string, unknown>;
  delete (after.observation as Record<string, unknown>).mine_active_skills;

  // Allowlist guard: re-inserting the removed key must reproduce the original
  // exactly — i.e. the ONLY delta is observation.mine_active_skills. Anything
  // else aborts (defense against a future edit broadening the mutation).
  const reinserted = JSON.parse(JSON.stringify(after)) as Record<string, unknown>;
  (reinserted.observation as Record<string, unknown>).mine_active_skills = false;
  if (!deepEqual(reinserted, raw)) {
    return reportMigrate(jsonMode, {
      path: configPath, action: 'error', applied: false,
      reason: 'Refusing to write: the migration would change more than observation.mine_active_skills.',
    }, 1);
  }

  // NOTE: no whole-config schema re-validation here, deliberately. The allowlist
  // guard above proves the ONLY change is removing observation.mine_active_skills,
  // and that field is an optional defaulted boolean — deleting it can never
  // introduce a schema violation (an absent key re-inherits the default). A broad
  // safeParse(after) would instead couple this targeted cleanup to the validity of
  // UNRELATED fields, so a config with any pre-existing drift (e.g. an out-of-range
  // retention_days a hand-edit left behind) would become un-migratable — defeating
  // the very reason to run migrate. Use `integration validate` to surface unrelated
  // drift; migrate only does its one provably-safe job.

  if (!apply) {
    return reportMigrate(jsonMode, {
      path: configPath, action: 'delete-key', applied: false,
      reason: 'Would delete explicit observation.mine_active_skills:false so it re-inherits the default (true). Re-run with --apply to write.',
    }, 0);
  }

  // Apply: back up the original, then write the migrated config.
  const backupPath = `${configPath}.bak.${Date.now()}`;
  try {
    await writeFile(backupPath, content, 'utf-8');
    await writeFile(configPath, JSON.stringify(after, null, 2) + '\n', 'utf-8');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return reportMigrate(jsonMode, {
      path: configPath, action: 'error', applied: false,
      reason: `Write failed: ${msg}`,
    }, 1);
  }

  return reportMigrate(jsonMode, {
    path: configPath, action: 'delete-key', applied: true, backup: backupPath,
    reason: 'Deleted explicit observation.mine_active_skills:false; it now inherits the default (true).',
  }, 0);
}

interface MigrateResult {
  path: string;
  action: 'none' | 'delete-key' | 'error';
  applied: boolean;
  reason: string;
  backup?: string;
}

/** Render a migrate outcome (JSON or styled text) and return the exit code. */
function reportMigrate(jsonMode: boolean, result: MigrateResult, code: number): number {
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.action === 'error') {
    p.log.error(result.reason);
  } else if (result.applied) {
    p.log.success(`${result.reason}${result.backup ? ` (backup: ${result.backup})` : ''}`);
  } else {
    p.log.info(result.reason);
  }
  return code;
}

/** Deep structural equality, key-order-insensitive (migrate allowlist guard). */
function deepEqual(a: unknown, b: unknown): boolean {
  return canonical(a) === canonical(b);
}
function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'undefined';
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  const obj = v as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`;
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
  migrate       Migrate a pre-5.1c config: delete an explicit
                observation.mine_active_skills:false so it re-inherits the
                default (true). Dry-run unless --apply.

Options:
  --config=PATH   Path to config file (default: .planning/skill-creator.json)
  --json          Output results as JSON (machine-readable)
  --apply         (migrate) Write the change; otherwise dry-run/report only.
                  On apply, backs up the original to <path>.bak.<timestamp>.
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
  0   Config is valid / nothing to migrate / migration applied
  1   Config has validation errors, unparseable JSON, or a refused/failed migrate

Examples:
  skill-creator integration validate
  skill-creator integration validate --json
  skill-creator integration show
  skill-creator integration show --json
  skill-creator int validate --config=/custom/path.json
  skill-creator integration migrate            # dry-run: report only
  skill-creator integration migrate --apply    # write (+ .bak backup)
`);
}
