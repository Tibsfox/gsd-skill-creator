/**
 * Serializes WorkState to a YAML file on disk.
 *
 * Creates parent directories if needed and writes the state
 * as sorted, human-readable YAML using js-yaml.
 */

import { writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { WorkState } from './types.js';

export class WorkStateWriter {
  constructor(private filePath: string) {}

  /**
   * Save work state to the configured YAML file path.
   *
   * Creates parent directories recursively if they don't exist.
   * Uses sorted keys and 2-space indentation for readability.
   *
   * The write is atomic: the content is written to a uniquely-named temp file
   * in the same directory and then renamed over the target. A rename within a
   * directory is atomic on POSIX filesystems, so a reader (or a re-run after a
   * crash) never observes a half-written, truncated YAML file.
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

    // Atomic write: temp file in the same directory (so rename is a same-device
    // link, never a cross-device copy), then rename over the target. The pid +
    // timestamp + random suffix keeps concurrent writers from colliding.
    const tempPath = join(
      dirname(this.filePath),
      `.work-state-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.yaml.tmp`,
    );
    await writeFile(tempPath, content, 'utf-8');
    try {
      await rename(tempPath, this.filePath);
    } catch (err) {
      // Rename failed — remove the temp file so it is not orphaned on disk.
      await rm(tempPath, { force: true });
      throw err;
    }
  }
}
