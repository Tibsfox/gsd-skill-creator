/**
 * Install tracking for Aminet packages.
 *
 * Records per-package file manifests for clean uninstall. Uses atomic
 * write-then-rename to prevent corrupt manifests on crash.
 *
 * @module
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

import { InstallManifestSchema } from './types.js';
import type { InstallManifest, InstalledFile, Dependency } from './types.js';

/**
 * Convert an Aminet fullPath to a manifest filename.
 *
 * Replaces `/` with `_`, strips `.lha` suffix, appends `.json`.
 * Example: "mus/edit/ProTracker36.lha" -> "mus_edit_ProTracker36.json"
 *
 * @param fullPath - Aminet full path
 * @returns Slugified manifest filename
 */
function slugifyPath(fullPath: string): string {
  return fullPath.replace(/\//g, '_').replace(/\.lha$/, '') + '.json';
}

/**
 * Record a package installation by writing a manifest JSON file.
 *
 * Uses atomic write-then-rename: writes to a temp file first, then
 * renames over the target to prevent corruption on crash.
 *
 * @param fullPath - Aminet full path (e.g., "mus/edit/ProTracker36.lha")
 * @param files - Array of installed files with source/dest/sha256
 * @param dependencies - Detected dependencies from .readme
 * @param installPath - Root install path used
 * @param manifestDir - Directory for storing manifest files
 * @returns The validated InstallManifest
 */
export function recordInstall(
  fullPath: string,
  files: InstalledFile[],
  dependencies: Dependency[],
  installPath: string,
  manifestDir: string,
): InstallManifest {
  const manifest: InstallManifest = {
    fullPath,
    installedAt: new Date().toISOString(),
    files,
    dependencies,
    installPath,
  };

  // Validate against schema
  InstallManifestSchema.parse(manifest);

  // Ensure manifest directory exists
  mkdirSync(manifestDir, { recursive: true });

  // Atomic write-then-rename
  const tmpPath = join(manifestDir, '.' + randomUUID() + '.tmp');
  const destPath = join(manifestDir, slugifyPath(fullPath));
  writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), 'utf-8');
  renameSync(tmpPath, destPath);

  return manifest;
}

/**
 * Load an install manifest for a specific package.
 *
 * @param fullPath - Aminet full path to look up
 * @param manifestDir - Directory containing manifest files
 * @returns Parsed InstallManifest, or null if not found
 * @throws On corrupt JSON or schema validation failure
 */
export function loadInstallManifest(
  fullPath: string,
  manifestDir: string,
): InstallManifest | null {
  const filePath = join(manifestDir, slugifyPath(fullPath));

  if (!existsSync(filePath)) {
    return null;
  }

  const raw = readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  return InstallManifestSchema.parse(parsed);
}

/**
 * List all installed packages by reading manifest directory.
 *
 * Reads all `.json` files in the manifest directory and returns
 * parsed InstallManifest objects.
 *
 * @param manifestDir - Directory containing manifest files
 * @returns Array of all installed package manifests
 */
export function listInstalled(manifestDir: string): InstallManifest[] {
  if (!existsSync(manifestDir)) {
    return [];
  }

  const files = readdirSync(manifestDir).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    const raw = readFileSync(join(manifestDir, f), 'utf-8');
    return InstallManifestSchema.parse(JSON.parse(raw));
  });
}

/**
 * Uninstall a package by removing tracked files and the manifest.
 *
 * Removes each tracked file from disk (skipping already-missing files),
 * attempts to clean up empty parent directories, then deletes the
 * manifest file itself.
 *
 * @param fullPath - Aminet full path of the package to uninstall
 * @param manifestDir - Directory containing manifest files
 * @returns Number of files actually removed from disk
 */
export function uninstallPackage(
  fullPath: string,
  manifestDir: string,
): number {
  const manifest = loadInstallManifest(fullPath, manifestDir);
  if (manifest === null) {
    return 0;
  }

  let removed = 0;

  for (const file of manifest.files) {
    if (existsSync(file.destPath)) {
      unlinkSync(file.destPath);
      removed++;

      // Try cleaning up empty parent directories
      let dir = dirname(file.destPath);
      while (dir.length > 1) {
        try {
          // rmdirSync only succeeds on empty directories
          rmdirSync(dir);
          dir = dirname(dir);
        } catch {
          // Directory not empty or other error -- stop climbing
          break;
        }
      }
    }
  }

  // Delete the manifest file
  const manifestPath = join(manifestDir, slugifyPath(fullPath));
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath);
  }

  return removed;
}
