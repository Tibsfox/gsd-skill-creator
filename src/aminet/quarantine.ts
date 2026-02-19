/**
 * Quarantine system for infected Aminet files.
 *
 * Isolates infected files by moving them to a `.quarantine/` directory
 * with JSON metadata sidecars. Supports listing quarantined entries
 * and restoring files to their original locations.
 *
 * Security: Path traversal is rejected before any file operation.
 * Reliability: Metadata sidecars use atomic write-then-rename (follows
 * the mirror-state.ts pattern).
 *
 * @module
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, relative, sep } from 'node:path';

import { QuarantineEntrySchema } from './types.js';
import type { QuarantineEntry, ScanReport } from './types.js';

/**
 * Recursively find all `.meta.json` files in a directory tree.
 *
 * @param dir - Root directory to walk
 * @returns Array of absolute paths to `.meta.json` files
 */
function findMetaFiles(dir: string): string[] {
  const results: string[] = [];

  if (!existsSync(dir)) {
    return results;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findMetaFiles(fullPath));
    } else if (entry.name.endsWith('.meta.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Validate that a file path does not contain path traversal components
 * and resolves within the expected quarantine directory.
 *
 * @param filePath - The path to validate
 * @param quarantineDir - The quarantine root that the path must stay within
 * @param relativePath - The computed relative path to check for `..` segments
 * @throws Error if path traversal is detected
 */
function validateNoTraversal(
  filePath: string,
  quarantineDir: string,
  relativePath: string,
): void {
  // Reject any path with .. components
  const segments = relativePath.split(sep);
  if (segments.includes('..')) {
    throw new Error(`Path traversal detected in path: ${filePath}`);
  }

  // Reject if the resolved destination would escape the quarantine directory
  const destPath = resolve(quarantineDir, relativePath);
  const resolvedQuarantine = resolve(quarantineDir);
  if (!destPath.startsWith(resolvedQuarantine + sep) && destPath !== resolvedQuarantine) {
    throw new Error(`Path traversal detected: destination escapes quarantine directory`);
  }
}

/**
 * Move an infected file to quarantine with metadata sidecar.
 *
 * The file is moved from its original location to the quarantine directory,
 * preserving the relative directory structure. A JSON sidecar file is
 * written atomically alongside the quarantined file containing the full
 * scan report, original path, SHA-256 hash, and timestamp.
 *
 * @param filePath - Absolute path to the file to quarantine
 * @param scanReport - The scan report that triggered quarantine
 * @param quarantineDir - Root directory for quarantined files
 * @returns QuarantineEntry with metadata
 * @throws Error on path traversal, missing file, or filesystem error
 */
export function quarantineFile(
  filePath: string,
  scanReport: ScanReport,
  quarantineDir: string,
): QuarantineEntry {
  // Path traversal check on raw input BEFORE any filesystem operations
  // Reject any path containing ".." segments (even if Node resolves them)
  const rawSegments = filePath.split(sep);
  if (rawSegments.includes('..')) {
    throw new Error(`Path traversal detected in path: ${filePath}`);
  }

  // Validate source file exists
  if (!existsSync(filePath)) {
    throw new Error(`Source file does not exist: ${filePath}`);
  }
  statSync(filePath); // Throws if not accessible

  // Compute relative path: from the quarantine parent to the file
  const quarantineParent = dirname(quarantineDir);
  const relativePath = relative(quarantineParent, filePath);

  // Additional traversal check on computed relative path
  validateNoTraversal(filePath, quarantineDir, relativePath);

  // Compute SHA-256 of original file content before moving
  const fileContent = readFileSync(filePath);
  const sha256 = createHash('sha256').update(fileContent).digest('hex');

  // Compute destination path within quarantine
  // Strip the quarantine directory name from the relative path
  // e.g., relative from /tmp/x to /tmp/x/mirror/mus/edit/File.lha = "mirror/mus/edit/File.lha"
  // We want the path relative to the quarantine's sibling (the mirror directory)
  // Use the relative path structure from the parent of quarantineDir
  const quarantineDirName = quarantineDir.split(sep).pop()!;
  const relSegments = relativePath.split(sep);

  // Skip the first segment if it's a sibling directory name (e.g., "mirror")
  // We want to preserve everything after the first directory level
  let preservedPath: string;
  if (relSegments.length > 1) {
    preservedPath = relSegments.slice(1).join(sep);
  } else {
    preservedPath = relSegments[0];
  }

  const destPath = join(quarantineDir, preservedPath);
  const destDir = dirname(destPath);
  const metaPath = `${destPath}.meta.json`;
  const metaTmpPath = `${metaPath}.tmp`;

  // Ensure the destination resolves within quarantine
  const resolvedDest = resolve(destPath);
  const resolvedQuarantine = resolve(quarantineDir);
  if (!resolvedDest.startsWith(resolvedQuarantine + sep)) {
    throw new Error(`Path traversal detected: destination escapes quarantine directory`);
  }

  // Create destination directory
  mkdirSync(destDir, { recursive: true });

  // Build the quarantine entry
  const entry: QuarantineEntry = {
    originalPath: filePath,
    quarantinedAt: new Date().toISOString(),
    scanReport,
    sha256,
  };

  // Move file to quarantine (handle cross-device with fallback)
  try {
    renameSync(filePath, destPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      // Cross-device: copy then unlink
      writeFileSync(destPath, fileContent);
      unlinkSync(filePath);
    } else {
      throw err;
    }
  }

  // Write metadata sidecar atomically: write to .tmp, then rename
  writeFileSync(metaTmpPath, JSON.stringify(entry, null, 2), 'utf-8');
  renameSync(metaTmpPath, metaPath);

  return entry;
}

/**
 * List all quarantined files by reading .meta.json sidecars.
 *
 * Recursively walks the quarantine directory, parses each `.meta.json`
 * file, and returns validated QuarantineEntry objects.
 *
 * @param quarantineDir - Root quarantine directory
 * @returns Array of QuarantineEntry objects
 */
export function listQuarantined(quarantineDir: string): QuarantineEntry[] {
  if (!existsSync(quarantineDir)) {
    return [];
  }

  const metaFiles = findMetaFiles(quarantineDir);
  const entries: QuarantineEntry[] = [];

  for (const metaPath of metaFiles) {
    const raw = readFileSync(metaPath, 'utf-8');
    const parsed = QuarantineEntrySchema.parse(JSON.parse(raw));
    entries.push(parsed);
  }

  return entries;
}

/**
 * Restore a quarantined file to its original location.
 *
 * Finds the quarantined file by matching originalPath in .meta.json
 * sidecars, moves the file back to its original path, creates parent
 * directories if needed, and removes the metadata sidecar.
 *
 * @param quarantineDir - Root quarantine directory
 * @param originalPath - The original path the file was quarantined from
 * @throws Error if the quarantined file or sidecar doesn't exist
 */
export function restoreFile(quarantineDir: string, originalPath: string): void {
  const metaFiles = findMetaFiles(quarantineDir);

  // Find the sidecar that matches the originalPath
  let matchedMetaPath: string | null = null;
  let matchedEntry: QuarantineEntry | null = null;

  for (const metaPath of metaFiles) {
    const raw = readFileSync(metaPath, 'utf-8');
    const parsed = QuarantineEntrySchema.parse(JSON.parse(raw));

    if (parsed.originalPath === originalPath) {
      matchedMetaPath = metaPath;
      matchedEntry = parsed;
      break;
    }
  }

  if (!matchedMetaPath || !matchedEntry) {
    throw new Error(`No quarantine entry found for: ${originalPath}`);
  }

  // The quarantined file path is the meta path without .meta.json
  const quarantinedFilePath = matchedMetaPath.replace(/\.meta\.json$/, '');

  if (!existsSync(quarantinedFilePath)) {
    throw new Error(`Quarantined file missing: ${quarantinedFilePath}`);
  }

  // Create parent directories at the original path if needed
  const originalDir = dirname(originalPath);
  mkdirSync(originalDir, { recursive: true });

  // Move file back to original location (handle cross-device)
  try {
    renameSync(quarantinedFilePath, originalPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
      const content = readFileSync(quarantinedFilePath);
      writeFileSync(originalPath, content);
      unlinkSync(quarantinedFilePath);
    } else {
      throw err;
    }
  }

  // Remove the metadata sidecar
  unlinkSync(matchedMetaPath);
}
