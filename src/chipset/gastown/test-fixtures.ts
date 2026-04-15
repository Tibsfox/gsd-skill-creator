import * as path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname ?? __dirname, '../../..');

const SKILL_CATEGORY: Record<string, string> = {
  'refinery-merge': 'workflow',
  'runtime-hal': 'orchestration',
  'done-retirement': 'state',
  'gupp-propulsion': 'orchestration',
  'mayor-coordinator': 'orchestration',
  'witness-observer': 'orchestration',
  'polecat-worker': 'orchestration',
  'beads-state': 'state',
  'sling-dispatch': 'orchestration',
};

export function resolveSkillDir(skillName: string): string {
  const category = SKILL_CATEGORY[skillName];
  if (!category) {
    throw new Error(`Unknown gastown fixture skill: ${skillName}`);
  }
  return path.resolve(PROJECT_ROOT, `examples/skills/${category}/${skillName}`);
}

export function resolveSkillPath(skillName: string): string {
  return path.join(resolveSkillDir(skillName), 'SKILL.md');
}
