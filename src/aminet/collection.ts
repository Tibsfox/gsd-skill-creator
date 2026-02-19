/**
 * Collection manifest import/export and starter collection loading.
 *
 * Collections are curated sets of Aminet packages stored as YAML files.
 * This module provides functions to:
 * - Import a YAML string into a validated CollectionManifest
 * - Export a CollectionManifest back to a YAML string
 * - List and load the 5 built-in starter collections
 *
 * @module
 */

import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CollectionManifestSchema } from './types.js';
import type { CollectionManifest } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The 5 starter collection names that ship with the pack */
const STARTER_COLLECTIONS = [
  'essential-utils',
  'classic-games',
  'demo-scene',
  'music-mods',
  'dev-tools',
] as const;

/**
 * Import a YAML string into a validated CollectionManifest.
 *
 * Parses the YAML content and validates it against CollectionManifestSchema.
 * Throws a Zod validation error if the content doesn't match the schema.
 *
 * @param yamlContent - YAML string to parse
 * @returns Validated CollectionManifest
 * @throws ZodError if validation fails
 * @throws YAMLException if YAML syntax is invalid
 */
export function importCollection(yamlContent: string): CollectionManifest {
  const raw = yaml.load(yamlContent);
  return CollectionManifestSchema.parse(raw);
}

/**
 * Export a CollectionManifest to a YAML string.
 *
 * Produces human-readable YAML with 2-space indentation, 120-char line
 * width, and no YAML anchors/references.
 *
 * @param manifest - The collection manifest to serialize
 * @returns YAML string representation
 */
export function exportCollection(manifest: CollectionManifest): string {
  return yaml.dump(manifest, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

/**
 * List the names of all built-in starter collections.
 *
 * @returns Array of 5 starter collection names
 */
export function listStarterCollections(): string[] {
  return [...STARTER_COLLECTIONS];
}

/**
 * Load a starter collection by name from the collections/ directory.
 *
 * Reads the YAML file from disk and validates it against the schema.
 *
 * @param name - Starter collection name (e.g., "essential-utils")
 * @returns Validated CollectionManifest
 * @throws Error if the collection name is unknown or file can't be read
 * @throws ZodError if the YAML content doesn't match the schema
 */
export function loadStarterCollection(name: string): CollectionManifest {
  if (!(STARTER_COLLECTIONS as readonly string[]).includes(name)) {
    throw new Error(
      `Unknown starter collection: "${name}". Available: ${STARTER_COLLECTIONS.join(', ')}`
    );
  }
  const filePath = join(__dirname, 'collections', `${name}.yaml`);
  const content = readFileSync(filePath, 'utf-8');
  return importCollection(content);
}
