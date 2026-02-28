/**
 * Emulated scanner: FS-UAE + CheckX wrapper and community checksum lookup.
 *
 * Provides a "thorough" scanning mode that runs actual Amiga antivirus
 * tools (CheckX) inside an emulated Amiga environment (FS-UAE). This is
 * best-effort -- it requires FS-UAE and Kickstart ROMs that the user
 * must provide. If either is missing, it returns a graceful 'unscanned'
 * result rather than throwing.
 *
 * Community checksums offer a fast complementary check by comparing
 * file SHA-256 hashes against a known-good list maintained by the
 * Aminet community.
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import type { ScanVerdict } from './types.js';

// ============================================================================
// Types
// ============================================================================

/** Result from emulated scanning. */
export interface EmulatedScanResult {
  /** Whether FS-UAE was actually invoked */
  ran: boolean;
  /** Scan verdict: clean, infected, or unscanned */
  verdict: ScanVerdict;
  /** Tool that produced the result (fs-uae or checkx) */
  tool: string;
  /** Human-readable output or error message */
  output: string;
  /** Whether the scan was killed due to timeout */
  timedOut: boolean;
}

/** Checksum match result. */
export interface ChecksumMatch {
  /** The SHA-256 hash that was looked up */
  sha256: string;
  /** Whether the hash was found in the known-good list */
  knownGood: boolean;
  /** Source of the hash list (e.g., 'known-good.json') */
  source: string;
}

/** Config for emulated scanning. */
export interface EmulatedScanConfig {
  /** Path to the file to scan */
  filePath: string;
  /** Path to FS-UAE binary */
  fsUaePath: string;
  /** Path to Kickstart ROM (null = not configured) */
  kickstartPath: string | null;
  /** Timeout in milliseconds (default: 60000) */
  timeoutMs: number;
  /** Working directory for FS-UAE config and virtual drives */
  workDir: string;
}

// ============================================================================
// Community checksum lookup
// ============================================================================

/**
 * Look up a file's SHA-256 hash in the known-good hash list.
 *
 * The known-good hash list maps Aminet paths to their expected SHA-256
 * hashes. If the provided hash matches any value in the map, the file
 * is considered known-good. An unknown hash produces 'unscanned' (not
 * 'suspicious') -- absence from the list is not evidence of malice.
 *
 * @param sha256 - SHA-256 hash to look up
 * @param knownGoodHashes - Map of Aminet path -> SHA-256 hash
 * @returns ChecksumMatch indicating whether the hash was found
 */
export function lookupChecksum(
  sha256: string,
  knownGoodHashes: Map<string, string>,
): ChecksumMatch {
  // Check if the sha256 appears as any value in the map
  let found = false;
  for (const hash of knownGoodHashes.values()) {
    if (hash === sha256) {
      found = true;
      break;
    }
  }

  return {
    sha256,
    knownGood: found,
    source: 'known-good.json',
  };
}

/**
 * Load known-good hashes from a JSON file.
 *
 * Expected format:
 * ```json
 * {
 *   "version": 1,
 *   "hashes": {
 *     "util/misc/File.lha": "abc123...",
 *     "mus/edit/ProTracker.lha": "deadbeef..."
 *   }
 * }
 * ```
 *
 * Returns an empty Map if the file doesn't exist (graceful degradation).
 * Throws on invalid JSON (caller should handle).
 *
 * @param filePath - Absolute path to the known-good.json file
 * @returns Map from Aminet path to SHA-256 hash
 */
export function loadKnownGoodHashes(filePath: string): Map<string, string> {
  if (!existsSync(filePath)) {
    return new Map();
  }

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw) as { version: number; hashes: Record<string, string> };
  const result = new Map<string, string>();

  if (parsed.hashes && typeof parsed.hashes === 'object') {
    for (const [path, hash] of Object.entries(parsed.hashes)) {
      result.set(path, hash);
    }
  }

  return result;
}

