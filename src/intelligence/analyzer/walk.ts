/**
 * C01 — File walker.
 *
 * walkProject: recursive descent, respects .gitignore, .gsdignore, and built-in defaults.
 * isBinary: heuristic binary detection by reading first 8 KiB (D-22-08).
 * Symlink-loop protection via visited-inodes Set (D-22-09).
 */

import { readdir, readFile, stat, realpath } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import ignore from 'ignore';

// ─── Built-in exclusion defaults ────────────────────────

const BUILT_IN_IGNORE = [
  'node_modules',
  'target',
  'dist',
  '.git',
  '.venv',
  '__pycache__',
  '*.lock',
  '.*',       // dotfiles (plan T2: "all dotfiles starting with `.`")
];

export interface WalkOptions {
  excludePatterns?: string[];
  includePatterns?: string[];
}

/**
 * Walk the project root directory, respecting:
 * - .gitignore (via `ignore` package)
 * - .gsdignore (custom)
 * - built-in defaults (BUILT_IN_IGNORE)
 * - caller-supplied excludePatterns
 * - symlink-loop protection
 *
 * Returns absolute paths of all candidate source files.
 */
export async function walkProject(root: string, opts: WalkOptions): Promise<string[]> {
  // Build the ignore matcher
  const ig = ignore();

  // Add built-in defaults
  ig.add(BUILT_IN_IGNORE);

  // Load .gitignore if present
  const gitignorePath = join(root, '.gitignore');
  if (existsSync(gitignorePath)) {
    try {
      const content = await readFile(gitignorePath, 'utf-8');
      ig.add(content);
    } catch {
      // non-critical: ignore read failure
    }
  }

  // Load .gsdignore if present
  const gsdignorePath = join(root, '.gsdignore');
  if (existsSync(gsdignorePath)) {
    try {
      const content = await readFile(gsdignorePath, 'utf-8');
      ig.add(content);
    } catch {
      // non-critical
    }
  }

  // Add caller-supplied exclude patterns
  if (opts.excludePatterns && opts.excludePatterns.length > 0) {
    ig.add(opts.excludePatterns);
  }

  // Track visited real paths to prevent symlink loops
  const visitedInodes = new Set<string>();

  const results: string[] = [];
  await walkDir(root, root, ig, visitedInodes, results);
  return results;
}

async function walkDir(
  root: string,
  dir: string,
  ig: ReturnType<typeof ignore>,
  visitedInodes: Set<string>,
  results: string[],
): Promise<void> {
  // Resolve real path for symlink-loop detection
  let realDir: string;
  try {
    realDir = await realpath(dir);
  } catch {
    return; // can't resolve — skip
  }

  if (visitedInodes.has(realDir)) {
    return; // loop detected — stop recursion
  }
  visitedInodes.add(realDir);

  let entries: Dirent[];
  try {
    entries = await readdir(dir, { withFileTypes: true }) as Dirent[];
  } catch {
    return; // unreadable directory — skip
  }

  for (const entry of entries) {
    const entryName = String(entry.name);
    const absPath = join(dir, entryName);
    const relPath = relative(root, absPath);

    // Check against ignore rules (ignore package uses relative paths)
    if (ig.ignores(relPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDir(root, absPath, ig, visitedInodes, results);
    } else if (entry.isFile()) {
      // Skip files > 1 MiB (D-22-08 companion: very large files are likely generated/minified)
      try {
        const info = await stat(absPath);
        if (info.size > 1024 * 1024) {
          continue; // omitted with size reason
        }
      } catch {
        continue;
      }
      results.push(absPath);
    } else if (entry.isSymbolicLink()) {
      // For symlinks, resolve and recurse (symlink loop is caught by visitedInodes)
      try {
        const resolved = await realpath(absPath);
        const resolvedStat = await stat(resolved);
        if (resolvedStat.isDirectory()) {
          await walkDir(root, absPath, ig, visitedInodes, results);
        } else if (resolvedStat.isFile() && resolvedStat.size <= 1024 * 1024) {
          results.push(absPath);
        }
      } catch {
        continue; // dangling symlink or permission error — skip
      }
    }
  }
}

// ─── Binary detection (D-22-08) ─────────────────────────

const BINARY_CHECK_SIZE = 8 * 1024; // 8 KiB
const BINARY_THRESHOLD = 0.3;

/**
 * Returns true if the file appears to be binary.
 * Heuristic: read first 8 KiB, count bytes that are null or > 127 (non-UTF-8 high bytes).
 * If ratio > 0.3, the file is considered binary.
 *
 * Empty files → false (boundary: no evidence of binary content).
 */
export async function isBinary(filePath: string): Promise<boolean> {
  let buffer: Buffer;
  try {
    const { open } = await import('node:fs/promises');
    const handle = await open(filePath, 'r');
    try {
      const buf = Buffer.alloc(BINARY_CHECK_SIZE);
      const { bytesRead } = await handle.read(buf, 0, BINARY_CHECK_SIZE, 0);
      buffer = buf.slice(0, bytesRead);
    } finally {
      await handle.close();
    }
  } catch {
    return false; // can't read — assume text for safety
  }

  if (buffer.length === 0) {
    return false; // empty file is not binary
  }

  let nonUtf8Count = 0;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i]!;
    if (byte === 0 || byte > 127) {
      nonUtf8Count++;
    }
  }

  return nonUtf8Count / buffer.length > BINARY_THRESHOLD;
}
