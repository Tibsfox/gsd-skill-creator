/**
 * YAML parsing and schema validation for role files.
 *
 * Provides two entry points:
 * - parseRoleYaml(content): parse YAML string to RoleDefinition
 * - parseRoleFile(filePath): read file and parse to RoleDefinition
 *
 * Both return null for any error (invalid YAML, schema failure, missing file).
 * Uses JSON_SCHEMA for safe YAML loading (no executable tags).
 */

import { RoleDefinitionSchema } from './types.js';
import type { RoleDefinition } from './types.js';

/**
 * Parse a YAML string into a typed RoleDefinition.
 *
 * @param content - Raw YAML content
 * @returns Parsed and validated RoleDefinition, or null on any error
 */
export async function parseRoleYaml(content: string): Promise<RoleDefinition | null> {
  if (!content || !content.trim()) return null;

  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const raw = (yaml as any).load(content, { schema: (yaml as any).JSON_SCHEMA });
    if (!raw || typeof raw !== 'object') return null;

    const result = RoleDefinitionSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Read a role YAML file from disk and parse it.
 *
 * @param filePath - Absolute path to .role.yaml file
 * @returns Parsed RoleDefinition, or null if file missing/invalid
 */
export async function parseRoleFile(filePath: string): Promise<RoleDefinition | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    return parseRoleYaml(content);
  } catch {
    return null;
  }
}
