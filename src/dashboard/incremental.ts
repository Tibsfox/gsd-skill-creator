/**
 * Incremental build support for the GSD Planning Docs Dashboard.
 *
 * Provides content-hash change detection via SHA-256 and a JSON build
 * manifest (.dashboard-manifest.json) so only changed pages are
 * regenerated on subsequent runs.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-page entry in the build manifest. */
export interface ManifestEntry {
  /** SHA-256 hex hash of the rendered HTML content. */
  hash: string;
  /** ISO 8601 timestamp of when the page was last generated. */
  generatedAt: string;
}

/** The on-disk build manifest format. */
export interface BuildManifest {
  /** Map of filename -> manifest entry. */
  pages: Record<string, ManifestEntry>;
}

/** Name of the manifest file written to the output directory. */
export const MANIFEST_FILENAME = '.dashboard-manifest.json';

// ---------------------------------------------------------------------------
// Hash computation
// ---------------------------------------------------------------------------

/**
 * Compute a SHA-256 hex digest for the given content string.
 *
 * @param content - The string to hash.
 * @returns 64-character lowercase hex string.
 */
export function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

// ---------------------------------------------------------------------------
// Manifest I/O
// ---------------------------------------------------------------------------

/**
 * Load the build manifest from an output directory.
 *
 * Returns an empty manifest (no pages) if the file does not exist or
 * cannot be parsed.
 *
 * @param outputDir - Path to the dashboard output directory.
 * @returns The parsed BuildManifest.
 */
export async function loadManifest(outputDir: string): Promise<BuildManifest> {
  try {
    const raw = await readFile(join(outputDir, MANIFEST_FILENAME), 'utf-8');
    const parsed = JSON.parse(raw) as BuildManifest;

    // Basic shape validation
    if (parsed && typeof parsed === 'object' && parsed.pages && typeof parsed.pages === 'object') {
      return parsed;
    }

    return { pages: {} };
  } catch {
    return { pages: {} };
  }
}

/**
 * Save the build manifest to an output directory.
 *
 * @param outputDir - Path to the dashboard output directory.
 * @param manifest  - The manifest to persist.
 */
export async function saveManifest(outputDir: string, manifest: BuildManifest): Promise<void> {
  const filePath = join(outputDir, MANIFEST_FILENAME);
  await writeFile(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

/**
 * Determine whether a page needs to be regenerated.
 *
 * A page needs regeneration when:
 * 1. It is not present in the manifest (new page).
 * 2. Its current content hash differs from the manifest hash (content changed).
 *
 * @param pageName    - Filename of the page (e.g. "index.html").
 * @param currentHash - SHA-256 hash of the current rendered content.
 * @param manifest    - The loaded build manifest.
 * @returns `true` if the page should be written, `false` if it can be skipped.
 */
export function needsRegeneration(
  pageName: string,
  currentHash: string,
  manifest: BuildManifest,
): boolean {
  const entry = manifest.pages[pageName];
  if (!entry) return true;
  return entry.hash !== currentHash;
}
