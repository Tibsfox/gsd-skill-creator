/**
 * CLI command for publishing skill packages.
 *
 * Delegates to packSkill to create a distributable .tar.gz archive.
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { join } from 'path';
import { packSkill } from '../../mcp/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import { getSkillsBasePath } from '../../types/scope.js';

/**
 * Package a skill for distribution as a .tar.gz archive.
 *
 * @param skillName - Name of the skill to publish
 * @param options - Publish options
 * @returns Exit code (0 success, 1 error)
 */
export async function publishCommand(
  skillName: string | undefined,
  options: { skillsDir?: string; output?: string },
): Promise<number> {
  // No skill name provided -- show help
  if (!skillName) {
    showPublishHelp();
    return 1;
  }

  const skillsDir = options.skillsDir ?? getSkillsBasePath('user');
  const store = new SkillStore(skillsDir);

  // Verify skill exists
  const exists = await store.exists(skillName);
  if (!exists) {
    p.log.error(`Skill "${skillName}" not found in ${skillsDir}/`);
    return 1;
  }

  // Determine output path
  const outputPath = options.output ?? `./${skillName}.skill.tar.gz`;

  // Get skill directory path
  const skillDir = join(skillsDir, skillName);

  try {
    p.intro(pc.bgCyan(pc.black(' Publishing skill... ')));

    const manifest = await packSkill(skillDir, skillName, outputPath);

    p.log.success(`Published "${skillName}"`);
    p.log.message(pc.dim(`Name: ${manifest.name}`));
    p.log.message(pc.dim(`Format version: ${manifest.formatVersion}`));
    p.log.message(pc.dim(`Files: ${manifest.files.length}`));
    p.log.message(pc.dim(`Archive: ${outputPath}`));

    return 0;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    p.log.error(`Publish failed: ${errMsg}`);
    return 1;
  }
}

function showPublishHelp(): void {
  console.log(`
skill-creator publish - Package a skill for distribution

Usage:
  skill-creator publish <skill-name> [options]

Options:
  --output, -o <path>   Output file path (default: ./<skill-name>.skill.tar.gz)
  --project, -p         Read from project-level scope
  --help, -h            Show this help message

The published package uses portable format (extension fields stripped).
`);
}
