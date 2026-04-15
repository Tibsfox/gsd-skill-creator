import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  checkCoverage,
  type SkillDescriptor,
} from '../../src/skill/activation-equivalence.js';

const SKILLS_DIR = join(process.cwd(), '.claude', 'skills');

function parseDescription(md: string): string {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error('No frontmatter');
  const d = m[1].match(/description:\s*"?(.+?)"?\s*(?:\n\w|$)/s);
  return d ? d[1].trim().replace(/^"(.*)"$/, '$1') : '';
}

function desc(skillName: string): SkillDescriptor {
  const path = join(SKILLS_DIR, skillName, 'SKILL.md');
  const md = readFileSync(path, 'utf8');
  return { name: skillName, description: parseDescription(md) };
}

// Pre-split source descriptions captured verbatim for activation equivalence.
const SOURCE_DESCRIPTIONS: Record<string, SkillDescriptor> = {
  'beautiful-commits': {
    name: 'beautiful-commits',
    description:
      'Crafts professional git commit messages following Conventional Commits. Use when committing changes or writing commit messages.',
  },
  'git-commit': {
    name: 'git-commit',
    description:
      "Generates conventional commit messages following Angular format. Use when committing changes, writing commit messages, or when user mentions 'commit', 'conventional commits', 'commit message'.",
  },
  'gsd-onboard': {
    name: 'gsd-onboard',
    description: 'GSD tutorial and command reference. Use when user is new to GSD or asks about commands.',
  },
  'gsd-explain': {
    name: 'gsd-explain',
    description:
      "Explains what a GSD workflow command will do before you run it. Activates when user asks about GSD commands, wants to understand workflows, or mentions 'what does', 'explain', 'how does GSD', 'preview'.",
  },
  'uc-lab': {
    name: 'uc-lab',
    description:
      'Unit Circle Laboratory — Autonomous mission control for the UC re-execution series. Provides the human-in-the-loop automation layer with pipeline management, context lifecycle, and stuck-state prevention. Auto-activates during UC milestone work.',
  },
  'sc-dev-team': {
    name: 'sc-dev-team',
    description:
      "Dev branch execution team — Autonomous mission control for dev branch milestones. Adapted from uc-lab pattern for code execution (plan/execute/verify/complete). Trigger: user says 'bring up the dev team' or 'sc-dev-team'.",
  },
};

describe('Wave 2C: Skill merges — merged skills exist', () => {
  for (const name of ['commit-style', 'gsd-guide', 'team-control']) {
    it(`${name}/SKILL.md exists`, () => {
      expect(existsSync(join(SKILLS_DIR, name, 'SKILL.md'))).toBe(true);
    });
  }
});

describe('Wave 2C: Skill merges — source skills deleted', () => {
  for (const name of [
    'beautiful-commits',
    'git-commit',
    'gsd-onboard',
    'gsd-explain',
    'uc-lab',
    'sc-dev-team',
  ]) {
    it(`${name}/ is removed`, () => {
      expect(existsSync(join(SKILLS_DIR, name))).toBe(false);
    });
  }
});

describe('Wave 2C: Skill merges — activation equivalence', () => {
  it('commit-style covers beautiful-commits triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['beautiful-commits'], desc('commit-style'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });

  it('commit-style covers git-commit triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['git-commit'], desc('commit-style'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });

  it('gsd-guide covers gsd-onboard triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['gsd-onboard'], desc('gsd-guide'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });

  it('gsd-guide covers gsd-explain triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['gsd-explain'], desc('gsd-guide'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });

  it('team-control covers uc-lab triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['uc-lab'], desc('team-control'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });

  it('team-control covers sc-dev-team triggers', () => {
    const res = checkCoverage(SOURCE_DESCRIPTIONS['sc-dev-team'], desc('team-control'));
    expect(res.missing).toEqual([]);
    expect(res.covered).toBe(true);
  });
});

describe('Wave 2C: Skill merges — uc-lab quality rubric preserved verbatim', () => {
  it('team-control contains the uc-lab quality rubric weights and min scores', () => {
    const md = readFileSync(join(SKILLS_DIR, 'team-control', 'SKILL.md'), 'utf8');
    expect(md).toContain('Completeness');
    expect(md).toContain('25%');
    expect(md).toContain('Depth');
    expect(md).toContain('30%');
    expect(md).toContain('Connections');
    expect(md).toContain('Honesty');
    expect(md).toContain('20%');
    expect(md).toContain('3.0');
  });
});

describe('Wave 2C: Skill merges — description length limit', () => {
  // Spec 06-skill-merges-spec.md §Technical Notes: 250 is aspirational; merges
  // whose trigger-vocabulary union exceeds 250 may widen. team-control's union
  // of uc-lab + sc-dev-team cannot fit in 250 while preserving all triggers.
  it('commit-style description <= 250 chars', () => {
    expect(desc('commit-style').description.length).toBeLessThanOrEqual(250);
  });
  it('gsd-guide description <= 250 chars', () => {
    expect(desc('gsd-guide').description.length).toBeLessThanOrEqual(250);
  });
  it('team-control description <= 400 chars', () => {
    expect(desc('team-control').description.length).toBeLessThanOrEqual(400);
  });
});
