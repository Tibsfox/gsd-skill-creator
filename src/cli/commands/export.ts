import * as p from '@clack/prompts';
import pc from 'picocolors';
import { join, dirname } from 'path';
import { mkdir, writeFile, readdir } from 'fs/promises';
import { SkillStore } from '../../storage/skill-store.js';
import type { Skill } from '../../types/skill.js';
import {
  exportPortableContent,
  exportSkillDirectory,
  getSupportedPlatforms,
  PLATFORMS,
} from '../../portability/index.js';
import { getSkillsBasePath } from '../../types/scope.js';

/**
 * CLI export command -- export skills for other platforms.
 *
 * Modes:
 *   --portable     Strip extension fields for agentskills.io standard output
 *   --platform <id>  Generate platform-specific variant
 *
 * @param skillName - Name of the skill to export
 * @param options - Export options
 * @returns Exit code (0 success, 1 error)
 */
export async function exportCommand(
  skillName: string | undefined,
  options: {
    portable?: boolean;
    platform?: string;
    output?: string;
    skillsDir?: string;
  },
): Promise<number> {
  // No skill name provided
  if (!skillName) {
    showExportHelp();
    return 1;
  }

  // Neither --portable nor --platform specified
  if (!options.portable && !options.platform) {
    p.log.error('Specify either --portable or --platform <target>.');
    p.log.message('');
    showExportHelp();
    return 1;
  }

  // Both --portable and --platform specified
  if (options.portable && options.platform) {
    p.log.error('Use --portable OR --platform, not both.');
    return 1;
  }

  // Unknown platform
  if (options.platform) {
    const supported = getSupportedPlatforms();
    if (!supported.includes(options.platform)) {
      p.log.error(
        `Unknown platform: "${options.platform}". Supported: ${supported.join(', ')}`,
      );
      return 1;
    }
  }

  // Read the skill
  const skillsDir = options.skillsDir ?? getSkillsBasePath('user');
  const store = new SkillStore(skillsDir);

  const exists = await store.exists(skillName);
  if (!exists) {
    p.log.error(`Skill "${skillName}" not found in ${skillsDir}/`);
    return 1;
  }

  const skill = await store.read(skillName);
  const skillSourceDir = dirname(skill.path);

  // Determine if skill has subdirectories (references/, scripts/, etc.)
  const hasSubdirs = await checkHasSubdirectories(skillSourceDir);

  // Determine output directory
  const outputDir = options.output ?? join('exported-skills', skillName);

  p.intro(pc.bgCyan(pc.black(' Exporting skill... ')));

  try {
    if (options.portable) {
      // Portable mode
      const writtenFiles = await exportPortableMode(
        skill,
        skillSourceDir,
        outputDir,
        hasSubdirs,
      );

      p.log.success(`Exported "${skillName}" in portable format`);
      p.log.message(pc.dim(`Output: ${outputDir}/`));
      p.log.message(pc.dim(`Format: Portable (agentskills.io standard)`));
      p.log.message('');
      p.log.message(pc.dim('Files written:'));
      for (const file of writtenFiles) {
        p.log.message(pc.dim(`  ${file}`));
      }
    } else if (options.platform) {
      // Platform mode
      const writtenFiles = await exportSkillDirectory(
        skillSourceDir,
        outputDir,
        options.platform,
      );

      const platformConfig = PLATFORMS[options.platform];
      p.log.success(
        `Exported "${skillName}" for ${platformConfig.name}`,
      );
      p.log.message(pc.dim(`Output: ${outputDir}/`));
      p.log.message(pc.dim(`Format: ${platformConfig.name}`));
      p.log.message('');
      p.log.message(pc.dim('Files written:'));
      for (const file of writtenFiles) {
        p.log.message(pc.dim(`  ${file}`));
      }
      p.log.message('');
      p.log.message(
        pc.dim(
          `Install to: ${platformConfig.userSkillsDir}/${skillName}/ or ${platformConfig.projectSkillsDir}/${skillName}/`,
        ),
      );
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    p.log.error(`Export failed: ${errMsg}`);
    return 1;
  }

  return 0;
}

/**
 * Export skill in portable mode.
 *
 * If the skill has no subdirectories, writes a single SKILL.md.
 * If it has subdirectories, writes portable SKILL.md plus copies
 * subdirectories with path normalization.
 */
async function exportPortableMode(
  skill: Skill,
  skillSourceDir: string,
  outputDir: string,
  hasSubdirs: boolean,
): Promise<string[]> {
  const writtenFiles: string[] = [];

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Write portable SKILL.md
  const portableContent = exportPortableContent(skill);
  await writeFile(join(outputDir, 'SKILL.md'), portableContent, 'utf-8');
  writtenFiles.push('SKILL.md');

  // If skill has subdirectories, copy them with path normalization
  if (hasSubdirs) {
    const { normalizePaths } = await import('../../portability/index.js');
    const { readFile: rf, copyFile } = await import('fs/promises');

    const entries = await readdir(skillSourceDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subFiles = await copyDirRecursive(
          join(skillSourceDir, entry.name),
          join(outputDir, entry.name),
          entry.name,
          normalizePaths,
          rf,
          copyFile,
        );
        writtenFiles.push(...subFiles);
      }
    }
  }

  return writtenFiles;
}

