import * as p from '@clack/prompts';
import pc from 'picocolors';
import { stat } from 'fs/promises';
import type { SkillScope } from '../../types/scope.js';
import { getSkillPath, getSkillsBasePath } from '../../types/scope.js';
import { SkillStore } from '../../storage/skill-store.js';

export interface ResolvedSkill {
  scope: SkillScope;
  path: string;
  description?: string;
  shadowedScope?: SkillScope;  // If another scope version exists but is shadowed
}

/**
 * Resolve which version of a skill would be used by Claude Code.
 * Precedence: project > user (project-level overrides user-level)
 */
export async function resolveSkill(skillName: string): Promise<ResolvedSkill | null> {
  const projectPath = getSkillPath('project', skillName);
  const userPath = getSkillPath('user', skillName);

  // Check existence in parallel
  const [projectExists, userExists] = await Promise.all([
    stat(projectPath).then(() => true).catch(() => false),
    stat(userPath).then(() => true).catch(() => false),
  ]);

  // Neither exists
  if (!projectExists && !userExists) {
    return null;
  }

  // Project takes precedence
  if (projectExists) {
    // Try to read description
    let description: string | undefined;
    try {
      const store = new SkillStore(getSkillsBasePath('project'));
      const skill = await store.read(skillName);
      description = skill.metadata.description;
    } catch {
      // Ignore read errors
    }

    return {
      scope: 'project',
      path: projectPath,
      description,
      shadowedScope: userExists ? 'user' : undefined,
    };
  }

  // User-level only
  let description: string | undefined;
  try {
    const store = new SkillStore(getSkillsBasePath('user'));
    const skill = await store.read(skillName);
    description = skill.metadata.description;
  } catch {
    // Ignore read errors
  }

  return {
    scope: 'user',
    path: userPath,
    description,
  };
}

/**
 * CLI command to show which version of a skill would be used.
 */
export async function resolveCommand(skillName: string): Promise<number> {
  if (!skillName) {
    p.log.error('Usage: skill-creator resolve <skill-name>');
    p.log.message('');
    p.log.message('Shows which version of a skill Claude Code will use.');
    p.log.message('');
    p.log.message('Example:');
    p.log.message('  skill-creator resolve my-skill');
    return 1;
  }

  const resolved = await resolveSkill(skillName);

  if (!resolved) {
    p.log.error(`Skill "${skillName}" not found at either scope.`);
    p.log.message('');
    p.log.message(pc.dim('Checked:'));
    p.log.message(pc.dim(`  - ${getSkillPath('project', skillName)}`));
    p.log.message(pc.dim(`  - ${getSkillPath('user', skillName)}`));
    return 1;
  }

  p.log.message('');
  p.log.message(pc.bold(`Skill: ${skillName}`));
  p.log.message('');

  // Show effective version
  const scopeLabel = resolved.scope === 'project' ? 'Project-level' : 'User-level';
  const scopePath = resolved.scope === 'project' ? '.claude/skills/' : '~/.claude/skills/';
  p.log.message(pc.green(`\u2713 Active: ${scopeLabel}`));
  p.log.message(pc.dim(`  Path: ${scopePath}${skillName}/SKILL.md`));
  if (resolved.description) {
    p.log.message(pc.dim(`  Description: ${resolved.description.slice(0, 60)}${resolved.description.length > 60 ? '...' : ''}`));
  }

  // Show shadowed version if exists
  if (resolved.shadowedScope) {
    p.log.message('');
    const shadowedLabel = resolved.shadowedScope === 'project' ? 'Project-level' : 'User-level';
    const shadowedPath = resolved.shadowedScope === 'project' ? '.claude/skills/' : '~/.claude/skills/';
    p.log.message(pc.yellow(`\u25cb Shadowed: ${shadowedLabel}`));
    p.log.message(pc.dim(`  Path: ${shadowedPath}${skillName}/SKILL.md`));
    p.log.message(pc.dim('  This version exists but is overridden by project-level.'));
  }

  p.log.message('');
  return 0;
}
