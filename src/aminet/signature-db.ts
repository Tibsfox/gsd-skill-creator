/**
 * Virus signature database loader.
 *
 * Loads, validates, and merges JSON-based virus signature files from
 * the built-in `virus-signatures/` directory and optional additional
 * directories. New signatures can be added by dropping a JSON file
 * into any loaded directory -- no code changes required.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VirusSignatureDatabaseSchema,
  type VirusSignatureDatabase,
  type VirusSignature,
} from './types.js';

/**
 * Returns the absolute path to the built-in `virus-signatures/` directory.
 *
 * Resolves relative to this source file via `import.meta.url` so it
 * works regardless of the process working directory.
 */
export function getBuiltinSignaturesDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  return join(thisDir, 'virus-signatures');
}

/**
 * Loads and validates a single JSON signature file.
 *
 * Reads the file synchronously, parses JSON, and validates against
 * `VirusSignatureDatabaseSchema`. Throws a `ZodError` if the file
 * does not conform to the expected schema.
 *
 * @param filePath - Absolute path to a `.json` signature file
 * @returns Validated `VirusSignatureDatabase` object
 * @throws ZodError on validation failure, Error on file read failure
 */
export function loadSignatureFile(filePath: string): VirusSignatureDatabase {
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  return VirusSignatureDatabaseSchema.parse(parsed);
}

/**
 * Merges multiple signature databases into a deduplicated array.
 *
 * Signatures are deduplicated by name -- when multiple databases
 * contain a signature with the same name, the last one wins (later
 * databases override earlier ones). This allows custom directories
 * to override built-in signatures.
 *
 * @param databases - Array of validated signature databases to merge
 * @returns Deduplicated array of virus signatures
 */
export function mergeSignatures(databases: VirusSignatureDatabase[]): VirusSignature[] {
  const byName = new Map<string, VirusSignature>();

  for (const db of databases) {
    for (const sig of db.signatures) {
      byName.set(sig.name, sig);
    }
  }

  return Array.from(byName.values());
}

/**
 * Loads all JSON signature files from a directory.
 *
 * Reads all `.json` files from the given directory, validates each
 * against the signature database schema, and returns the array of
 * parsed databases. Non-JSON files are silently skipped.
 *
 * @param dir - Absolute path to a directory containing `.json` files
 * @returns Array of validated signature databases from that directory
 */
function loadSignatureDir(dir: string): VirusSignatureDatabase[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  return files.map((f) => loadSignatureFile(join(dir, f)));
}

/**
 * Loads the complete virus signature database.
 *
 * Loads all built-in signatures from `virus-signatures/`, then
 * optionally loads from additional user-specified directories.
 * All databases are merged with last-wins deduplication by name.
 *
 * @param additionalDirs - Optional extra directories to load signatures from
 * @returns Deduplicated array of all virus signatures
 */
export function loadSignatureDatabase(additionalDirs?: string[]): VirusSignature[] {
  const databases: VirusSignatureDatabase[] = [];

  // Load built-in signatures
  databases.push(...loadSignatureDir(getBuiltinSignaturesDir()));

  // Load from additional directories
  if (additionalDirs) {
    for (const dir of additionalDirs) {
      databases.push(...loadSignatureDir(dir));
    }
  }

  return mergeSignatures(databases);
}
