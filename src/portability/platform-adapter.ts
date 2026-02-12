import type { SkillMetadata, Skill } from '../types/skill.js';
import { stripToPortable } from './portable-exporter.js';
import { normalizePaths } from './path-normalizer.js';
import matter from 'gray-matter';
import { readdir, copyFile, mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { safeParseFrontmatter } from '../validation/yaml-safety.js';
import { SkillMetadataSchema } from '../validation/skill-validation.js';

/**
 * Platform configuration for skill storage and export.
 */
export interface PlatformConfig {
  /** Human-readable platform name */
  name: string;
  /** User-level skills directory path (e.g., ~/.claude/skills) */
  userSkillsDir: string;
  /** Project-level skills directory path (e.g., .claude/skills) */
  projectSkillsDir: string;
  /** Whether the platform supports allowed-tools field */
  supportsAllowedTools: boolean;
}

/**
 * Platform registry -- storage paths and capabilities for all 5 supported targets.
 *
 * Paths are sourced from each platform's official documentation:
 * - Claude Code: https://docs.anthropic.com/en/docs/claude-code
 * - Cursor: https://docs.cursor.com/context/rules
 * - Codex CLI: https://github.com/openai/codex
 * - GitHub Copilot: https://docs.github.com/en/copilot
 * - Gemini CLI: https://github.com/google-gemini/gemini-cli
 */
export const PLATFORMS: Record<string, PlatformConfig> = {
  claude: {
    name: 'Claude Code',
    userSkillsDir: '~/.claude/skills',
    projectSkillsDir: '.claude/skills',
    supportsAllowedTools: true,
  },
  cursor: {
    name: 'Cursor',
    userSkillsDir: '~/.cursor/skills',
    projectSkillsDir: '.cursor/skills',
    supportsAllowedTools: true,
  },
  codex: {
    name: 'Codex CLI',
    userSkillsDir: '~/.agents/skills',
    projectSkillsDir: '.agents/skills',
    supportsAllowedTools: true,
  },
  copilot: {
    name: 'GitHub Copilot',
    userSkillsDir: '~/.copilot/skills',
    projectSkillsDir: '.github/skills',
    supportsAllowedTools: true,
  },
  gemini: {
    name: 'Gemini CLI',
    userSkillsDir: '~/.gemini/skills',
    projectSkillsDir: '.gemini/skills',
    supportsAllowedTools: true,
  },
};

/**
 * Get list of all supported platform IDs.
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORMS);
}

/**
 * Export a skill for a specific platform.
 *
 * - Claude target: preserves all Claude Code fields, keeps allowed-tools as array
 * - Non-Claude targets: strips extension fields via stripToPortable(), converts allowed-tools to space-delimited string
 * - All targets: normalizes paths in body content to forward slashes
 *
 * @param skill - Complete skill object (metadata + body)
 * @param platformId - Target platform ID (claude, cursor, codex, copilot, gemini)
 * @returns Complete markdown string with frontmatter + body
 * @throws Error if platformId is not a supported platform
 */
export function exportForPlatform(skill: Skill, platformId: string): string {
  if (!(platformId in PLATFORMS)) {
    throw new Error(
      `Unknown platform: ${platformId}. Supported: ${getSupportedPlatforms().join(', ')}`,
    );
  }

  const normalizedBody = normalizePaths(skill.body);

  if (platformId === 'claude') {
    // Claude target: preserve all fields natively, keep allowed-tools as array
    return buildClaudeExport(skill.metadata, normalizedBody);
  }

  // Non-Claude targets: strip to portable format (converts allowed-tools to string)
  const portable = stripToPortable(skill.metadata);
  return matter.stringify(normalizedBody, portable);
}

/**
 * Build Claude-format export preserving all native fields.
 * Avoids coupling to skill-store's normalizeForWrite by building metadata inline.
 */
function buildClaudeExport(metadata: SkillMetadata, body: string): string {
  // Build metadata with all Claude fields preserved as-is
  const output: Record<string, unknown> = {
    name: metadata.name,
    description: metadata.description,
  };

  // Add all optional Claude fields if defined
  if (metadata['disable-model-invocation'] !== undefined) {
    output['disable-model-invocation'] = metadata['disable-model-invocation'];
  }
  if (metadata['user-invocable'] !== undefined) {
    output['user-invocable'] = metadata['user-invocable'];
  }
  if (metadata['allowed-tools'] !== undefined) {
    // Keep as array for Claude (native format)
    const tools = metadata['allowed-tools'];
    if (typeof tools === 'string') {
      output['allowed-tools'] = tools.trim() === '' ? [] : tools.trim().split(/\s+/);
    } else {
      output['allowed-tools'] = tools;
    }
  }
  if (metadata['argument-hint'] !== undefined) {
    output['argument-hint'] = metadata['argument-hint'];
  }
  if (metadata.model !== undefined) {
    output.model = metadata.model;
  }
  if (metadata.context !== undefined) {
    output.context = metadata.context;
  }
  if (metadata.agent !== undefined) {
    output.agent = metadata.agent;
  }
  if (metadata.hooks !== undefined) {
    output.hooks = metadata.hooks;
  }
  if (metadata.license !== undefined) {
    output.license = metadata.license;
  }
  if (metadata.compatibility !== undefined) {
    output.compatibility = metadata.compatibility;
  }

  // Preserve metadata container (including extensions) for Claude
  if (metadata.metadata) {
    output.metadata = metadata.metadata;
  }

  return matter.stringify(body, output);
}

/**
 * Export an entire skill directory for a specific platform.
 *
 * Reads SKILL.md from sourceDir, transforms it for the target platform,
 * writes it to targetDir. Recursively copies references/ and scripts/
 * subdirectories. Normalizes paths in any .md files within subdirectories.
 *
 * @param sourceDir - Source skill directory containing SKILL.md
 * @param targetDir - Target directory to write exported skill
 * @param platformId - Target platform ID
 * @returns List of all files written (relative paths from targetDir)
 */
export async function exportSkillDirectory(
  sourceDir: string,
  targetDir: string,
  platformId: string,
): Promise<string[]> {
  const copiedFiles: string[] = [];

  // Read and parse SKILL.md from source (safe parsing + Zod validation)
  const skillMdPath = join(sourceDir, 'SKILL.md');
  const rawContent = await readFile(skillMdPath, 'utf-8');
  const parseResult = safeParseFrontmatter(rawContent);
  if (!parseResult.success) {
    throw new Error(`Invalid skill file: ${parseResult.error}`);
  }
  const validatedMetadata = SkillMetadataSchema.parse(parseResult.data);

  // Build a Skill object from parsed content
  const skill: Skill = {
    metadata: validatedMetadata as SkillMetadata,
    body: parseResult.body,
    path: skillMdPath,
  };

  // Transform SKILL.md for the target platform
  const transformedContent = exportForPlatform(skill, platformId);

  // Ensure target directory exists
  await mkdir(targetDir, { recursive: true });

  // Write transformed SKILL.md
  await writeFile(join(targetDir, 'SKILL.md'), transformedContent, 'utf-8');
  copiedFiles.push('SKILL.md');

  // Recursively copy subdirectories (references/, scripts/, etc.)
  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subFiles = await copyDirectoryRecursive(
          join(sourceDir, entry.name),
          join(targetDir, entry.name),
          entry.name,
        );
        copiedFiles.push(...subFiles);
      }
    }
  } catch {
    // No subdirectories -- that's fine
  }

  return copiedFiles;
}

/**
 * Recursively copy a directory, normalizing .md file paths.
 *
 * @param srcDir - Source directory
 * @param dstDir - Destination directory
 * @param prefix - Relative path prefix for tracking
 * @returns List of relative file paths copied
 */
async function copyDirectoryRecursive(
  srcDir: string,
  dstDir: string,
  prefix: string,
): Promise<string[]> {
  const copiedFiles: string[] = [];

  await mkdir(dstDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(dstDir, entry.name);
    const relativePath = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      // Recurse into subdirectory
      const subFiles = await copyDirectoryRecursive(srcPath, dstPath, relativePath);
      copiedFiles.push(...subFiles);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.md')) {
        // Normalize paths in .md files
        const content = await readFile(srcPath, 'utf-8');
        const normalized = normalizePaths(content);
        await writeFile(dstPath, normalized, 'utf-8');
      } else {
        // Copy non-.md files as-is
        await copyFile(srcPath, dstPath);
      }
      copiedFiles.push(relativePath);
    }
  }

  return copiedFiles;
}
