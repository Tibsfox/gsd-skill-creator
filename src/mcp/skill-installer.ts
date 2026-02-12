/**
 * Skill installer -- unpacks .tar.gz skill packages from local files or
 * remote URLs into the correct .claude/skills/ directory structure.
 *
 * Includes format version checking, path traversal protection, download
 * size limits, and content safety validation (strict for remote, standard for local).
 */

import type { SkillPackageManifest } from './skill-packager.js';

/**
 * Result of a skill installation attempt.
 */
export interface InstallResult {
  success: boolean;
  skillName: string;
  installedPath?: string;
  error?: string;
  warnings: string[];
}

/**
 * Options for skill installation.
 */
export interface InstallOptions {
  /** Maximum download size in bytes. Default 10MB */
  maxDownloadBytes?: number;
}

/**
 * Install a skill from a local .tar.gz file or remote URL.
 *
 * @param source - Local file path or remote URL (http:// or https://)
 * @param targetDir - Directory where the skill will be installed
 * @param options - Installation options
 * @returns Installation result
 */
export async function installSkill(
  source: string,
  targetDir: string,
  options?: InstallOptions,
): Promise<InstallResult> {
  throw new Error('Not implemented');
}
