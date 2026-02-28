/**
 * Reads and parses a YAML work state file from disk.
 *
 * Returns null for missing, empty, invalid, or schema-violating files.
 * Uses JSON_SCHEMA for safe YAML loading (no executable tags).
 */

import { readFileSafe } from '../state/types.js';
import { WorkStateSchema } from './types.js';
import type { WorkState } from './types.js';

export class WorkStateReader {
  constructor(private filePath: string) {}

  /**
   * Read and parse the work state file.
   *
   * @returns Parsed WorkState with defaults filled, or null if file is
   *          missing, empty, contains invalid YAML, or fails schema validation.
   */
  async read(): Promise<WorkState | null> {
    const content = await readFileSafe(this.filePath);
    if (!content) return null;

    try {
      const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
      const raw = (yaml as any).load(content, { schema: (yaml as any).JSON_SCHEMA });
      const result = WorkStateSchema.safeParse(raw);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
}
