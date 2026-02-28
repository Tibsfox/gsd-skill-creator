/**
 * Serializes WorkState to a YAML file on disk.
 *
 * Creates parent directories if needed and writes the state
 * as sorted, human-readable YAML using js-yaml.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { WorkState } from './types.js';

export class WorkStateWriter {
  constructor(private filePath: string) {}

  /**
   * Save work state to the configured YAML file path.
   *
   * Creates parent directories recursively if they don't exist.
   * Uses sorted keys and 2-space indentation for readability.
   */
  async save(state: WorkState): Promise<void> {
    const yaml = (await import('js-yaml')).default ?? (await import('js-yaml'));
    await mkdir(dirname(this.filePath), { recursive: true });
    const content = (yaml as any).dump(state, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: true,
    });
    await writeFile(this.filePath, content, 'utf-8');
  }
}
