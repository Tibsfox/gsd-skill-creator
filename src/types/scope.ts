import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Scope determines where skills are stored.
 * - 'user': User-level skills in ~/.claude/skills/ (shared across all projects)
 * - 'project': Project-level skills in .claude/skills/ (project-specific)
 */
export type SkillScope = 'user' | 'project';

/**
 * CLI flag for project scope selection.
 * Default is user scope; use this flag to specify project scope.
 */
export const SCOPE_FLAG = '--project';

/**
 * Short CLI flag for project scope selection.
 */
export const SCOPE_FLAG_SHORT = '-p';

/**
 * Get the base path for skills storage based on scope.
 *
 * @param scope - 'user' for ~/.claude/skills, 'project' for .claude/skills
 * @returns Absolute path to skills directory
 */
export function getSkillsBasePath(scope: SkillScope): string {
  if (scope === 'user') {
    return join(homedir(), '.claude', 'skills');
  }
  return join('.claude', 'skills');
}

/**
 * Get the full path to a specific skill's SKILL.md file.
 *
 * @param scope - 'user' or 'project'
 * @param skillName - Name of the skill
 * @returns Full path to the skill's SKILL.md file
 */
export function getSkillPath(scope: SkillScope, skillName: string): string {
  return join(getSkillsBasePath(scope), skillName, 'SKILL.md');
}

/**
 * Parse CLI arguments to determine scope.
 * Returns 'project' if --project or -p flag is present, otherwise 'user'.
 *
 * @param args - Array of CLI arguments
 * @returns Parsed scope value
 */
export function parseScope(args: string[]): SkillScope {
  if (args.includes(SCOPE_FLAG) || args.includes(SCOPE_FLAG_SHORT)) {
    return 'project';
  }
  return 'user';
}

/**
 * Result of resolving a skill path with scope context.
 * Used for operations that need to track both path and scope.
 */
export interface ScopedSkillPath {
  /** The scope (user or project) */
  scope: SkillScope;
  /** Base path to skills directory */
  basePath: string;
  /** Full path to the specific skill's SKILL.md */
  fullPath: string;
}

/**
 * Resolve a skill path with full scope context.
 *
 * @param scope - 'user' or 'project'
 * @param skillName - Name of the skill
 * @returns ScopedSkillPath with all path information
 */
export function resolveScopedSkillPath(scope: SkillScope, skillName: string): ScopedSkillPath {
  const basePath = getSkillsBasePath(scope);
  return {
    scope,
    basePath,
    fullPath: join(basePath, skillName, 'SKILL.md'),
  };
}
