import * as path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export const HOOKS_DIR = path.join(PROJECT_ROOT, 'project-claude', 'hooks');
export const SKILLS_DIR = path.join(PROJECT_ROOT, 'project-claude', 'skills');

export function resolveHookPath(hookRelPath: string): string {
  return path.join(HOOKS_DIR, hookRelPath);
}

export function resolveSkillPath(skillName: string, file = 'SKILL.md'): string {
  return path.join(SKILLS_DIR, skillName, file);
}