/**
 * Recursively copy a directory, normalizing .md file paths.
 */
async function copyDirRecursive(
  srcDir: string,
  dstDir: string,
  prefix: string,
  normalizePaths: (content: string) => string,
  readFileFn: (path: string, encoding: 'utf-8') => Promise<string>,
  copyFileFn: (src: string, dst: string) => Promise<void>,
): Promise<string[]> {
  const copiedFiles: string[] = [];

  await mkdir(dstDir, { recursive: true });

  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(dstDir, entry.name);
    const relativePath = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      const subFiles = await copyDirRecursive(
        srcPath,
        dstPath,
        relativePath,
        normalizePaths,
        readFileFn,
        copyFileFn,
      );
      copiedFiles.push(...subFiles);
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.md')) {
        const content = await readFileFn(srcPath, 'utf-8');
        const normalized = normalizePaths(content);
        await writeFile(dstPath, normalized, 'utf-8');
      } else {
        await copyFileFn(srcPath, dstPath);
      }
      copiedFiles.push(relativePath);
    }
  }

  return copiedFiles;
}

/**
 * Check if a skill directory has any subdirectories.
 */
async function checkHasSubdirectories(skillDir: string): Promise<boolean> {
  try {
    const entries = await readdir(skillDir, { withFileTypes: true });
    return entries.some(e => e.isDirectory());
  } catch {
    return false;
  }
}

/**
 * Show help for export command.
 */
function showExportHelp(): void {
  console.log(`
skill-creator export - Export skills for other platforms

Usage:
  skill-creator export --portable <skill-name> [options]
  skill-creator export --platform <target> <skill-name> [options]

Modes:
  --portable        Strip extension fields for agentskills.io standard output
  --platform <id>   Generate platform-specific variant

Supported platforms:
  claude    Claude Code (~/.claude/skills/)
  cursor    Cursor (~/.cursor/skills/)
  codex     Codex CLI (~/.agents/skills/)
  copilot   GitHub Copilot (~/.copilot/skills/, .github/skills/)
  gemini    Gemini CLI (~/.gemini/skills/)

Options:
  --output, -o <dir>   Output directory (default: ./exported-skills/<name>/)
  --project, -p        Read from project-level scope
  --help, -h           Show this help message

Examples:
  skill-creator export --portable my-skill
  skill-creator export --platform cursor my-skill
  skill-creator export --platform codex my-skill --output ./out
  skill-creator export --portable my-skill --project
`);
}
