/**
 * Incremental scan state manager.
 *
 * Persists manifest file hashes and cached HealthSignals so that unchanged
 * packages are not re-queried on subsequent audit runs.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import type { DependencyRecord, HealthSignal, IncrementalScanState } from './types.js';

export class IncrementalScanner {
  private state: IncrementalScanState | null = null;

  constructor(private readonly stateFilePath: string) {}

  /** Load persisted state from disk.  Call before getStaleOrNew. */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.stateFilePath, 'utf8');
      this.state = JSON.parse(raw) as IncrementalScanState;
    } catch {
      // No state file on first run — all deps will be stale
      this.state = null;
    }
  }

  /**
   * Returns only the deps that need fresh registry queries.
   *
   * A dep is stale when:
   * - Its source manifest file hash has changed since last scan, OR
   * - Its key (`${ecosystem}:${name}`) is absent from the cached signals.
   *
   * On first run (no state file), every dep is returned as stale.
   */
  async getStaleOrNew(
    deps: DependencyRecord[],
    manifestPaths: string[],
  ): Promise<DependencyRecord[]> {
    if (!this.state) return [...deps];

    // Identify manifests whose content has changed
    const changedManifests = new Set<string>();
    for (const mPath of manifestPaths) {
      try {
        const content = await readFile(mPath, 'utf8');
        const hash = createHash('sha256').update(content).digest('hex');
        if (this.state.manifestHashes[mPath] !== hash) {
          changedManifests.add(mPath);
        }
      } catch {
        // Unreadable manifest → treat as changed
        changedManifests.add(mPath);
      }
    }

    return deps.filter((dep) => {
      const key = `${dep.ecosystem}:${dep.name}`;
      return (
        changedManifests.has(dep.sourceManifest) ||
        !(key in this.state!.cachedSignals)
      );
    });
  }

  /** Retrieve a cached HealthSignal by its `${ecosystem}:${name}` key. */
  getCachedSignal(key: string): HealthSignal | undefined {
    return this.state?.cachedSignals[key];
  }

  /**
   * Persist the updated scan state atomically.
   * Writes to a temp file then renames to prevent partial writes.
   */
  async saveState(state: IncrementalScanState): Promise<void> {
    const tmp = `${this.stateFilePath}.tmp`;
    await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
    await rename(tmp, this.stateFilePath);
    this.state = state;
  }
}
