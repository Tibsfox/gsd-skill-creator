/**
 * Per-operation cooldown enforcement with persistent state.
 *
 * Enforces minimum intervals between expensive operations like discovery
 * and corpus scanning. State is persisted to disk using atomic writes
 * (write-tmp-then-rename pattern from ScanStateStore).
 *
 * Implements ACL-08: Expensive operations have cooldown periods between invocations.
 */

import { z } from 'zod';
import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

// ============================================================================
// Zod Schemas
// ============================================================================

/** State schema: maps operation name to ISO timestamp of last invocation */
const CooldownStateSchema = z.record(z.string(), z.string());

// ============================================================================
// TypeScript Types
// ============================================================================

export interface CooldownConfig {
  [operation: string]: number; // operation name -> cooldown in milliseconds
}

export type CooldownCheckResult =
  | { allowed: true }
  | { allowed: false; remainingMs: number; message: string };

// ============================================================================
// Default Cooldowns
// ============================================================================

/** Default cooldown periods for expensive operations */
export const DEFAULT_COOLDOWNS: CooldownConfig = {
  discover: 5 * 60 * 1000,       // 5 minutes
  'corpus-scan': 5 * 60 * 1000,  // 5 minutes
};

// ============================================================================
// OperationCooldown
// ============================================================================

/**
 * Per-operation cooldown enforcement with persistent state.
 *
 * Follows ScanStateStore pattern for atomic writes (write-tmp-then-rename).
 * Handles missing/corrupt state files gracefully (treats as empty state).
 */
export class OperationCooldown {
  private readonly config: CooldownConfig;
  private readonly statePath: string;

  constructor(config: CooldownConfig, statePath: string = '.claude/.cooldown-state.json') {
    this.config = config;
    this.statePath = statePath;
  }

  /**
   * Check if an operation is allowed (cooldown has expired or never recorded).
   *
   * Operations not in the config are always allowed (no cooldown).
   * Returns remaining time when cooldown is active.
   */
  async check(operation: string): Promise<CooldownCheckResult> {
    // Unconfigured operations have no cooldown
    if (!(operation in this.config)) {
      return { allowed: true };
    }

    const state = await this.loadState();
    const lastRun = state[operation];

    // Never recorded = always allowed
    if (!lastRun) {
      return { allowed: true };
    }

    const elapsed = Date.now() - Date.parse(lastRun);
    const cooldownMs = this.config[operation];

    if (elapsed >= cooldownMs) {
      return { allowed: true };
    }

    const remainingMs = cooldownMs - elapsed;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const timeStr = remainingMinutes >= 1 ? `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : 'a few seconds';

    return {
      allowed: false,
      remainingMs,
      message: `Operation '${operation}' is in cooldown. Try again in ${timeStr}.`,
    };
  }

  /**
   * Record current timestamp as last invocation for this operation.
   * Saves state to disk using atomic write.
   */
  async record(operation: string): Promise<void> {
    const state = await this.loadState();
    state[operation] = new Date().toISOString();
    await this.saveState(state);
  }

  /**
   * Clear cooldown for a specific operation.
   * Useful for --force flags.
   */
  async reset(operation: string): Promise<void> {
    const state = await this.loadState();
    delete state[operation];
    await this.saveState(state);
  }

  /**
   * Return all recorded timestamps (operation -> ISO string).
   */
  async getState(): Promise<Record<string, string>> {
    return this.loadState();
  }

  /**
   * Load cooldown state from disk.
   *
   * Returns empty record when:
   * - File does not exist (first run)
   * - File contains corrupt/unparseable JSON
   * - File contents fail Zod schema validation
   */
  private async loadState(): Promise<Record<string, string>> {
    let content: string;
    try {
      content = await readFile(this.statePath, 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw err;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Corrupt JSON -- graceful recovery
      return {};
    }

    const result = CooldownStateSchema.safeParse(parsed);
    if (!result.success) {
      return {};
    }

    return result.data;
  }

  /**
   * Save cooldown state to disk using atomic write.
   *
   * Creates parent directories if they don't exist.
   * Writes to temp file in same directory, then renames.
   */
  private async saveState(state: Record<string, string>): Promise<void> {
    await mkdir(dirname(this.statePath), { recursive: true });

    const tempPath = join(
      dirname(this.statePath),
      `.cooldown-state-${Date.now()}-${Math.random().toString(36).slice(2)}.json.tmp`,
    );

    await writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    await rename(tempPath, this.statePath);
  }
}
