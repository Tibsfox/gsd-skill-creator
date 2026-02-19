/**
 * Install tracking for Aminet packages.
 *
 * Records per-package file manifests for clean uninstall. Uses atomic
 * write-then-rename to prevent corrupt manifests on crash.
 *
 * @module
 */

import type { InstallManifest, InstalledFile, Dependency } from './types.js';

/**
 * Record a package installation by writing a manifest JSON file.
 */
export function recordInstall(
  _fullPath: string,
  _files: InstalledFile[],
  _dependencies: Dependency[],
  _installPath: string,
  _manifestDir: string,
): InstallManifest {
  throw new Error('Not implemented');
}

/**
 * Load an install manifest for a specific package.
 */
export function loadInstallManifest(
  _fullPath: string,
  _manifestDir: string,
): InstallManifest | null {
  throw new Error('Not implemented');
}

/**
 * List all installed packages by reading manifest directory.
 */
export function listInstalled(_manifestDir: string): InstallManifest[] {
  throw new Error('Not implemented');
}

/**
 * Uninstall a package by removing tracked files and manifest.
 */
export function uninstallPackage(
  _fullPath: string,
  _manifestDir: string,
): number {
  throw new Error('Not implemented');
}
