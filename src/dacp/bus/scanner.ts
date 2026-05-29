/**
 * Enhanced bus scanner that detects .bundle/ directories alongside .msg files.
 *
 * Extends the Den bus scanning concept to pair .msg files with their
 * optional .bundle/ companions. Returns DACPBusEntry objects that include
 * both the message path and the bundle path (if present).
 *
 * Scans priority-0 through priority-7 in strict order, returning entries
 * sorted by priority then timestamp.
 *
 * Accepts an optional `LoaderContext` (Tier-E security chokepoint, v1.49.782).
 * Two-site hoisted-check (#10448 sub-variant): both exported entry points
 * (`scanForBundles`, `scanPriorityDirWithBundles`) gate independently — direct
 * callers of the latter are still admitted through the chokepoint. Fourth
 * LoaderContext chip at v1.49.892.
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { ensureAllowed, type LoaderContext } from '../../security/loader-context.js';
import type { BusConfig } from '../../den/types.js';
import type { DACPBusEntry } from './types.js';

const LOADER_SOURCE = 'dacp/bus/scanner';

// ============================================================================
// Constants
// ============================================================================

/** Number of priority levels (0-7 inclusive) */
const PRIORITY_COUNT = 8;

// ============================================================================
// scanForBundles
// ============================================================================

/**
 * Scan all priority directories for messages with optional bundle companions.
 *
 * Iterates priority-0 through priority-7, calling scanPriorityDirWithBundles
 * for each. Returns all entries in priority order, optionally filtered
 * by target agent.
 *
 * @param config - Bus configuration
 * @param targetAgent - Optional agent ID to filter by
 * @param ctx - Optional security chokepoint. When provided, `config.busDir`
 *   must be admitted; each priority subdir is also re-gated via
 *   `scanPriorityDirWithBundles`.
 * @returns Array of bus entries in priority order
 */
export async function scanForBundles(
  config: BusConfig,
  targetAgent?: string,
  ctx?: LoaderContext,
): Promise<DACPBusEntry[]> {
  // Security chokepoint: gate on the bus directory before the priority loop.
  // Two-site hoisted-check (#10448 sub-variant) — scanPriorityDirWithBundles
  // also re-gates each subdir for callers that invoke it directly.
  ensureAllowed(ctx, LOADER_SOURCE, 'read-dir', config.busDir);

  const allEntries: DACPBusEntry[] = [];

  for (let p = 0; p < PRIORITY_COUNT; p++) {
    const dirPath = join(config.busDir, `priority-${p}`);
    const entries = await scanPriorityDirWithBundles(dirPath, p, ctx);
    allEntries.push(...entries);
  }

  if (targetAgent) {
    return allEntries.filter(
      (entry) => entry.target === targetAgent || entry.target === 'all',
    );
  }

  return allEntries;
}

// ============================================================================
// scanPriorityDirWithBundles
// ============================================================================

/**
 * Scan a single priority directory, pairing .msg files with .bundle/ companions.
 *
 * For each .msg file found, checks if a matching .bundle/ directory exists
 * (same stem name). Ignores entries that are neither .msg files nor .bundle/
 * directories.
 *
 * @param dirPath - Absolute path to the priority directory
 * @param priority - Priority level (0-7) for the entries
 * @param ctx - Optional security chokepoint. When provided, `dirPath` must
 *   be admitted before the readdir/stat sequence runs.
 * @returns Array of bus entries sorted by timestamp ascending
 */
export async function scanPriorityDirWithBundles(
  dirPath: string,
  priority: number,
  ctx?: LoaderContext,
): Promise<DACPBusEntry[]> {
  // Security chokepoint: gate on dirPath. Hoisted OUTSIDE the readdir
  // try/catch below so LoaderContextDenied propagates per #10442.
  ensureAllowed(ctx, LOADER_SOURCE, 'read-dir', dirPath);

  let entries: string[];

  try {
    entries = await readdir(dirPath);
  } catch {
    return [];
  }

  // Separate .msg files and .bundle/ directories
  const msgFiles = new Set<string>();
  const bundleDirs = new Set<string>();

  for (const entry of entries) {
    if (entry.endsWith('.msg')) {
      msgFiles.add(entry);
    } else if (entry.endsWith('.bundle')) {
      // Verify it's actually a directory
      try {
        const st = await stat(join(dirPath, entry));
        if (st.isDirectory()) {
          bundleDirs.add(entry);
        }
      } catch {
        // Ignore stat failures
      }
    }
    // Ignore all other entries
  }

  // Build DACPBusEntry for each .msg file
  const results: DACPBusEntry[] = [];

  for (const msgFile of msgFiles) {
    const stem = msgFile.replace(/\.msg$/, '');
    const bundleName = `${stem}.bundle`;
    const hasBundleCompanion = bundleDirs.has(bundleName);

    // Parse components from filename: {timestamp}-{opcode}-{src}-{dst}.msg
    const parsed = parseMsgFilename(stem);
    if (!parsed) continue;

    results.push({
      msgPath: join(dirPath, msgFile),
      bundlePath: hasBundleCompanion ? join(dirPath, bundleName) : null,
      priority,
      opcode: parsed.opcode,
      source: parsed.src,
      target: parsed.dst,
      timestamp: parsed.timestamp,
    });
  }

  // Sort by timestamp ascending
  results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return results;
}

// ============================================================================
// Filename parsing
// ============================================================================

/**
 * Parse message components from a filename stem.
 *
 * Expected format: {YYYYMMDD-HHMMSS}-{OPCODE}-{SRC}-{DST}
 * The timestamp contains a hyphen, so the first hyphen within the
 * 15-char timestamp block is part of the timestamp itself.
 *
 * @param stem - Filename without .msg extension
 * @returns Parsed components or null if unparseable
 */
function parseMsgFilename(
  stem: string,
): { timestamp: string; opcode: string; src: string; dst: string } | null {
  // Timestamp is exactly 15 chars: YYYYMMDD-HHMMSS
  if (stem.length < 16 || stem[15] !== '-') {
    return null;
  }

  const timestamp = stem.slice(0, 15);
  const rest = stem.slice(16); // after the hyphen

  // Rest format: OPCODE-SRC-DST
  const parts = rest.split('-');
  if (parts.length < 3) {
    return null;
  }

  const opcode = parts[0];
  const src = parts[1];
  const dst = parts[2];

  return { timestamp, opcode, src, dst };
}
