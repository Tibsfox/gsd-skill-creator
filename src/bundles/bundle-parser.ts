/**
 * YAML parsing and schema validation for bundle files.
 *
 * Provides two entry points:
 * - parseBundleYaml(content): parse YAML string to BundleDefinition
 * - parseBundleFile(filePath): read file and parse to BundleDefinition
 *
 * Both return null for any error (invalid YAML, schema failure, missing file).
 * Uses JSON_SCHEMA for safe YAML loading (no executable tags).
 */

import { BundleDefinitionSchema } from './types.js';
import type { BundleDefinition } from './types.js';

/**
 * Parse a YAML string into a typed BundleDefinition.
 *
 * @param content - Raw YAML content
 * @returns Parsed and validated BundleDefinition, or null on any error
 */
export async function parseBundleYaml(content: string): Promise<BundleDefinition | null> {
  if (!content || !content.trim()) return null;

  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const raw = (yaml as any).load(content, { schema: (yaml as any).JSON_SCHEMA });
    if (!raw || typeof raw !== 'object') return null;

    const result = BundleDefinitionSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Read a bundle YAML file from disk and parse it.
 *
 * @param filePath - Absolute path to .bundle.yaml file
 * @returns Parsed BundleDefinition, or null if file missing/invalid
 */
export async function parseBundleFile(filePath: string): Promise<BundleDefinition | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    return parseBundleYaml(content);
  } catch {
    return null;
  }
}
