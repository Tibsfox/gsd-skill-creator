import { join } from 'path';

/* ------------------------------------------------------------------ */
/*  Injectable dependency types                                        */
/* ------------------------------------------------------------------ */

/** Read file contents */
export type ReadFileFn = (path: string) => Promise<string>;

/** Write file contents (overwrite) */
export type WriteFileFn = (path: string, content: string) => Promise<void>;

/** Append content to file */
export type AppendFileFn = (path: string, content: string) => Promise<void>;

/** Copy file from source to destination */
export type CopyFileFn = (src: string, dest: string) => Promise<void>;

/** Create directory (recursive) */
export type MkdirFn = (path: string) => Promise<void>;

/** Check if file exists */
export type ExistsFn = (path: string) => Promise<boolean>;

/** All injectable dependencies for persistence operations */
export interface PersistenceDeps {
  readFile: ReadFileFn;
  writeFile: WriteFileFn;
  appendFile: AppendFileFn;
  copyFile: CopyFileFn;
  mkdir: MkdirFn;
  exists: ExistsFn;
}

/* ------------------------------------------------------------------ */
/*  JSONL append-only log                                              */
/* ------------------------------------------------------------------ */

/**
 * Append a single entry to a JSONL log file.
 * Each entry is serialized as one JSON object per line, newline-delimited.
 * The log is append-only — existing entries are never modified (SC-08).
 */
export async function appendLog<T>(
  logPath: string,
  entry: T,
  deps: Pick<PersistenceDeps, 'appendFile' | 'mkdir'>,
): Promise<void> {
  const line = JSON.stringify(entry) + '\n';
  await deps.appendFile(logPath, line);
}

/**
 * Read all entries from a JSONL log file.
 * Malformed lines are silently skipped (defensive parsing).
 * Returns empty array for missing or empty files.
 */
export async function readLog<T>(
  logPath: string,
  deps: Pick<PersistenceDeps, 'readFile' | 'exists'>,
): Promise<T[]> {
  const fileExists = await deps.exists(logPath);
  if (!fileExists) return [];

  const raw = await deps.readFile(logPath);
  if (raw.trim().length === 0) return [];

  const lines = raw.split('\n');
  const entries: T[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    try {
      entries.push(JSON.parse(trimmed) as T);
    } catch {
      // Skip malformed lines — defensive parsing
    }
  }

  return entries;
}

/* ------------------------------------------------------------------ */
/*  Content cache                                                      */
/* ------------------------------------------------------------------ */

/**
 * Write content to the cache at a channel/slot path.
 * Directory structure: {cacheDir}/{channel}/{slot}
 */
export async function writeCache(
  cacheDir: string,
  channel: string,
  slot: string,
  content: string,
  deps: Pick<PersistenceDeps, 'writeFile' | 'mkdir'>,
): Promise<void> {
  const dir = join(cacheDir, channel);
  await deps.mkdir(dir);
  const filePath = join(dir, slot);
  await deps.writeFile(filePath, content);
}

/**
 * Read cached content for a channel/slot.
 * Returns null if the cache file does not exist (no crash).
 */
export async function readCache(
  cacheDir: string,
  channel: string,
  slot: string,
  deps: Pick<PersistenceDeps, 'readFile' | 'exists'>,
): Promise<string | null> {
  const filePath = join(cacheDir, channel, slot);
  const fileExists = await deps.exists(filePath);
  if (!fileExists) return null;

  return deps.readFile(filePath);
}

/* ------------------------------------------------------------------ */
/*  Rollback                                                           */
/* ------------------------------------------------------------------ */

/**
 * Create a rollback backup of a file.
 * Copies the file to the rollback directory with a timestamped name.
 * Returns the backup file path.
 */
export async function createRollbackBackup(
  filePath: string,
  rollbackDir: string,
  deps: Pick<PersistenceDeps, 'copyFile' | 'mkdir'>,
): Promise<string> {
  await deps.mkdir(rollbackDir);
  const timestamp = Date.now();
  const basename = filePath.replace(/[/\\]/g, '_');
  const backupPath = join(rollbackDir, `${timestamp}-${basename}`);
  await deps.copyFile(filePath, backupPath);
  return backupPath;
}

/**
 * Restore content from a backup file to the target path.
 */
export async function restoreFromBackup(
  backupPath: string,
  targetPath: string,
  deps: Pick<PersistenceDeps, 'readFile' | 'writeFile'>,
): Promise<void> {
  const content = await deps.readFile(backupPath);
  await deps.writeFile(targetPath, content);
}
