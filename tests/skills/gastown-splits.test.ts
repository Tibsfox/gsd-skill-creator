import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SKILLS_DIR } from '../fixtures/test-hooks.js';

function readSkill(name: string): string {
  return readFileSync(join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseFrontmatter(md: string): { description: string; body: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('No frontmatter');
  const descMatch = m[1].match(/description:\s*(.+?)\s*(?:\n|$)/);
  return {
    description: descMatch ? descMatch[1] : '',
    body: m[2],
  };
}

describe('Wave 2B: Gastown skill splits — word-count gate', () => {
  const skills = [
    { name: 'sling-dispatch', ref: 'references/pipeline-implementation.md' },
    { name: 'done-retirement', ref: 'references/retirement-implementation.md' },
    { name: 'gupp-propulsion', ref: 'references/runtime-strategies.md' },
  ];

  for (const { name, ref } of skills) {
    it(`${name}/SKILL.md is at or below 820 words`, () => {
      const md = readSkill(name);
      // Count body only — frontmatter holds bounded agentskills.io spec fields
      // (version, format, triggers, status) added by v1.49.576 OGA-032/033 and
      // does not contribute to the payload-bloat budget the gate is protecting.
      expect(wordCount(parseFrontmatter(md).body)).toBeLessThanOrEqual(820);
    });

    it(`${name} reference file exists at ${ref}`, () => {
      const p = join(SKILLS_DIR, name, ref);
      expect(existsSync(p)).toBe(true);
    });
  }

  it('gupp-propulsion also has metrics-and-learning.md reference', () => {
    const p = join(SKILLS_DIR, 'gupp-propulsion', 'references', 'metrics-and-learning.md');
    expect(existsSync(p)).toBe(true);
  });
});

describe('Wave 2B: Gastown splits — safety content retained in SKILL.md', () => {
  it('done-retirement SKILL.md retains irreversibility language', () => {
    const md = readSkill('done-retirement');
    expect(md.toLowerCase()).toContain('irreversib');
    expect(md.toLowerCase()).toContain('done means gone');
    expect(md).toMatch(/point of no return|irreversible after this|IRREVERSIBLE/i);
  });

  it('gupp-propulsion SKILL.md retains safety boundaries', () => {
    const md = readSkill('gupp-propulsion');
    expect(md.toLowerCase()).toContain('safety boundaries');
    expect(md.toLowerCase()).toContain('advisory in gsd');
    expect(md.toLowerCase()).toContain('human escalation');
    expect(md.toLowerCase()).toContain('no data destruction');
    expect(md).toMatch(/max restarts per bead.*3/i);
  });
});

describe('Wave 2B: Gastown splits — activation descriptions unchanged', () => {
  it('sling-dispatch description keeps all original trigger keywords', () => {
    const md = readSkill('sling-dispatch');
    const fm = parseFrontmatter(md);
    const desc = fm.description.toLowerCase();
    const triggers = [
      'instruction dispatch',
      'work items',
      '7-stage',
      'fetch',
      'allocate',
      'prepare',
      'hook',
      'store',
      'launch',
      'confirm',
      'batch',
      'convoy',
      'formula',
      'idempotent',
      'crash recovery',
    ];
    for (const t of triggers) {
      expect(desc).toContain(t);
    }
  });

  it('done-retirement description keeps all original trigger keywords', () => {
    const md = readSkill('done-retirement');
    const fm = parseFrontmatter(md);
    const desc = fm.description.toLowerCase();
    for (const t of [
      'pipeline retirement',
      'completed work items',
      '7-stage',
      'validate',
      'commit',
      'push',
      'submit',
      'notify',
      'cleanup',
      'terminate',
      'irreversibility',
      'done means gone',
    ]) {
      expect(desc).toContain(t);
    }
  });

  it('gupp-propulsion description keeps all original trigger keywords', () => {
    const md = readSkill('gupp-propulsion');
    const fm = parseFrontmatter(md);
    const desc = fm.description.toLowerCase();
    for (const t of [
      'interrupt controller',
      'polled to proactive',
      'agent execution',
      'per-runtime',
      'thresholds',
      'deacon heartbeat',
      'supervision',
      'passivity',
    ]) {
      expect(desc).toContain(t);
    }
  });
});
