/**
 * Aminet INDEX.gz fetcher.
 *
 * Downloads the compressed INDEX file from an Aminet HTTP mirror,
 * decompresses it with Node.js zlib, decodes as ISO-8859-1 (critical
 * for European author names with accented characters), validates the
 * fixed-width column format, and caches locally for offline reuse.
 *
 * The fetcher tries mirrors in order until one succeeds, implements
 * configurable timeouts via AbortController, and writes both the
 * decompressed text and a metadata JSON for staleness checks.
 *
 * @module
 */

import { gunzipSync } from 'node:zlib';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';

import type { AminetMirrorConfig, IndexMetadata } from './types.js';

// ============================================================================
// decompressIndex
// ============================================================================

/**
 * Decompress a gzip buffer to raw bytes.
 *
 * Thin wrapper around `gunzipSync` for testability -- the caller gets
 * raw bytes that must be decoded separately (ISO-8859-1, not UTF-8).
 */
export function decompressIndex(gzipBuffer: Buffer | Uint8Array): Uint8Array {
  return gunzipSync(gzipBuffer);
}

// ============================================================================
// decodeIndexContent
// ============================================================================

/**
 * Decode raw bytes as ISO-8859-1 (Latin-1).
 *
 * This is critical: the Aminet INDEX contains European author names
 * with accented characters (e.g., 0xE9 = e-acute, 0xF1 = n-tilde).
 * Using UTF-8 decoding would produce mojibake or replacement characters.
 * ISO-8859-1 maps each byte directly to its Unicode code point.
 */
export function decodeIndexContent(rawBytes: Uint8Array): string {
  return new TextDecoder('iso-8859-1').decode(rawBytes);
}

// ============================================================================
// validateIndexFormat
// ============================================================================

/**
 * Validate that decompressed content looks like a real Aminet INDEX.
 *
 * The INDEX is a fixed-width text file where the first non-empty line
 * contains column headers separated by "|" characters, including "File".
 *
 * @throws Error if the format doesn't match expectations.
 */
export function validateIndexFormat(content: string): void {
  const lines = content.split('\n');
  const firstNonEmpty = lines.find((line) => line.trim().length > 0);

  if (!firstNonEmpty) {
    throw new Error('Invalid INDEX format: content is empty or whitespace-only');
  }

  // The header line must contain "|" separators and "File" column
  if (!firstNonEmpty.includes('|') || !firstNonEmpty.includes('File')) {
    throw new Error(
      `Invalid INDEX format: expected header with "|" separators and "File" column, ` +
        `got: "${firstNonEmpty.substring(0, 80)}"`,
    );
  }
}

// ============================================================================
// isIndexStale
// ============================================================================

/**
 * Check whether cached index metadata indicates staleness.
 *
 * @param metadata - Previously saved index metadata.
 * @param maxAgeMs - Maximum age in milliseconds. Default: 24 hours.
 * @returns `true` if the index is older than `maxAgeMs`.
 */
export function isIndexStale(
  metadata: IndexMetadata,
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): boolean {
  const fetchedAt = new Date(metadata.fetchedAt).getTime();
  return Date.now() - fetchedAt > maxAgeMs;
}

// ============================================================================
// loadCachedIndex
// ============================================================================

/**
 * Load a previously cached INDEX and its metadata from disk.
 *
 * @returns The cached content and metadata, or `null` if no cache exists.
 */
export async function loadCachedIndex(
  cacheDir: string,
): Promise<{ content: string; metadata: IndexMetadata } | null> {
  const indexPath = join(cacheDir, 'INDEX');
  const metaPath = join(cacheDir, 'INDEX.meta.json');

  if (!existsSync(indexPath) || !existsSync(metaPath)) {
    return null;
  }

  const content = readFileSync(indexPath, 'utf-8');
  const metadata: IndexMetadata = JSON.parse(readFileSync(metaPath, 'utf-8'));

  return { content, metadata };
}

// ============================================================================
// fetchAminetIndex
// ============================================================================

/**
 * Download, decompress, validate, and cache the Aminet INDEX.
 *
 * Tries each mirror in order. On success, writes the decompressed text
 * and a metadata JSON to `config.cacheDir`.
 *
 * @throws Error if all mirrors fail or the INDEX format is invalid.
 */
export async function fetchAminetIndex(
  config: AminetMirrorConfig,
): Promise<{ content: string; metadata: IndexMetadata }> {
  const errors: Array<{ mirror: string; error: Error }> = [];

  for (const mirror of config.mirrors) {
    try {
      const url = `${mirror}/aminet/INDEX.gz`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          headers: { 'User-Agent': config.userAgent },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const gzipBuffer = Buffer.from(arrayBuffer);

      // Decompress
      const rawBytes = decompressIndex(gzipBuffer);

      // Decode as ISO-8859-1
      const content = decodeIndexContent(rawBytes);

      // Validate format
      validateIndexFormat(content);

      // Build metadata
      const metadata: IndexMetadata = {
        fetchedAt: new Date().toISOString(),
        mirror,
        sizeBytes: content.length,
        lineCount: content.split('\n').length,
        encoding: 'iso-8859-1',
      };

      // Write cache
      mkdirSync(config.cacheDir, { recursive: true });
      writeFileSync(join(config.cacheDir, 'INDEX'), content, 'utf-8');
      writeFileSync(
        join(config.cacheDir, 'INDEX.meta.json'),
        JSON.stringify(metadata, null, 2),
        'utf-8',
      );

      return { content, metadata };
    } catch (err) {
      errors.push({
        mirror,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  // All mirrors failed
  const details = errors
    .map((e) => `  ${e.mirror}: ${e.error.message}`)
    .join('\n');
  throw new Error(
    `All ${config.mirrors.length} mirrors failed to fetch Aminet INDEX:\n${details}`,
  );
}
