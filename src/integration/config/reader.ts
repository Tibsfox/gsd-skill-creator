/**
 * Integration config file reader with Zod validation.
 *
 * Reads `.planning/skill-creator.json` from disk, parses it through
 * the Zod schema, and returns a fully populated config with defaults
 * filling any missing fields. Missing file = all defaults. Invalid
 * input = clear error with field path and acceptable range.
 *
 * This is the single entry point all downstream components use to
 * get integration settings.
 *
 * @module integration/config/reader
 */

import { readFile } from 'fs/promises';
import { IntegrationConfigSchema, DEFAULT_INTEGRATION_CONFIG } from './schema.js';
import type { IntegrationConfig } from './types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default path for the integration config file. */
export const DEFAULT_CONFIG_PATH = '.planning/skill-creator.json';

// ============================================================================
// Error type
// ============================================================================

/**
 * Error thrown when integration config reading or validation fails.
 *
 * Includes optional field path and expected range information for
 * producing actionable error messages.
 */
export class IntegrationConfigError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly expectedRange?: { min?: number; max?: number; validValues?: string[] },
  ) {
    super(message);
    this.name = 'IntegrationConfigError';
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Read and validate the integration config from disk.
 *
 * - If the file does not exist (ENOENT), returns all defaults silently.
 * - If the file exists but contains invalid JSON, throws with "Invalid JSON".
 * - If the file exists but fails Zod validation, throws with formatted field errors.
 * - On success, returns a fully populated config (defaults fill missing fields).
 *
 * @param configPath - Path to the config file (default: `.planning/skill-creator.json`)
 * @returns Fully validated and defaults-merged integration config
 * @throws {IntegrationConfigError} On invalid JSON or validation failure
 */
export async function readIntegrationConfig(
  configPath: string = DEFAULT_CONFIG_PATH,
): Promise<IntegrationConfig> {
  let content: string;

  try {
    content = await readFile(configPath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_INTEGRATION_CONFIG;
    }
    throw err;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new IntegrationConfigError(
      `Invalid JSON in config file: ${configPath}`,
    );
  }

  const result = IntegrationConfigSchema.safeParse(raw);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });
    throw new IntegrationConfigError(
      `Config validation failed:\n${errors.join('\n')}`,
      result.error.issues[0]?.path.join('.'),
    );
  }

  return result.data;
}

/**
 * Validate raw input against the integration config schema (no I/O).
 *
 * Pure function useful for testing, CLI validation, and programmatic
 * config construction without touching the filesystem.
 *
 * @param raw - Raw input to validate (typically parsed JSON)
 * @returns Validation result with parsed config on success, or error strings on failure
 */
export function validateIntegrationConfig(
  raw: unknown,
): { valid: true; config: IntegrationConfig } | { valid: false; errors: string[] } {
  const result = IntegrationConfigSchema.safeParse(raw);

  if (result.success) {
    return { valid: true, config: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return { valid: false, errors };
}
