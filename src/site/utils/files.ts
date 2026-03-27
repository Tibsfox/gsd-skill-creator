import { readFile as fsReadFile, writeFile as fsWriteFile, readdir, stat as fsStat, mkdir, cp } from 'node:fs/promises';
import { join, relative } from 'node:path';

/** Signature for a directory listing function (injectable for testing). */
export type ReadDirFn = (dir: string) => Promise<string[]>;

/** Signature for a stat function (injectable for testing). */
export type StatFn = (path: string) => Promise<{ isDirectory(): boolean }>;

/**
 * Recursively walk a directory for `.md` files.
 *
 * - Ignores directories whose name starts with `_`
 * - Returns paths relative to `dir`, sorted alphabetically
 * - `readDir` and `stat` are injectable for testing
 */
export async function walkMarkdownFiles(
  dir: string,
  readDir: ReadDirFn = defaultReadDir,
  stat: StatFn = defaultStat,
): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string, prefix: string): Promise<void> {
    const entries = await readDir(current);

    for (const entry of entries) {
      // Skip underscore-prefixed directories
      if (entry.startsWith('_')) {
        const info = await stat(join(current, entry));
        if (info.isDirectory()) continue;
      }

      const fullPath = join(current, entry);
      const info = await stat(fullPath);

      if (info.isDirectory()) {
        if (!entry.startsWith('_')) {
          await walk(fullPath, prefix ? `${prefix}/${entry}` : entry);
        }
      } else if (entry.endsWith('.md')) {
        results.push(prefix ? `${prefix}/${entry}` : entry);
      }
    }
  }

  await walk(dir, '');
  return results.sort();
}

/** File operations interface (all injectable). */
export interface FileOps {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  ensureDir(path: string): Promise<void>;
  copyDir(src: string, dest: string): Promise<void>;
}

/** Injectable file operations config. */
export interface FileOpsConfig {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  ensureDir: (path: string) => Promise<void>;
  copyDir: (src: string, dest: string) => Promise<void>;
}

/**
 * Create a FileOps object from injectable implementations.
 * Defaults use real Node.js fs operations.
 */
export function createFileOps(config?: Partial<FileOpsConfig>): FileOps {
  return {
    readFile: config?.readFile ?? defaultReadFile,
    writeFile: config?.writeFile ?? defaultWriteFile,
    ensureDir: config?.ensureDir ?? defaultEnsureDir,
    copyDir: config?.copyDir ?? defaultCopyDir,
  };
}

/* ---- Default implementations using real fs ---- */

async function defaultReadDir(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries;
}

async function defaultStat(
  path: string,
): Promise<{ isDirectory(): boolean }> {
  const s = await fsStat(path);
  return { isDirectory: () => s.isDirectory() };
}

async function defaultReadFile(path: string): Promise<string> {
  return fsReadFile(path, 'utf-8');
}

async function defaultWriteFile(
  path: string,
  content: string,
): Promise<void> {
  await fsWriteFile(path, content, 'utf-8');
}

async function defaultEnsureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function defaultCopyDir(src: string, dest: string): Promise<void> {
  await cp(src, dest, { recursive: true });
}
