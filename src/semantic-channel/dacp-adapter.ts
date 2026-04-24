/**
 * Semantic Channel — read-only adapter over existing DACP bundles.
 *
 * Extracts the `SemanticChannelTriad` and `ChannelState` views from a
 * DACP bundle directory on disk. Uses ONLY node:fs/promises read APIs
 * (`readFile`, `readdir`); never writes, never mutates. The existing
 * `src/dacp/types.ts` schemas are treated as the source of truth and
 * imported only as types — they are never redefined, never re-exported
 * with reassignment, and never validated against by this adapter (the
 * adapter trusts whatever the DACP module wrote).
 *
 * ## Hard-preservation invariants
 *
 * - Zero file-system mutation APIs anywhere in this module (CAPCOM
 *   write-path regex enforces this statically).
 * - Zero CAPCOM-state or gate references.
 * - `BundleManifestSchema` and `DACP_VERSION` are **not** reassigned or
 *   re-exported; the adapter consumes them read-only via type imports.
 *
 * @module semantic-channel/dacp-adapter
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { BundleManifest, FidelityLevel } from '../dacp/types.js';
import type {
  ChannelComponentFidelity,
  ChannelState,
  SemanticChannelTriad,
} from './types.js';
import { fidelityLevelToTriad } from './types.js';

// ============================================================================
// Read-only triad extraction
// ============================================================================

/**
 * Read a DACP bundle directory and return its three-part-bundle triad.
 *
 * Reads ONLY: `intent.md`, all files directly in `data/` (JSON-parses
 * each), all files directly in `code/` (returns raw contents). Missing
 * directories are treated as empty; this mirrors the existing DACP
 * `listBundleContents` behaviour.
 */
export async function readTriad(
  bundleDir: string,
): Promise<SemanticChannelTriad> {
  // Human intent
  const humanIntent = await safeReadFile(join(bundleDir, 'intent.md'));

  // Structured data
  const structuredData: Record<string, unknown> = {};
  const dataDir = join(bundleDir, 'data');
  const dataFiles = await safeReaddir(dataDir);
  for (const name of dataFiles) {
    const raw = await safeReadFile(join(dataDir, name));
    try {
      structuredData[name] = JSON.parse(raw);
    } catch {
      // Non-JSON files in data/ are surfaced as their raw string; a
      // well-formed DACP bundle will not trigger this branch but the
      // adapter must not throw on malformed input (it is a passive
      // reader, not a validator).
      structuredData[name] = raw;
    }
  }

  // Executable code
  const executableCode: string[] = [];
  const codeDir = join(bundleDir, 'code');
  const codeFiles = await safeReaddir(codeDir);
  for (const name of codeFiles) {
    executableCode.push(await safeReadFile(join(codeDir, name)));
  }

  return { humanIntent, structuredData, executableCode };
}

/**
 * Read a DACP bundle directory and return its full channel state —
 * triad + per-component fidelity (derived from the manifest's
 * numeric DACP fidelity_level via `fidelityLevelToTriad`) + a reference
 * to the original `BundleManifest` object (unchanged).
 */
export async function computeChannelState(
  bundleDir: string,
): Promise<ChannelState> {
  const manifestRaw = await readFile(
    join(bundleDir, 'manifest.json'),
    'utf8',
  );
  // Parse-only: the DACP module is authoritative for manifest validation.
  // The adapter does not re-validate; it trusts the on-disk bundle.
  const manifest = JSON.parse(manifestRaw) as BundleManifest;
  const triad = await readTriad(bundleDir);
  const fidelity = deriveFidelity(manifest.fidelity_level);
  return { triad, fidelity, manifest };
}

/**
 * Per-component fidelity derivation from the DACP numeric fidelity level.
 *
 * Pure function; equivalent to `fidelityLevelToTriad` but kept as a named
 * adapter-level helper so the mapping point is unambiguous.
 */
export function deriveFidelity(
  level: FidelityLevel,
): ChannelComponentFidelity {
  return fidelityLevelToTriad(level);
}

// ============================================================================
// Internal helpers (read-only)
// ============================================================================

async function safeReadFile(p: string): Promise<string> {
  try {
    return await readFile(p, 'utf8');
  } catch {
    return '';
  }
}

async function safeReaddir(p: string): Promise<string[]> {
  try {
    const entries = await readdir(p, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}
