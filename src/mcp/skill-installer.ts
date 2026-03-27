/**
 * Skill installer -- unpacks .tar.gz skill packages from local files or
 * remote URLs into the correct .claude/skills/ directory structure.
 *
 * Includes format version checking, path traversal protection, download
 * size limits, and content safety validation (strict for remote, standard for local).
 */

import { mkdtemp, readFile, readdir, cp, rm, writeFile as writeFileFn } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import matter from 'gray-matter';
import { unpackTar } from 'modern-tar/fs';
import { validateContentSafety } from './content-validator.js';
import type { SkillPackageManifest } from './skill-packager.js';
import { safeParseFrontmatter } from '../validation/yaml-safety.js';
import { SkillMetadataSchema } from '../validation/skill-validation.js';

/** Default maximum download size: 10 MB */
const DEFAULT_MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

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
  const isRemote =
    source.startsWith('http://') || source.startsWith('https://');

  if (isRemote) {
    return installFromRemote(source, targetDir, options);
  }
  return installFromLocal(source, targetDir);
}

// ── Local file install ────────────────────────────────────────────────

/**
 * Install a skill from a local .tar.gz file.
 * Uses standard (non-strict) content safety validation.
 */
async function installFromLocal(
  archivePath: string,
  targetDir: string,
): Promise<InstallResult> {
  const tempDir = await mkdtemp(join(tmpdir(), 'skill-install-'));

  try {
    // 1. Extract archive to temp directory
    await extractArchive(archivePath, tempDir);

    // 2. Validate extracted contents
    return await validateAndInstall(tempDir, targetDir, false);
  } catch (err) {
    return {
      success: false,
      skillName: 'unknown',
      error: err instanceof Error ? err.message : String(err),
      warnings: [],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Remote URL install ──────────────────────────────────────────────

/**
 * Install a skill from a remote URL.
 * Downloads with size limits and uses strict content safety validation.
 */
async function installFromRemote(
  url: string,
  targetDir: string,
  options?: InstallOptions,
): Promise<InstallResult> {
  const maxBytes = options?.maxDownloadBytes ?? DEFAULT_MAX_DOWNLOAD_BYTES;
  const tempDir = await mkdtemp(join(tmpdir(), 'skill-install-'));
  const downloadPath = join(tempDir, 'download.tar.gz');

  try {
    // 1. Download with size limit
    const response = await fetch(url);

    // Check Content-Length header first
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return {
        success: false,
        skillName: 'unknown',
        error: `Download size ${parseInt(contentLength, 10)} bytes exceeds limit of ${maxBytes} bytes`,
        warnings: [],
      };
    }

    // Stream body with byte counter
    if (!response.body) {
      return {
        success: false,
        skillName: 'unknown',
        error: 'No response body received',
        warnings: [],
      };
    }

    // Read response body in chunks with size limit enforcement
    const chunks: Buffer[] = [];
    let bytesReceived = 0;
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = Buffer.from(value);
        bytesReceived += chunk.length;

        if (bytesReceived > maxBytes) {
          return {
            success: false,
            skillName: 'unknown',
            error: `Download size exceeds limit of ${maxBytes} bytes during streaming`,
            warnings: [],
          };
        }

        chunks.push(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    // Write downloaded content to temp file
    await writeFileFn(downloadPath, Buffer.concat(chunks));

    // 2. Extract to temp extraction directory
    const extractDir = join(tempDir, 'extracted');
    await extractArchive(downloadPath, extractDir);

    // 3. Validate and install with strict validation
    return await validateAndInstall(extractDir, targetDir, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/size.*limit|limit.*bytes|exceeds/i.test(message)) {
      return {
        success: false,
        skillName: 'unknown',
        error: message,
        warnings: [],
      };
    }
    return {
      success: false,
      skillName: 'unknown',
      error: message,
      warnings: [],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

// ── Shared validation and install ───────────────────────────────────

/**
 * Extract a .tar.gz archive to a target directory.
 */
async function extractArchive(
  archivePath: string,
  targetDir: string,
): Promise<void> {
  const extractStream = unpackTar(targetDir, {
    maxDepth: 10,
  });

  await pipeline(
    createReadStream(archivePath),
    createGunzip(),
    extractStream,
  );
}

/**
 * Validate extracted archive contents and install to target.
 *
 * @param extractDir - Directory containing extracted archive contents
 * @param targetDir - Final installation target
 * @param strict - Whether to use strict content safety validation
 */
async function validateAndInstall(
  extractDir: string,
  targetDir: string,
  strict: boolean,
): Promise<InstallResult> {
  // 1. Find and parse manifest.json
  const manifestPath = join(extractDir, 'manifest.json');
  let manifest: SkillPackageManifest;
  try {
    const manifestRaw = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestRaw);
  } catch {
    return {
      success: false,
      skillName: 'unknown',
      error: 'Missing or invalid manifest.json in archive',
      warnings: [],
    };
  }

  // 2. Check format version
  if (manifest.formatVersion !== 1) {
    return {
      success: false,
      skillName: manifest.name ?? 'unknown',
      error: `Unsupported format version: ${manifest.formatVersion}. Only format version 1 is supported.`,
      warnings: [],
    };
  }

  const skillName = manifest.name;

  // 3. Path traversal validation on manifest file list
  for (const filePath of manifest.files) {
    if (filePath === 'manifest.json') continue;

    // Reject absolute paths
    if (filePath.startsWith('/')) {
      return {
        success: false,
        skillName,
        error: `Path traversal detected: absolute path "${filePath}" in archive`,
        warnings: [],
      };
    }

    // Reject .. segments
    const segments = filePath.split('/');
    if (segments.some((s) => s === '..')) {
      return {
        success: false,
        skillName,
        error: `Path traversal detected: ".." segment in path "${filePath}"`,
        warnings: [],
      };
    }

    // Verify resolved path stays within extract directory
    const resolvedPath = resolve(extractDir, filePath);
    const resolvedExtract = resolve(extractDir);
    if (
      !resolvedPath.startsWith(resolvedExtract + sep) &&
      resolvedPath !== resolvedExtract
    ) {
      return {
        success: false,
        skillName,
        error: `Path traversal detected: "${filePath}" resolves outside extraction directory`,
        warnings: [],
      };
    }
  }

  // 4. Additionally validate actual extracted files on disk
  const extractedPaths = await enumerateExtractedFiles(extractDir);
  const resolvedExtractDir = resolve(extractDir);
  for (const extractedPath of extractedPaths) {
    const fullPath = resolve(extractDir, extractedPath);
    if (
      !fullPath.startsWith(resolvedExtractDir + sep) &&
      fullPath !== resolvedExtractDir
    ) {
      return {
        success: false,
        skillName,
        error: `Path traversal detected: extracted file "${extractedPath}" resolves outside extraction directory`,
        warnings: [],
      };
    }
  }

  // 5. Read SKILL.md for content safety validation
  const skillMdPath = join(extractDir, skillName, 'SKILL.md');
  let skillMdContent: string;
  try {
    skillMdContent = await readFile(skillMdPath, 'utf-8');
  } catch {
    return {
      success: false,
      skillName,
      error: `Missing ${skillName}/SKILL.md in archive`,
      warnings: [],
    };
  }

  // 5b. Safe YAML parsing + Zod validation
  const parseResult = safeParseFrontmatter(skillMdContent);
  if (!parseResult.success) {
    return {
      success: false,
      skillName,
      error: `Invalid skill file: ${parseResult.error}`,
      warnings: [],
    };
  }

  let metadata: Record<string, unknown>;
  try {
    metadata = SkillMetadataSchema.parse(parseResult.data) as Record<string, unknown>;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      skillName,
      error: `Invalid skill metadata: ${message}`,
      warnings: [],
    };
  }
  const body = parseResult.body;

  // 6. Run content safety validation
  const safetyResult = validateContentSafety(
    body,
    metadata,
    { strict },
  );

  if (!safetyResult.safe) {
    return {
      success: false,
      skillName,
      error: safetyResult.errors.join('; '),
      warnings: safetyResult.warnings,
    };
  }

  // 7. Copy skill directory to target
  const sourcePath = join(extractDir, skillName);
  const installedPath = join(targetDir, skillName);
  await cp(sourcePath, installedPath, { recursive: true });

  return {
    success: true,
    skillName,
    installedPath,
    warnings: safetyResult.warnings,
  };
}

/**
 * Recursively enumerate all file paths relative to baseDir.
 */
async function enumerateExtractedFiles(
  dir: string,
  baseDir?: string,
): Promise<string[]> {
  const base = baseDir ?? dir;
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await enumerateExtractedFiles(fullPath, base);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(relative(base, fullPath));
    }
  }

  return files;
}
