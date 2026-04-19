/**
 * ME-3 Skill A/B Harness — Read API for ongoing experiments.
 *
 * Provides read-only access to experiment state: current sample count,
 * latest p-value, and raw outcomes.  This API is consumed by:
 *   - `skill-creator ab status`  — CLI status subcommand.
 *   - Future dashboard / monitoring integrations.
 *
 * The harness stores experiment state in `.planning/branches/<id>/ab-state.json`.
 * This file is written by the coordinator and read here without re-running the
 * significance test (results are pre-computed and cached).
 *
 * When no state file exists for a branch, the API returns a 'not-found' status.
 *
 * Zero external dependencies.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/api
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { ABVerdict, ABOutcome } from './coordinator.js';

// ─── State file name ─────────────────────────────────────────────────────────

export const AB_STATE_FILENAME = 'ab-state.json';

// ─── State shape ─────────────────────────────────────────────────────────────

export interface ABExperimentState {
  /** Branch ID for variant B. */
  branchId: string;

  /** Skill name under test. */
  skillName: string;

  /** Experiment start time (Unix ms). */
  startedAt: number;

  /** Number of sessions completed per variant. */
  samplesPerVariant: number;

  /** Collected outcomes (all sessions, both variants). */
  outcomes: ABOutcome[];

  /**
   * Latest verdict, if the significance test has been run.
   * Absent when the experiment has not yet reached minSamples.
   */
  latestVerdict?: ABVerdict;

  /**
   * Whether the experiment has been resolved (committed or aborted).
   */
  resolved: boolean;

  /**
   * Terminal resolution when resolved = true.
   */
  resolution?: 'committed' | 'aborted' | 'insufficient-data';
}

// ─── Status result ────────────────────────────────────────────────────────────

export type ExperimentStatusResult =
  | { status: 'not-found' }
  | { status: 'found'; state: ABExperimentState }
  | { status: 'error'; error: string };

// ─── Read API ─────────────────────────────────────────────────────────────────

/**
 * Read the current state of a running or completed A/B experiment.
 *
 * @param branchId   — The branch ID for variant B.
 * @param branchesDir — Root directory for branches (default `.planning/branches`).
 */
export async function getExperimentStatus(
  branchId: string,
  branchesDir = '.planning/branches',
): Promise<ExperimentStatusResult> {
  const statePath = join(branchesDir, branchId, AB_STATE_FILENAME);
  try {
    const raw = await fs.readFile(statePath, 'utf8');
    const state = JSON.parse(raw) as ABExperimentState;
    return { status: 'found', state };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return { status: 'not-found' };
    }
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * List all experiment state files in the branches directory.
 * Returns an array of `{ branchId, state }` records for branches that have
 * an `ab-state.json` file.
 */
export async function listExperiments(
  branchesDir = '.planning/branches',
): Promise<Array<{ branchId: string; state: ABExperimentState }>> {
  const result: Array<{ branchId: string; state: ABExperimentState }> = [];
  let entries: string[];

  try {
    entries = await fs.readdir(branchesDir);
  } catch {
    return result;
  }

  for (const entry of entries) {
    const statePath = join(branchesDir, entry, AB_STATE_FILENAME);
    try {
      const raw = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(raw) as ABExperimentState;
      result.push({ branchId: entry, state });
    } catch {
      // Not an AB experiment directory — skip.
    }
  }

  return result;
}

/**
 * Write experiment state to the branch directory.
 * Used by the coordinator to persist intermediate and final state.
 *
 * @param branchId   — Branch ID (directory name under branchesDir).
 * @param state      — State to persist.
 * @param branchesDir — Root branches directory.
 */
export async function writeExperimentState(
  branchId: string,
  state: ABExperimentState,
  branchesDir = '.planning/branches',
): Promise<void> {
  const dir = join(branchesDir, branchId);
  await fs.mkdir(dir, { recursive: true });
  const statePath = join(dir, AB_STATE_FILENAME);
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
}
