/**
 * Recursive async file walker for the atlas indexer.
 *
 * Honors a built-in skip set (node_modules, .git, dist, target, .next, build,
 * .cache, .vscode, .idea, coverage, __pycache__) and an optional caller
 * filter. Symlink-loop-safe via realpath + visited set. Depth-bounded to
 * guard against pathological repos.
 *
 * Accepts an optional `LoaderContext` (Tier-E security chokepoint, v1.49.782).
 * When provided, the walk `root` must be admitted by `ctx.allowList`. All
 * subsequent fs operations (realpath, readdir, stat) are confined under
 * `root` via path.join + symlink-loop guard, so a single top-of-function
 * `ensureAllowed` gate is sufficient — one audit record per `walkProjectFiles`
 * call. Second LoaderContext chip at v1.49.889 (mirrors v887 hoist-at-top).
 */

import { readdir, realpath, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { ensureAllowed, type LoaderContext } from '../../security/loader-context.js';

const LOADER_SOURCE = 'atlas-indexer/file-walker';

const DEFAULT_SKIP_DIRS: ReadonlySet<string> = new Set([
  'node_modules',
  '.git',
  'dist',
  'target',
  '.next',
  'build',
  '.cache',
  '.vscode',
  '.idea',
  'coverage',
  '__pycache__',
  '.venv',
  '.svelte-kit',
  '.turbo',
]);

export interface WalkOptions {
  /** Caller-supplied predicate. Returning false skips the file. */
  fileFilter?: (relativePath: string) => boolean;
  /** Hard cap on recursion depth. Default 32. */
  maxDepth?: number;
  /** Files larger than this byte size are skipped. Default 1 MiB. */
  maxFileBytes?: number;
  /**
   * Optional security chokepoint (v1.49.889 chip). When provided, the walk
   * `root` must be admitted by `ctx.allowList`. Single gate at top of
   * `walkProjectFiles` covers the recursive walk (all paths under root).
   */
  ctx?: LoaderContext;
}

/**
 * Walk `root` recursively, returning absolute paths of every regular file
 * not skipped. Errors on individual entries are swallowed (best-effort walk;
 * unreadable directories yield no results from that subtree).
 */
export async function walkProjectFiles(
  root: string,
  opts: WalkOptions = {},
): Promise<string[]> {
  // Security chokepoint: gate on root. All recursive fs operations are
  // confined under root via path.join + symlink-loop guard. Hoisted OUTSIDE
  // the try/catch below so LoaderContextDenied propagates per #10442.
  ensureAllowed(opts.ctx, LOADER_SOURCE, 'read-dir', root);

  const maxDepth = opts.maxDepth ?? 32;
  const maxFileBytes = opts.maxFileBytes ?? 1024 * 1024;
  const visited = new Set<string>();
  const results: string[] = [];

  let rootReal: string;
  try {
    rootReal = await realpath(root);
  } catch {
    return results;
  }

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let real: string;
    try {
      real = await realpath(dir);
    } catch {
      return;
    }
    if (visited.has(real)) return;
    visited.add(real);

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = entry.name;
      const abs = join(dir, name);

      if (entry.isDirectory()) {
        if (DEFAULT_SKIP_DIRS.has(name)) continue;
        await walk(abs, depth + 1);
        continue;
      }

      let isFile = entry.isFile();
      if (!isFile && entry.isSymbolicLink()) {
        try {
          const s = await stat(abs);
          if (s.isDirectory()) {
            await walk(abs, depth + 1);
            continue;
          }
          isFile = s.isFile();
        } catch {
          continue;
        }
      }
      if (!isFile) continue;

      try {
        const s = await stat(abs);
        if (s.size > maxFileBytes) continue;
      } catch {
        continue;
      }

      const rel = relative(rootReal, abs);
      if (opts.fileFilter && !opts.fileFilter(rel)) continue;
      results.push(abs);
    }
  }

  await walk(rootReal, 0);
  return results;
}

export const DEFAULT_SKIP_DIR_NAMES: ReadonlySet<string> = DEFAULT_SKIP_DIRS;
