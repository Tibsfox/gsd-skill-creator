/**
 * M4 Branch-Context Experimentation — branch manifest schema + validator.
 *
 * Branch manifests live at `.planning/branches/<branch-id>/manifest.json`.
 * They are runtime state (gitignored); the schema here is the single source
 * of truth for what a valid manifest looks like.
 *
 * Design decisions:
 *   - Plain JSON; no binary encoding needed (branches are local, short-lived).
 *   - `state` is the branch lifecycle state: open → committed | aborted.
 *   - `parentHash` is the SHA-256 hex of the parent skill body bytes at fork
 *     time — used to detect conflicts and compute delta bounds.
 *   - `committedAt` / `abortedAt` are Unix ms timestamps set when terminal
 *     state is reached; absent in open branches.
 *   - `exploreSessionCount` tracks how many sessions the branch has been
 *     active alongside trunk.
 *   - `tracePaths` collects per-session M3 trace file paths for audit.
 *   - `createdAt` is set at fork time; used for GC age calculation.
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/manifest
 */

import type { BranchState } from '../types/memory.js';

// ─── Manifest shape ───────────────────────────────────────────────────────────

/**
 * The on-disk shape of `.planning/branches/<id>/manifest.json`.
 * All fields are plain JSON-serialisable values.
 */
export interface BranchManifest {
  /** Unique branch identifier (UUID v4). */
  id: string;

  /** The skill name this branch is experimenting on. */
  skillName: string;

  /**
   * Hex-encoded SHA-256 hash of the parent skill body at fork time.
   * Used for delta-bound verification and conflict detection.
   */
  parentHash: string;

  /**
   * Byte length of the parent skill body at fork time.
   * Stored explicitly for delta computation without re-reading the parent.
   */
  parentByteLength: number;

  /** Unix ms timestamp when the branch was created (fork time). */
  createdAt: number;

  /** Current lifecycle state. */
  state: BranchState;

  /**
   * Unix ms timestamp when this branch was committed.
   * Only present in `committed` state.
   */
  committedAt?: number;

  /**
   * Unix ms timestamp when this branch was aborted.
   * Only present in `aborted` state.
   */
  abortedAt?: number;

  /**
   * Number of explore sessions completed for this branch.
   * Incremented by `explore()` after each session.
   */
  exploreSessionCount: number;

  /**
   * Paths to per-session M3 trace files captured during explore.
   * Each entry is a file path (relative to repo root) or an absolute path.
   */
  tracePaths: string[];

  /**
   * Byte length of the proposed (branched) skill body at fork time.
   * Stored for delta-bound verification on commit.
   */
  proposedByteLength: number;

  /**
   * Fractional diff at fork time: changed bytes / max(parent, proposed) bytes.
   * Stored so callers can surface it without recomputing.
   */
  deltaFraction: number;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a parsed JSON object as a BranchManifest.
 * Throws a descriptive error if any required field is missing or wrong type.
 * Does NOT validate business rules (e.g. delta bound) — those are enforced
 * at fork time by `fork.ts`.
 */
export function validateManifest(raw: unknown): BranchManifest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('BranchManifest: expected a JSON object');
  }

  const obj = raw as Record<string, unknown>;

  assertString(obj, 'id');
  assertString(obj, 'skillName');
  assertString(obj, 'parentHash');
  assertNumber(obj, 'parentByteLength');
  assertNumber(obj, 'createdAt');
  assertBranchState(obj, 'state');
  assertNumber(obj, 'exploreSessionCount');
  assertStringArray(obj, 'tracePaths');
  assertNumber(obj, 'proposedByteLength');
  assertNumber(obj, 'deltaFraction');

  // Optional timestamps
  if ('committedAt' in obj && obj.committedAt !== undefined) {
    assertNumber(obj, 'committedAt');
  }
  if ('abortedAt' in obj && obj.abortedAt !== undefined) {
    assertNumber(obj, 'abortedAt');
  }

  return obj as unknown as BranchManifest;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertString(obj: Record<string, unknown>, field: string): void {
  if (typeof obj[field] !== 'string') {
    throw new Error(`BranchManifest: field "${field}" must be a string (got ${typeof obj[field]})`);
  }
}

function assertNumber(obj: Record<string, unknown>, field: string): void {
  if (typeof obj[field] !== 'number') {
    throw new Error(`BranchManifest: field "${field}" must be a number (got ${typeof obj[field]})`);
  }
}

function assertStringArray(obj: Record<string, unknown>, field: string): void {
  if (!Array.isArray(obj[field]) || !(obj[field] as unknown[]).every((v) => typeof v === 'string')) {
    throw new Error(`BranchManifest: field "${field}" must be a string[]`);
  }
}

function assertBranchState(obj: Record<string, unknown>, field: string): void {
  const valid: BranchState[] = ['open', 'committed', 'aborted'];
  if (!valid.includes(obj[field] as BranchState)) {
    throw new Error(
      `BranchManifest: field "${field}" must be one of ${valid.join('|')} (got ${String(obj[field])})`,
    );
  }
}
