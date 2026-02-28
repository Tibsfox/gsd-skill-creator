/**
 * .skillmeta YAML parser with Zod validation.
 *
 * Parses .skillmeta YAML files and validates them against KnowledgePackSchema.
 * Uses dynamic import for js-yaml (consistent with project pattern in
 * src/bundles/bundle-activator.ts). Returns discriminated union results
 * with human-readable error messages including field paths and expected types.
 *
 * @module skillmeta-parser
 */

import { KnowledgePackSchema } from './types.js';
import type { KnowledgePack } from './types.js';
import { readFile } from 'node:fs/promises';

// ============================================================================
// Result type
// ============================================================================

/**
 * Discriminated union result for skillmeta parsing.
 * On success, contains the validated KnowledgePack data.
 * On failure, contains human-readable error messages.
 */
export type SkillmetaResult =
  | { success: true; data: KnowledgePack }
  | { success: false; errors: string[] };

// ============================================================================
// parseSkillmeta
// ============================================================================

/**
 * Parse a .skillmeta YAML string and validate against KnowledgePackSchema.
 *
 * Uses js-yaml's safe load (default schema) to parse YAML, then validates
 * the resulting object against the Zod schema. Error messages include
 * field paths and expected types for actionable feedback.
 *
 * @param yamlString - Raw YAML content from a .skillmeta file
 * @returns Validated KnowledgePack or array of human-readable errors
 */
export async function parseSkillmeta(yamlString: string): Promise<SkillmetaResult> {
  // Dynamic import js-yaml (consistent with project pattern)
  const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));

  // Parse YAML
  let parsed: unknown;
  try {
    parsed = (yaml as any).load(yamlString);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [`YAML parse error: ${message}`] };
  }

  // Ensure result is an object
  if (parsed === null || parsed === undefined || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      errors: ['Expected a YAML object (mapping), got ' + (parsed === null ? 'null' : typeof parsed)],
    };
  }

  // Validate against Zod schema
  const result = KnowledgePackSchema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Map Zod issues to human-readable error strings
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });

  return { success: false, errors };
}

// ============================================================================
// parseSkillmetaFile
// ============================================================================

/**
 * Read a .skillmeta file from disk and parse/validate its contents.
 *
 * @param filePath - Absolute or relative path to the .skillmeta file
 * @returns Validated KnowledgePack or array of human-readable errors
 */
export async function parseSkillmetaFile(filePath: string): Promise<SkillmetaResult> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [`Failed to read ${filePath}: ${message}`] };
  }

  return parseSkillmeta(content);
}
