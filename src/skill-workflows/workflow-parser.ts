/**
 * YAML parsing and schema validation for workflow files.
 *
 * Provides two entry points:
 * - parseWorkflowYaml(content): parse YAML string to WorkflowDefinition
 * - parseWorkflowFile(filePath): read file and parse to WorkflowDefinition
 *
 * Both return null for any error (invalid YAML, schema failure, missing file).
 * Uses JSON_SCHEMA for safe YAML loading (no executable tags).
 */

import { WorkflowDefinitionSchema } from './types.js';
import type { WorkflowDefinition } from './types.js';

/**
 * Parse a YAML string into a typed WorkflowDefinition.
 *
 * @param content - Raw YAML content
 * @returns Parsed and validated WorkflowDefinition, or null on any error
 */
export async function parseWorkflowYaml(content: string): Promise<WorkflowDefinition | null> {
  if (!content || !content.trim()) return null;

  try {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    const raw = (yaml as any).load(content, { schema: (yaml as any).JSON_SCHEMA });
    if (!raw || typeof raw !== 'object') return null;

    const result = WorkflowDefinitionSchema.safeParse(raw);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Read a workflow YAML file from disk and parse it.
 *
 * @param filePath - Absolute path to .workflow.yaml file
 * @returns Parsed WorkflowDefinition, or null if file missing/invalid
 */
export async function parseWorkflowFile(filePath: string): Promise<WorkflowDefinition | null> {
  try {
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    return parseWorkflowYaml(content);
  } catch {
    return null;
  }
}
