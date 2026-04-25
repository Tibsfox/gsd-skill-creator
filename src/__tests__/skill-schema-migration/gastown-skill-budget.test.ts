// CF-H-030 — Gastown skill split + 800-word budget enforcement.
//
// The three Gastown skills (sling-dispatch, done-retirement, gupp-propulsion)
// are the heaviest in the project tree. Each one MUST stay under the
// 800-word body budget by moving detail into a per-skill references/
// subdirectory. This test asserts both the budget and the references
// subdirectory presence.
//
// Closes: OGA-030 (HIGH).

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const SKILLS_DIR = resolve(REPO_ROOT, 'project-claude', 'skills');

const GASTOWN_SKILLS = ['sling-dispatch', 'done-retirement', 'gupp-propulsion'] as const;
const WORD_BUDGET = 800;

function bodyWordCount(skillName: string): number {
  const path = join(SKILLS_DIR, skillName, 'SKILL.md');
  const text = readFileSync(path, 'utf-8');
  // Strip frontmatter (between first two --- fences).
  const match = /^---\n[\s\S]*?\n---\n?/.exec(text);
  const body = match ? text.slice(match[0].length) : text;
  return body
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

describe('CF-H-030: Gastown skills exist with references subdir', () => {
  it.each(GASTOWN_SKILLS)('%s has SKILL.md and references/ directory', (skill) => {
    const skillPath = join(SKILLS_DIR, skill, 'SKILL.md');
    const refsPath = join(SKILLS_DIR, skill, 'references');
    expect(existsSync(skillPath)).toBe(true);
    expect(existsSync(refsPath)).toBe(true);
    expect(statSync(refsPath).isDirectory()).toBe(true);
  });

  it.each(GASTOWN_SKILLS)('%s references/ contains at least one .md file', (skill) => {
    const refsPath = join(SKILLS_DIR, skill, 'references');
    const files = readdirSync(refsPath).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThan(0);
  });
});

describe('CF-H-030: Gastown SKILL.md body fits the 800-word budget', () => {
  it.each(GASTOWN_SKILLS)('%s body is at or under 800 words', (skill) => {
    const wc = bodyWordCount(skill);
    expect(wc).toBeLessThanOrEqual(WORD_BUDGET);
  });
});

describe('CF-H-030: Gastown SKILL.md links to its own references', () => {
  it.each(GASTOWN_SKILLS)('%s SKILL.md links to at least one references/ file', (skill) => {
    const path = join(SKILLS_DIR, skill, 'SKILL.md');
    const text = readFileSync(path, 'utf-8');
    expect(text).toMatch(/references\/[a-z0-9-]+\.md/);
  });
});

describe('CF-H-030: Gastown frontmatter declares the split contract', () => {
  it.each(GASTOWN_SKILLS)('%s declares references_subdir + word_budget', (skill) => {
    const path = join(SKILLS_DIR, skill, 'SKILL.md');
    const text = readFileSync(path, 'utf-8');
    expect(text).toMatch(/^references_subdir\s*:\s*true\s*$/m);
    expect(text).toMatch(/^word_budget\s*:\s*800\s*$/m);
  });
});

describe('CF-H-030: every references/ file referenced from its SKILL.md', () => {
  it.each(GASTOWN_SKILLS)('%s has no orphan references/ files', (skill) => {
    const refsPath = join(SKILLS_DIR, skill, 'references');
    const refFiles = readdirSync(refsPath).filter((f) => f.endsWith('.md'));
    const skillText = readFileSync(join(SKILLS_DIR, skill, 'SKILL.md'), 'utf-8');
    for (const f of refFiles) {
      expect(skillText, `references/${f} should be linked from ${skill}/SKILL.md`).toContain(
        `references/${f}`,
      );
    }
  });
});
