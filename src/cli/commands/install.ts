/**
 * CLI command for installing skill packages.
 *
 * Delegates to installSkill for local file or remote URL installation.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { installSkill } from '../../mcp/index.js';
import { getSkillsBasePath } from '../../types/scope.js';

/**
 * Install a skill from a local .tar.gz file or remote URL.
 *
 * @param source - Local file path or URL to .tar.gz package
 * @param options - Install options
 * @returns Exit code (0 success, 1 error)
 */
export async function installCommand(
  source: string | undefined,
  options: { skillsDir?: string },
): Promise<number> {
  // No source provided -- show help
  if (!source) {
    showInstallHelp();
    return 1;
  }

  const skillsDir = options.skillsDir ?? getSkillsBasePath('user');
  const isRemote = source.startsWith('http://') || source.startsWith('https://');

  try {
    p.intro(pc.bgCyan(pc.black(' Installing skill... ')));

    if (isRemote) {
      p.log.step(`Downloading from ${source}...`);
    } else {
      p.log.step(`Installing from ${source}...`);
    }

    const result = await installSkill(source, skillsDir);

    if (result.success) {
      p.log.success(`Installed "${result.skillName}"`);
      if (result.installedPath) {
        p.log.message(pc.dim(`Path: ${result.installedPath}`));
      }
      if (result.warnings.length > 0) {
        p.log.message('');
        p.log.warn('Warnings:');
        for (const warning of result.warnings) {
          p.log.message(pc.yellow(`  - ${warning}`));
        }
      }
      return 0;
    }

    p.log.error(`Installation failed: ${result.error}`);
    if (result.warnings.length > 0) {
      p.log.message('');
      p.log.warn('Warnings:');
      for (const warning of result.warnings) {
        p.log.message(pc.yellow(`  - ${warning}`));
      }
    }
    return 1;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    p.log.error(`Install failed: ${errMsg}`);
    return 1;
  }
}

function showInstallHelp(): void {
  console.log(`
skill-creator install - Install a skill from a package

Usage:
  skill-creator install <source> [options]

Source can be:
  Local file:   skill-creator install ./my-skill.skill.tar.gz
  Remote URL:   skill-creator install https://example.com/skill.tar.gz

Options:
  --project, -p   Install to project-level scope (default: user-level)
  --help, -h      Show this help message

Remote skills undergo stricter safety validation before installation.
`);
}
