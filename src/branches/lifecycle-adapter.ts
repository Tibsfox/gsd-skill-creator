/**
 * M4 Branch-Context Experimentation — lifecycle adapter for branch state.
 *
 * Grove posture: EXTEND `src/mesh/lifecycle-resolver.ts`.
 *
 * This thin adapter extends the existing `SkillLifecycleResolver` with a
 * `BranchLifecycleResolver` class that reads `.planning/branches/<id>/manifest.json`
 * and exposes the branch lifecycle state machine:
 *
 *   open → committed
 *   open → aborted
 *
 * The `SkillLifecycleResolver` is not modified; `BranchLifecycleResolver`
 * composes on top of it so that the existing lifecycle tests remain green.
 *
 * State derivation:
 *   - Reads the manifest file from the branch directory.
 *   - Returns `manifest.state` directly — the state machine is enforced by
 *     `commit.ts` and `abort.ts`; the resolver is read-only.
 *   - If the manifest does not exist → throws "Branch not found".
 *   - If the manifest is malformed → throws with the validation error.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/lifecycle-adapter
 */

import { join } from 'node:path';
import { readManifest, DEFAULT_BRANCHES_DIR } from './fork.js';
import type { BranchManifest } from './manifest.js';
import type { BranchState } from '../types/memory.js';

// Re-export the existing resolver so callers can import both from this module.
export { SkillLifecycleResolver } from '../mesh/lifecycle-resolver.js';

// ─── BranchLifecycleResolver ──────────────────────────────────────────────────

export interface BranchStateEntry {
  /** Branch ID. */
  id: string;

  /** Current branch lifecycle state. */
  state: BranchState;

  /** The full manifest (callers may need metadata beyond just state). */
  manifest: BranchManifest;
}

/**
 * Resolves branch lifecycle state from on-disk manifests.
 *
 * This is the M4 extension of the lifecycle-resolver pattern: instead of
 * deriving state from SkillStore + ResultStore, it reads the branch manifest
 * written by fork/commit/abort operations.
 *
 * All methods are read-only; state transitions happen in fork.ts, commit.ts,
 * and abort.ts via manifest updates.
 */
export class BranchLifecycleResolver {
  constructor(
    /** Root directory containing branch subdirectories. Defaults to DEFAULT_BRANCHES_DIR. */
    private readonly branchesDir: string = DEFAULT_BRANCHES_DIR,
  ) {}

  /**
   * Resolve the lifecycle state of a specific branch by ID.
   *
   * @param branchId - The branch UUID.
   * @returns BranchStateEntry with the current state.
   * @throws Error if the branch directory or manifest does not exist.
   */
  async resolve(branchId: string): Promise<BranchStateEntry> {
    const branchDir = join(this.branchesDir, branchId);
    let manifest: BranchManifest;
    try {
      manifest = await readManifest(branchDir);
    } catch (err) {
      // Distinguish "not found" from "malformed".
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('ENOENT') || msg.includes('no such file')) {
        throw new Error(`Branch not found: ${branchId}`);
      }
      throw err;
    }
    return { id: branchId, state: manifest.state, manifest };
  }

  /**
   * List all branches and their lifecycle states.
   *
   * Reads the branches directory and resolves each subdirectory.
   * Branches whose manifests are missing or malformed are skipped with
   * a graceful degradation (logged to stderr, not thrown).
   *
   * @returns Array of BranchStateEntry sorted by createdAt ascending.
   */
  async listAll(): Promise<BranchStateEntry[]> {
    const { promises: fs } = await import('node:fs');

    let entries: string[];
    try {
      entries = await fs.readdir(this.branchesDir);
    } catch {
      // Branches directory does not exist yet — no branches.
      return [];
    }

    const results: BranchStateEntry[] = [];
    for (const entry of entries) {
      try {
        const resolved = await this.resolve(entry);
        results.push(resolved);
      } catch {
        // Skip malformed/missing manifests silently.
      }
    }

    // Sort by creation time ascending.
    results.sort((a, b) => a.manifest.createdAt - b.manifest.createdAt);
    return results;
  }

  /**
   * List branches filtered by state.
   */
  async listByState(state: BranchState): Promise<BranchStateEntry[]> {
    const all = await this.listAll();
    return all.filter((e) => e.state === state);
  }
}
