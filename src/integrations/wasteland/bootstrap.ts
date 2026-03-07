/**
 * bootstrap — shared startup module for Phase 2 CLI commands.
 *
 * Every Phase 2 command (wl-browse, wl-done, wl-status) calls bootstrap()
 * at startup to eliminate repeated config-load + client-create + sync
 * boilerplate. A single tested entry point keeps that logic consistent.
 *
 * Sync behaviour:
 * - Without --offline: attempts `dolt pull upstream main` in the resolved
 *   local_dir. Failures set synced=false and are swallowed — the command
 *   continues with whatever local data is present.
 * - With --offline: skips the pull entirely. Fast and safe for offline use.
 *
 * SEC-01: dolt is invoked via execFile() with array arguments. No shell
 * string interpolation occurs at the OS level.
 *
 * @module bootstrap
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as os from 'node:os';
import { resolve as resolvePath } from 'node:path';
import { loadConfig } from './config.js';
import { createClient } from './dolthub-client.js';
import type { HopConfig } from './config.js';
import type { DoltClient } from './dolthub-client.js';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The result returned by bootstrap(). All Phase 2 commands destructure this
 * to obtain the config, client, and wasteland connection details they need.
 */
export interface BootstrapResult {
  /** The loaded and validated HopConfig from ~/.hop/config.json. */
  config: HopConfig;
  /** A ready-to-use DoltClient for the configured wasteland. */
  client: DoltClient;
  /** Wasteland connection details with ~ resolved in localDir. */
  wasteland: { upstream: string; fork: string; localDir: string };
  /**
   * True when dolt pull succeeded; false when --offline was passed or when
   * the pull failed (network error, merge conflict, etc.).
   */
  synced: boolean;
}

// ---------------------------------------------------------------------------
// bootstrap()
// ---------------------------------------------------------------------------

/**
 * Load config, create a DoltClient, and optionally sync from upstream.
 *
 * Called at the top of every Phase 2 CLI command. Provides a single
 * consistent entry point for startup so each command can focus on its
 * specific logic rather than repeating boilerplate.
 *
 * @param args    - CLI args array (checked for --offline flag)
 * @param options - Optional overrides; configDir is used for test isolation
 * @returns Resolved BootstrapResult with config, client, wasteland, synced
 *
 * @example
 * const { config, client, wasteland, synced } = await bootstrap(process.argv.slice(2));
 * if (!synced) console.warn('Working with local data (offline or sync failed)');
 */
export async function bootstrap(
  args: string[],
  options?: { configDir?: string },
): Promise<BootstrapResult> {
  // 1. Load config — throws with "wl config init" guidance when missing/invalid
  const config = await loadConfig(options?.configDir);

  // 2. Resolve wasteland entry — v2.0 single-wasteland access pattern
  const wl = config.wastelands[0];

  // 3. Resolve ~ in local_dir and canonicalize to absolute path.
  //    R1.1: resolvePath() eliminates traversal sequences (../) and guarantees
  //    an absolute path. Null-byte check prevents path truncation attacks.
  const localDir = resolvePath(wl.local_dir.replace('~', os.homedir()));
  if (localDir.includes('\0')) {
    throw new Error('Invalid local_dir in config: path contains null byte');
  }

  // 4. Create the DoltHub client
  const client = createClient({ upstream: wl.upstream, fork: wl.fork, localDir, branch: 'main' });

  // 5. Attempt dolt pull unless --offline
  let synced = false;
  const offline = args.includes('--offline');

  if (!offline) {
    try {
      // SEC-01: array args only — no shell string interpolation
      await execFileAsync('dolt', ['pull', 'upstream', 'main'], { cwd: localDir, timeout: 30000 });
      synced = true;
    } catch {
      // Sync failure is non-fatal — command continues with local data
      synced = false;
    }
  }

  return { config, client, wasteland: { upstream: wl.upstream, fork: wl.fork, localDir }, synced };
}