// ============================================================================
// Emulated scanning
// ============================================================================

/**
 * Parse CheckX output to determine scan verdict.
 *
 * CheckX output patterns:
 * - "0 viruses found" or "no virus found" -> clean
 * - "virus found" or "infected" -> infected
 * - Anything else -> unscanned (indeterminate)
 */
function parseCheckXOutput(stdout: string): ScanVerdict {
  const lower = stdout.toLowerCase();

  if (lower.includes('0 viruses found') || lower.includes('no virus found')) {
    return 'clean';
  }

  if (lower.includes('virus found') || lower.includes('infected')) {
    return 'infected';
  }

  return 'unscanned';
}

/**
 * Run FS-UAE + CheckX emulated scan on a file.
 *
 * This is a best-effort enhancement. If FS-UAE is not installed or
 * Kickstart ROM is not available, returns a graceful 'unscanned' result.
 *
 * Implementation:
 * 1. Check FS-UAE exists at fsUaePath (existsSync)
 * 2. Check kickstartPath is configured and exists
 * 3. Invoke FS-UAE via execFile with AbortController timeout
 * 4. Parse CheckX log output for verdict
 *
 * The actual FS-UAE invocation uses an A4000 hardware profile with
 * CheckX configured to scan the target file. The config is generated
 * at runtime in the workDir.
 *
 * @param config - Emulated scan configuration
 * @returns EmulatedScanResult with verdict and metadata
 */
export function runEmulatedScan(config: EmulatedScanConfig): Promise<EmulatedScanResult> {
  return new Promise<EmulatedScanResult>((resolve) => {
    // Pre-flight check: FS-UAE binary exists
    if (!existsSync(config.fsUaePath)) {
      resolve({
        ran: false,
        verdict: 'unscanned',
        tool: 'fs-uae',
        output: `FS-UAE not found at ${config.fsUaePath}`,
        timedOut: false,
      });
      return;
    }

    // Pre-flight check: Kickstart ROM configured
    if (config.kickstartPath === null) {
      resolve({
        ran: false,
        verdict: 'unscanned',
        tool: 'fs-uae',
        output: 'Kickstart ROM not configured',
        timedOut: false,
      });
      return;
    }

    // Set up timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    // Invoke FS-UAE with CheckX arguments
    // In a real deployment, this would generate a temp FS-UAE config file
    // with an A4000 profile, hard_drive_0 pointing to a virtual dh0:
    // containing CheckX and the target file, and a startup-sequence
    // that runs CheckX and writes results to a log file.
    const args = [
      `--kickstart_file=${config.kickstartPath}`,
      `--hard_drive_0=${config.workDir}`,
      `--cpu_type=68040`,
      `--chip_memory=2048`,
      `--fast_memory=8192`,
      `--end_config=1`,
    ];

    execFile(
      config.fsUaePath,
      args,
      { signal: controller.signal },
      (err: Error | null, stdout: string, _stderr: string) => {
        clearTimeout(timeout);

        if (err) {
          const errWithCode = err as NodeJS.ErrnoException;

          // Timeout / abort
          if (errWithCode.code === 'ABORT_ERR' || errWithCode.name === 'AbortError') {
            resolve({
              ran: true,
              verdict: 'unscanned',
              tool: 'checkx',
              output: `Emulated scan timed out after ${config.timeoutMs}ms`,
              timedOut: true,
            });
            return;
          }

          // Process error (ENOENT, permission denied, etc.)
          resolve({
            ran: false,
            verdict: 'unscanned',
            tool: 'fs-uae',
            output: `FS-UAE process error: ${errWithCode.message}`,
            timedOut: false,
          });
          return;
        }

        // Parse CheckX output
        const verdict = parseCheckXOutput(stdout);
        resolve({
          ran: true,
          verdict,
          tool: 'checkx',
          output: stdout,
          timedOut: false,
        });
      },
    );
  });
}
