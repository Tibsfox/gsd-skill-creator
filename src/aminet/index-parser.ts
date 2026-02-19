/**
 * Aminet INDEX fixed-width column parser.
 *
 * Parses the plain-text Aminet INDEX file (fetched and decoded by
 * `index-fetcher.ts`) into structured `AminetPackage[]` data. Each line
 * in the INDEX contains a package filename, directory path, size, age
 * in days, and a short description in a fixed-width layout.
 *
 * The parser is lenient: malformed lines are skipped with an error
 * counter rather than failing the entire parse. This is critical for
 * production use where the ~84,000 line INDEX may contain occasional
 * formatting anomalies.
 *
 * @module
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';

import type { AminetPackage, AminetIndex } from './types.js';

// ============================================================================
// Size parsing
// ============================================================================

/**
 * Parse a size token like "234K", "1.2M", or "45K" into kilobytes.
 *
 * @returns Size in KB, or NaN if unparseable.
 */
function parseSizeKb(token: string): number {
  const match = token.match(/^(\d+(?:\.\d+)?)\s*([KkMm])$/);
  if (!match) return NaN;

  const value = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();

  if (suffix === 'M') return Math.round(value * 1000);
  return Math.round(value); // K suffix
}

// ============================================================================
// parseIndexLine
// ============================================================================

/**
 * Parse a single line from the Aminet INDEX into an AminetPackage.
 *
 * The INDEX format uses whitespace-separated columns:
 * ```
 * filename.lha  dir/subdir  123K  45 Some description here
 * ```
 *
 * Header lines (starting with "|"), separator lines (dashes), and blank
 * lines are skipped (return null). Malformed data lines also return null
 * for lenient handling.
 *
 * @param line - A single line from the INDEX file.
 * @returns Parsed package, or null if the line should be skipped.
 */
export function parseIndexLine(line: string): AminetPackage | null {
  const trimmed = line.trim();

  // Skip blank lines
  if (trimmed.length === 0) return null;

  // Skip header lines starting with |
  if (trimmed.startsWith('|')) return null;

  // Skip separator lines (mostly dashes, plus, pipe)
  if (/^[\-|+]+$/.test(trimmed)) return null;

  // Tokenize: split on whitespace, but the description is everything
  // after the first 4 tokens.
  //
  // Layout: filename  directory  size  age  description...
  //
  // We use a regex to grab the first 4 whitespace-separated tokens,
  // then take the rest as description.
  const match = trimmed.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+)$/);
  if (!match) return null;

  const [, filename, directory, sizeToken, ageToken, description] = match;

  // Parse size
  const sizeKb = parseSizeKb(sizeToken);
  if (isNaN(sizeKb)) return null;

  // Parse age
  const ageDays = parseInt(ageToken, 10);
  if (isNaN(ageDays)) return null;

  // Split directory into category/subcategory
  const slashIndex = directory.indexOf('/');
  if (slashIndex === -1) return null;

  const category = directory.substring(0, slashIndex);
  const subcategory = directory.substring(slashIndex + 1);

  // Compute full path
  const fullPath = `${directory}/${filename}`;

  return {
    filename,
    directory,
    category,
    subcategory,
    sizeKb,
    ageDays,
    description,
    fullPath,
  };
}

// ============================================================================
// parseAminetIndex
// ============================================================================

/**
 * Parse the full Aminet INDEX content into structured data.
 *
 * Splits the content on newlines and processes each line through
 * `parseIndexLine`. Lines that return null (headers, blanks, malformed)
 * are counted appropriately. Only lines that look like data but fail
 * parsing increment the error counter.
 *
 * @param content - The full INDEX file content as a string.
 * @returns Parsed index with packages, error count, and metadata.
 */
export function parseAminetIndex(content: string): AminetIndex {
  const lines = content.split('\n');
  const packages: AminetPackage[] = [];
  let parseErrors = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip truly empty lines and known header/separator lines
    if (
      trimmed.length === 0 ||
      trimmed.startsWith('|') ||
      /^[\-|+]+$/.test(trimmed)
    ) {
      continue;
    }

    // This looks like a data line -- try to parse it
    const pkg = parseIndexLine(line);
    if (pkg) {
      packages.push(pkg);
    } else {
      parseErrors++;
    }
  }

  return {
    packages,
    parseErrors,
    totalLines: lines.length,
    parsedAt: new Date().toISOString(),
  };
}

// ============================================================================
// writeIndexCache
// ============================================================================

/**
 * Write a parsed AminetIndex to disk as JSON for offline querying.
 *
 * @param index - The parsed index data.
 * @param cacheDir - Directory to write INDEX.json into.
 */
export async function writeIndexCache(
  index: AminetIndex,
  cacheDir: string,
): Promise<void> {
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(
    join(cacheDir, 'INDEX.json'),
    JSON.stringify(index),
    'utf-8',
  );
}

// ============================================================================
// readIndexCache
// ============================================================================

/**
 * Read a previously cached AminetIndex from disk.
 *
 * @param cacheDir - Directory containing INDEX.json.
 * @returns The cached index, or null if no cache exists.
 */
export async function readIndexCache(
  cacheDir: string,
): Promise<AminetIndex | null> {
  const cachePath = join(cacheDir, 'INDEX.json');

  if (!existsSync(cachePath)) {
    return null;
  }

  const raw = readFileSync(cachePath, 'utf-8');
  return JSON.parse(raw) as AminetIndex;
}
