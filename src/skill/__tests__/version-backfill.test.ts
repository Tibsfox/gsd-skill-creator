import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  backfillSkillContent,
  parseFrontmatter,
  mergeFrontmatter,
  runBackfill,
  findSkillFiles,
} from '../version-backfill.js';

function mkTmpSkills(): string {
  const dir = mkdtempSync(join(tmpdir(), 'skill-backfill-'));
  return dir;
}

function writeSkill(root: string, name: string, content: string): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'SKILL.md');
  writeFileSync(file, content);
  return file;
}

describe('version-backfill: parseFrontmatter', () => {
  it('parses a frontmatter block', () => {
    const md = `---\nname: foo\ndescription: bar\n---\n\nbody here\n`;
    const p = parseFrontmatter(md);
    expect(p.hasFrontmatter).toBe(true);
    expect(p.frontmatter.name).toBe('foo');
    expect(p.body).toContain('body here');
  });

  it('returns no-frontmatter for plain markdown', () => {
    const md = `# Just a doc\n\nno frontmatter\n`;
    const p = parseFrontmatter(md);
    expect(p.hasFrontmatter).toBe(false);
    expect(p.body).toBe(md);
  });
});

describe('version-backfill: backfillSkillContent', () => {
  const today = () => '2026-04-15';

  it('T-LC-07: preserves existing frontmatter fields (no overwrites)', () => {
    const md = `---
name: commit-style
description: commits and messages
format: 2025-10-02
version: 1.2.3
status: active
updated: 2026-01-01
---

body
`;
    const result = backfillSkillContent(md, '/fake/commit-style/SKILL.md', today);
    expect(result.changed).toBe(false);
    expect(result.added).toEqual([]);
    expect(result.after).toBe(md);
    const parsed = parseFrontmatter(result.after);
    expect(parsed.frontmatter.version).toBe('1.2.3');
    expect(parsed.frontmatter.updated).toBe('2026-01-01');
  });

  it('adds all four missing fields on a bare skill', () => {
    const md = `---\nname: bare\ndescription: minimal skill\n---\n\nbody\n`;
    const result = backfillSkillContent(md, '/does-not-exist/SKILL.md', today);
    expect(result.changed).toBe(true);
    expect(result.added.sort()).toEqual(['format', 'status', 'updated', 'version']);
    const parsed = parseFrontmatter(result.after);
    expect(parsed.frontmatter.format).toBe('2025-10-02');
    expect(parsed.frontmatter.version).toBe('1.0.0');
    expect(parsed.frontmatter.status).toBe('active');
    expect(parsed.frontmatter.updated).toBe('2026-04-15');
  });

  it('only adds missing fields when version is already set', () => {
    const md = `---\nname: half\ndescription: half set\nversion: 2.0.0\n---\n\nbody\n`;
    const result = backfillSkillContent(md, '/none/SKILL.md', today);
    expect(result.changed).toBe(true);
    expect(result.added.sort()).toEqual(['format', 'status', 'updated']);
    const parsed = parseFrontmatter(result.after);
    expect(parsed.frontmatter.version).toBe('2.0.0');
  });

  it('leaves files without frontmatter untouched', () => {
    const md = `# no frontmatter here\n`;
    const result = backfillSkillContent(md, '/x/SKILL.md', today);
    expect(result.changed).toBe(false);
    expect(result.after).toBe(md);
  });
});

describe('version-backfill: mergeFrontmatter field order', () => {
  it('appends new fields after existing ones, preserving order', () => {
    const existing = `name: foo\ndescription: bar`;
    const out = mergeFrontmatter(existing, { format: '2025-10-02', version: '1.0.0' });
    expect(out).toBe(`name: foo\ndescription: bar\nformat: 2025-10-02\nversion: 1.0.0`);
  });
});

describe('version-backfill: runBackfill end-to-end', () => {
  it('processes multiple SKILL.md files in a fixture tree', () => {
    const root = mkTmpSkills();
    try {
      writeSkill(
        root,
        'bare-skill',
        `---\nname: bare-skill\ndescription: a skill\n---\n\nbody a\n`
      );
      writeSkill(
        root,
        'versioned-skill',
        `---\nname: versioned-skill\ndescription: b skill\nversion: 9.9.9\nstatus: deprecated\n---\n\nbody b\n`
      );

      const results = runBackfill({ write: true, skillsRoot: root, now: () => '2026-04-15' });
      expect(results.length).toBe(2);
      const a = results.find((r) => r.skill.includes('bare-skill'))!;
      const b = results.find((r) => r.skill.includes('versioned-skill'))!;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(a.changed).toBe(true);
      expect(a.added.sort()).toEqual(['format', 'status', 'updated', 'version']);
      expect(b.changed).toBe(true);
      expect(b.added.sort()).toEqual(['format', 'updated']);

      const aParsed = parseFrontmatter(readFileSync(a.skill, 'utf8'));
      expect(aParsed.frontmatter.version).toBe('1.0.0');
      expect(aParsed.frontmatter.status).toBe('active');
      const bParsed = parseFrontmatter(readFileSync(b.skill, 'utf8'));
      expect(bParsed.frontmatter.version).toBe('9.9.9');
      expect(bParsed.frontmatter.status).toBe('deprecated');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('findSkillFiles only matches SKILL.md files, not reference files', () => {
    const root = mkTmpSkills();
    try {
      writeSkill(root, 's1', `---\nname: s1\ndescription: x\n---\n`);
      const refDir = join(root, 's1', 'references');
      mkdirSync(refDir, { recursive: true });
      writeFileSync(join(refDir, 'extra.md'), 'not a skill');
      const files = findSkillFiles(root);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/s1\/SKILL\.md$/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
