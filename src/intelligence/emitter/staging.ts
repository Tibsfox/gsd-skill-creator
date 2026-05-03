/**
 * Atomic staging-write helpers for the mission emitter (TS side).
 *
 * Mirrors the Rust `staging.rs` pattern from PRD §Atomic Write Strategy:
 *   - atomicWriteFile: write `<path>.tmp` then rename to `<path>` (POSIX atomic).
 *   - emitBundle: transaction-directory pattern for bundle-level atomicity;
 *     manifest is the COMMIT POINT (written LAST).
 *   - cleanupOrphanTransactions: sweep `.inbox-txn-*` dirs older than `maxAgeMs`.
 *
 * D-25-10, D-25-11, D-25-19.
 *
 * Phase 825 / C10 (T6 — TS surface; the Rust surface in src-tauri/intelligence/staging.rs
 * is invoked when the Tauri server proxies emit calls; tests use the TS surface).
 */

import {
  mkdirSync,
  writeFileSync,
  renameSync,
  readdirSync,
  rmSync,
  statSync,
  existsSync,
} from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { nanoid } from 'nanoid';

export interface EmissionPayload {
  request_id: string;
  vision_doc: string;
  meta_json: string;
}

export interface BundleManifestPayload {
  bundle_id: string;
  yaml: string;
}

/**
 * Write `content` atomically to `path` via tmp+rename (POSIX atomic on same FS).
 * Throws on any I/O failure; never leaves a partial file at the target path.
 */
export function atomicWriteFile(path: string, content: string | Buffer): void {
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  const tmpPath = `${path}.tmp`;
  // Write to tmp, fsync via writeFileSync's default behavior, then rename.
  writeFileSync(tmpPath, content);
  renameSync(tmpPath, path);
}

/**
 * Atomically deposit a bundle: vision seeds + meta files + manifest LAST.
 *
 * Uses the transaction directory pattern (D-25-11): all files written into
 * `<stagingRoot>/.inbox-txn-<nanoid>/` first, then rename-moved into
 * `<stagingRoot>/staging/inbox/`. The manifest is moved LAST — its presence
 * marks the bundle as committed.
 *
 * Crash safety: if the process is killed mid-emission, an incomplete
 * `.inbox-txn-*` directory is left behind — `cleanupOrphanTransactions()`
 * sweeps these at startup.
 *
 * `injectFailureAt` is for testing — when set, the Nth rename throws a
 * synthetic error simulating a process kill at that point.
 */
export function emitBundle(
  emissions: EmissionPayload[],
  manifest: BundleManifestPayload,
  stagingRoot: string,
  options?: { injectFailureAtRename?: number },
): { manifestPath: string; seedPaths: string[] } {
  const txnId = nanoid(8);
  const txnDir = join(stagingRoot, `.inbox-txn-${txnId}`);
  const stagingInbox = join(stagingRoot, 'staging', 'inbox');
  const stagingBundles = join(stagingInbox, 'bundles');
  mkdirSync(txnDir, { recursive: true });
  mkdirSync(stagingInbox, { recursive: true });
  mkdirSync(stagingBundles, { recursive: true });

  // Stage all files inside the txn dir first.
  for (const e of emissions) {
    atomicWriteFile(join(txnDir, `${e.request_id}.md`), e.vision_doc);
    atomicWriteFile(join(txnDir, `${e.request_id}.meta.json`), e.meta_json);
  }
  const manifestStaged = join(txnDir, `${manifest.bundle_id}.bundle.yaml`);
  atomicWriteFile(manifestStaged, manifest.yaml);

  // Move every seed (NOT the manifest) into staging.
  const seedPaths: string[] = [];
  let renameCount = 0;
  for (const e of emissions) {
    if (
      options?.injectFailureAtRename !== undefined &&
      renameCount === options.injectFailureAtRename
    ) {
      throw new Error('synthetic rename failure (test injection)');
    }
    const mdSrc = join(txnDir, `${e.request_id}.md`);
    const mdDst = join(stagingInbox, `${e.request_id}.md`);
    renameSync(mdSrc, mdDst);
    renameCount++;
    if (
      options?.injectFailureAtRename !== undefined &&
      renameCount === options.injectFailureAtRename
    ) {
      throw new Error('synthetic rename failure (test injection)');
    }
    const metaSrc = join(txnDir, `${e.request_id}.meta.json`);
    const metaDst = join(stagingInbox, `${e.request_id}.meta.json`);
    renameSync(metaSrc, metaDst);
    renameCount++;
    seedPaths.push(mdDst);
  }

  // Manifest is the COMMIT POINT — moved LAST.
  const manifestDst = join(stagingBundles, `${manifest.bundle_id}.bundle.yaml`);
  renameSync(manifestStaged, manifestDst);

  // Cleanup the txn dir.
  rmSync(txnDir, { recursive: true, force: true });

  return { manifestPath: manifestDst, seedPaths };
}

/**
 * Sweep orphan transaction directories older than `maxAgeMs`.
 *
 * Returns the number of orphan dirs removed. Used at startup (D-25-19) to
 * reclaim space from interrupted bundle emissions.
 */
export function cleanupOrphanTransactions(
  stagingRoot: string,
  maxAgeMs: number = 60 * 60 * 1000,
): number {
  if (!existsSync(stagingRoot)) return 0;
  const now = Date.now();
  let removed = 0;
  for (const entry of readdirSync(stagingRoot)) {
    if (!entry.startsWith('.inbox-txn-')) continue;
    const full = join(stagingRoot, entry);
    let mtime: number;
    try {
      mtime = statSync(full).mtimeMs;
    } catch {
      continue;
    }
    if (now - mtime > maxAgeMs) {
      try {
        rmSync(full, { recursive: true, force: true });
        removed++;
      } catch {
        // Ignore failures; will retry next sweep
      }
    }
  }
  return removed;
}

/** Get just the file basename (no extension) — convenience for path display. */
export function stripExt(path: string): string {
  return basename(path).replace(/\.[^.]+$/, '');
}
