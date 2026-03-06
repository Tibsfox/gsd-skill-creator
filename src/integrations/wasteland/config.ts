/**
 * Config — Wasteland CLI configuration management
 *
 * Provides the HopConfig schema (via zod), and load/save functions
 * for ~/.hop/config.json. Uses atomic writes to prevent corruption.
 *
 * Dependencies: zod, node:fs/promises, node:path, node:os — no other imports.
 */

import { z } from 'zod';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================================
// Schema
// ============================================================================

const WastelandEntrySchema = z.object({
  upstream: z.string(),
  fork: z.string(),
  local_dir: z.string(),
  joined_at: z.string(),
});

/**
 * Zod schema for the HopConfig file stored at ~/.hop/config.json.
 *
 * Mirrors the /wasteland join schema exactly — identity at root level plus
 * a wastelands array with per-wasteland entries.
 */
export const HopConfigSchema = z.object({
  handle: z.string(),
  display_name: z.string(),
  type: z.enum(['human', 'agent', 'org']),
  dolthub_org: z.string(),
  email: z.string(),
  wastelands: z.array(WastelandEntrySchema),
  schema_version: z.literal('1.0'),
  mvr_version: z.literal('0.1'),
});

/**
 * Inferred TypeScript type for the Hop configuration object.
 */
export type HopConfig = z.infer<typeof HopConfigSchema>;

// ============================================================================
// File I/O
// ============================================================================

/** Resolve the config file path relative to the given base directory. */
function configPath(configDir: string): string {
  return path.join(configDir, '.hop', 'config.json');
}

/**
 * Save the HopConfig to disk using an atomic write (write .tmp then rename).
 *
 * Creates the ~/.hop/ directory if it does not exist. The atomic write
 * prevents corruption if the process is interrupted mid-write.
 *
 * @param config - Validated HopConfig to persist
 * @param configDir - Base directory for config (defaults to os.homedir())
 *
 * @example
 * await saveConfig(config);               // writes to ~/.hop/config.json
 * await saveConfig(config, '/tmp/test');  // writes to /tmp/test/.hop/config.json
 */
export async function saveConfig(config: HopConfig, configDir?: string): Promise<void> {
  const base = configDir ?? os.homedir();
  const target = configPath(base);
  const tmp = target + '.tmp';

  // Ensure .hop/ directory exists
  await fs.mkdir(path.dirname(target), { recursive: true });

  // Atomic write: write to .tmp then rename into place
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), 'utf8');
  await fs.rename(tmp, target);
}

/**
 * Load and validate the HopConfig from disk.
 *
 * Throws descriptive errors mentioning "wl config init" for common failure
 * modes so the user always knows how to recover.
 *
 * @param configDir - Base directory for config (defaults to os.homedir())
 * @returns Validated HopConfig
 * @throws Error with "wl config init" guidance when file is missing or corrupt
 * @throws Error with validation details when schema validation fails
 *
 * @example
 * const config = await loadConfig();               // reads ~/.hop/config.json
 * const config = await loadConfig('/tmp/test');    // reads /tmp/test/.hop/config.json
 */
export async function loadConfig(configDir?: string): Promise<HopConfig> {
  const base = configDir ?? os.homedir();
  const target = configPath(base);

  // Read file — ENOENT → guide user to wl config init
  let raw: string;
  try {
    raw = await fs.readFile(target, 'utf8');
  } catch {
    throw new Error(`Config not found. Run: wl config init`);
  }

  // Parse JSON — invalid → guide user to wl config init
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Config file is corrupted. Run: wl config init`);
  }

  // Validate schema — failure → descriptive error with field details
  const result = HopConfigSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Config validation failed: ${result.error.message}`);
  }

  return result.data;
}
