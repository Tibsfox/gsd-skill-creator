import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildSkillInventory, formatSkillInventory } from './skill-inventory.js';

function mkRoot(): string {
  return mkdtempSync(join(tmpdir(), 'skill-inventory-'));
}

function writeSkill(root: string, name: string, body: string): string {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'SKILL.md');
  writeFileSync(file, body);
  return file;
}

describe('skill-inventory', () => {
  it('T-LC-05: reports counts by status', () => {
    const root = mkRoot();
    try {
      writeSkill(
        root,
        'a',
        `---\nname: a\ndescription: d\nstatus: active\nupdated: 2026-04-10\n---\n`
      );
      writeSkill(
        root,
        'b',
        `---\nname: b\ndescription: d\nstatus: active\nupdated: 2026-04-10\n---\n`
      );
      writeSkill(
        root,
        'c',
        `---\nname: c\ndescription: d\nstatus: deprecated\ndeprecated_by: a\nupdated: 2026-04-10\n---\n`
      );
      writeSkill(
        root,
        'd',
        `---\nname: d\ndescription: d\nstatus: retired\nupdated: 2026-04-10\n---\n`
      );
      const report = buildSkillInventory({ skillsRoot: root, now: () => new Date('2026-04-15') });
      expect(report.total).toBe(4);
      expect(report.byStatus.active).toBe(2);
      expect(report.byStatus.deprecated).toBe(1);
      expect(report.byStatus.retired).toBe(1);
      expect(report.deprecated.length).toBe(1);
      expect(report.deprecated[0].deprecatedBy).toBe('a');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('T-LC-06: flags active skills with updated >90 days ago as stale', () => {
    const root = mkRoot();
    try {
      writeSkill(
        root,
        'fresh',
        `---\nname: fresh\ndescription: d\nstatus: active\nupdated: 2026-04-10\n---\n`
      );
      writeSkill(
        root,
        'stale',
        `---\nname: stale\ndescription: d\nstatus: active\nupdated: 2025-12-01\n---\n`
      );
      const report = buildSkillInventory({ skillsRoot: root, now: () => new Date('2026-04-15') });
      expect(report.stale.length).toBe(1);
      expect(report.stale[0].name).toBe('stale');
      expect(report.stale[0].ageDays).toBeGreaterThan(90);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not flag deprecated/retired skills as stale even if old', () => {
    const root = mkRoot();
    try {
      writeSkill(
        root,
        'old-dep',
        `---\nname: old-dep\ndescription: d\nstatus: deprecated\nupdated: 2024-01-01\n---\n`
      );
      const report = buildSkillInventory({ skillsRoot: root, now: () => new Date('2026-04-15') });
      expect(report.stale.length).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('formatSkillInventory renders clean output for empty state', () => {
    const root = mkRoot();
    try {
      writeSkill(
        root,
        'one',
        `---\nname: one\ndescription: d\nstatus: active\nupdated: 2026-04-10\n---\n`
      );
      const report = buildSkillInventory({ skillsRoot: root, now: () => new Date('2026-04-15') });
      const text = formatSkillInventory(report);
      expect(text).toContain('Skill inventory (1 total)');
      expect(text).toContain('active:     1');
      expect(text).toContain('<none>');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
