import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadSkillWithLifecycle } from '../lifecycle-loader.js';

function mkFixtureRoot(): string {
  return mkdtempSync(join(tmpdir(), 'lifecycle-'));
}

function writeSkill(root: string, name: string, content: string): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'SKILL.md');
  writeFileSync(file, content);
  return file;
}

describe('lifecycle-loader', () => {
  it('T-LC-01: status:active loads normally', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(
        root,
        'active-skill',
        `---\nname: active-skill\ndescription: d\nstatus: active\n---\n\nbody\n`
      );
      const loaded = loadSkillWithLifecycle(file);
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('active');
      expect(loaded!.warnings).toEqual([]);
      expect(loaded!.body).toContain('body');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-LC-02: missing status defaults to active', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(
        root,
        'no-status',
        `---\nname: no-status\ndescription: d\n---\n\nbody\n`
      );
      const loaded = loadSkillWithLifecycle(file);
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('active');
      expect(loaded!.warnings).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-LC-03: status:deprecated loads with stderr warning via onWarning hook', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(
        root,
        'dep-skill',
        `---\nname: dep-skill\ndescription: d\nstatus: deprecated\ndeprecated_by: new-skill\n---\n\nbody\n`
      );
      const warnings: string[] = [];
      const loaded = loadSkillWithLifecycle(file, { onWarning: (w) => warnings.push(w) });
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('deprecated');
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('DEPRECATED skill "dep-skill"');
      expect(warnings[0]).toContain('new-skill');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-LC-04: status:retired does not load at all', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(
        root,
        'ret-skill',
        `---\nname: ret-skill\ndescription: d\nstatus: retired\n---\n\nbody\n`
      );
      const loaded = loadSkillWithLifecycle(file);
      expect(loaded).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('status:draft does not load by default but loads with allowDraft', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(
        root,
        'draft-skill',
        `---\nname: draft-skill\ndescription: d\nstatus: draft\n---\n\nbody\n`
      );
      expect(loadSkillWithLifecycle(file)).toBeNull();
      const loaded = loadSkillWithLifecycle(file, { allowDraft: true });
      expect(loaded).not.toBeNull();
      expect(loaded!.status).toBe('draft');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('returns null for files with no frontmatter', () => {
    const root = mkFixtureRoot();
    try {
      const file = writeSkill(root, 'no-fm', `# plain markdown\n`);
      expect(loadSkillWithLifecycle(file)).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
