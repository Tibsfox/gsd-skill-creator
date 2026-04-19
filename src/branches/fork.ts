/**
 * M4 Branch-Context Experimentation — copy-on-write branch creation.
 *
 * `fork()` creates a new branch under `.planning/branches/<branch-id>/`:
 *
 *   .planning/branches/<id>/
 *     manifest.json   — branch metadata (id, parentHash, state, etc.)
 *     skill.md        — copy of the proposed skill body
 *
 * The parent skill body is supplied by the caller (typically read from
 * SkillCodebase or a local file). The proposed (branched) body must not
 * exceed the 20% refinement bound measured as:
 *
 *   changedBytes / max(parentBytes, proposedBytes) ≤ 0.20
 *
 * If the bound is exceeded the fork is rejected with a descriptive error
 * (SC-REFINE-BOUND, CF-M4-05).
 *
 * Cross-platform guarantees (CF-M4-01, CF-M4-03):
 *   - Uses only `node:fs`, `node:path`, `node:os`, `node:crypto` from stdlib.
 *   - No btrfs/zfs/APFS clonefile/reflink primitives.
 *   - Path separators via `path.join` so macOS, Linux, and Windows all work.
 *   - Branch IDs are UUID v4 (no filesystem-specific characters).
 *
 * Phase 645, Wave 1 Track D (M4).
 *
 * @module branches/fork
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { computeDelta, deltaRejectionMessage } from './delta.js';
import { validateManifest } from './manifest.js';
import type { BranchManifest } from './manifest.js';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default branch directory root (gitignored runtime state). */
export const DEFAULT_BRANCHES_DIR = '.planning/branches';

/** Manifest filename inside a branch directory. */
export const MANIFEST_FILENAME = 'manifest.json';

/** Proposed skill body filename inside a branch directory. */
export const SKILL_FILENAME = 'skill.md';

// ─── Fork options ─────────────────────────────────────────────────────────────

export interface ForkOptions {
  /**
   * The current (trunk) skill body. Used to compute the delta bound and
   * to record the parent hash.
   */
  parentBody: string;

  /**
   * The proposed (branched) skill body. Must differ from parentBody by
   * at most 20% (SC-REFINE-BOUND).
   */
  proposedBody: string;

  /**
   * The skill name being branched.
   */
  skillName: string;

  /**
   * Override the branches root directory.
   * Defaults to `.planning/branches`.
   */
  branchesDir?: string;

  /**
   * Override branch ID (for deterministic tests).
   * Defaults to `randomUUID()`.
   */
  branchId?: string;

  /**
   * Override fork timestamp (Unix ms) for tests.
   * Defaults to `Date.now()`.
   */
  ts?: number;
}

export interface ForkResult {
  /** The new branch manifest written to disk. */
  manifest: BranchManifest;

  /** Absolute path to the branch directory. */
  branchDir: string;
}

// ─── fork() ──────────────────────────────────────────────────────────────────

/**
 * Create a copy-on-write branch for a skill refinement.
 *
 * Enforces the 20% refinement-diff bound at fork time.
 * Writes the branch directory, manifest, and proposed skill body.
 * Returns the manifest and branch directory path.
 *
 * @throws Error if the proposed diff exceeds the 20% bound (SC-REFINE-BOUND).
 */
export async function fork(opts: ForkOptions): Promise<ForkResult> {
  const {
    parentBody,
    proposedBody,
    skillName,
    branchesDir = DEFAULT_BRANCHES_DIR,
    branchId = randomUUID(),
    ts = Date.now(),
  } = opts;

  // Enforce 20% bound before touching the filesystem.
  const delta = computeDelta(parentBody, proposedBody);
  if (delta.exceeds) {
    throw new Error(deltaRejectionMessage(delta));
  }

  // Compute parent hash (hex SHA-256 of UTF-8 encoded parent body).
  const parentHash = sha256Hex(parentBody);

  // Build branch directory path using path.join (cross-platform).
  const branchDir = join(branchesDir, branchId);

  // Create the branch directory (recursive = idempotent).
  await fs.mkdir(branchDir, { recursive: true });

  // Write the proposed skill body.
  await fs.writeFile(join(branchDir, SKILL_FILENAME), proposedBody, 'utf8');

  // Build and validate the manifest.
  const manifest: BranchManifest = {
    id: branchId,
    skillName,
    parentHash,
    parentByteLength: delta.parentBytes,
    createdAt: ts,
    state: 'open',
    exploreSessionCount: 0,
    tracePaths: [],
    proposedByteLength: delta.proposedBytes,
    deltaFraction: delta.fraction,
  };

  // Validate round-trips correctly before writing.
  validateManifest(manifest);

  await writeManifest(branchDir, manifest);

  return { manifest, branchDir };
}

// ─── Manifest I/O helpers (shared with other modules) ─────────────────────────

/**
 * Read and validate the manifest from a branch directory.
 * Throws if the manifest file is missing or malformed.
 */
export async function readManifest(branchDir: string): Promise<BranchManifest> {
  const raw = await fs.readFile(join(branchDir, MANIFEST_FILENAME), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return validateManifest(parsed);
}

/**
 * Write (overwrite) the manifest in a branch directory.
 * Uses a write-then-rename strategy via a temp file to avoid partial writes.
 * The temp file lives in the same directory so the rename is atomic on
 * any POSIX fs and close-enough on Windows (same volume).
 */
export async function writeManifest(branchDir: string, manifest: BranchManifest): Promise<void> {
  const dest = join(branchDir, MANIFEST_FILENAME);
  const tmp = dest + '.tmp.' + randomUUID();
  await fs.writeFile(tmp, JSON.stringify(manifest, null, 2), 'utf8');
  await fs.rename(tmp, dest);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Compute the hex SHA-256 hash of a UTF-8 string. */
function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}
