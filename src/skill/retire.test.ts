import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  retireSkill,
  restoreSkill,
  selectRetireCandidates,
  buildRetireCandidates,
  type RetireCandidate,
} from './retire.js';
import type { SkillInventoryEntry } from '../cli/commands/skill-inventory.js';

let root: string;
let skillsDir: string;

function makeSkill(name: string, opts: { status?: string; updated?: string } = {}): void {
  const dir = join(skillsDir, name);
  mkdirSync(dir, { recursive: true });
  const fm = [
    '---',
    `name: ${name}`,
    'description: a test skill',
    `status: ${opts.status ?? 'active'}`,
    ...(opts.updated ? [`updated: ${opts.updated}`] : []),
    '---',
    '',
    `# ${name}`,
    '',
    'body content',
    '',
  ].join('\n');
  writeFileSync(join(dir, 'SKILL.md'), fm, 'utf8');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'retire-'));
  skillsDir = join(root, '.claude', 'skills');
  mkdirSync(skillsDir, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('retireSkill', () => {
  it('moves the skill out of the auto-load path, stamps frontmatter, logs evidence', async () => {
    makeSkill('stale', { updated: '2026-01-01' });
    const res = await retireSkill({ name: 'stale', skillsDir, reason: 'zero activations', now: () => new Date('2026-07-12') });

    expect(res.ok).toBe(true);
    // moved OUT of skills/ into the sibling skills-retired/
    expect(existsSync(join(skillsDir, 'stale'))).toBe(false);
    const dest = join(root, '.claude', 'skills-retired', 'stale');
    expect(existsSync(join(dest, 'SKILL.md'))).toBe(true);
    // frontmatter stamped
    const md = readFileSync(join(dest, 'SKILL.md'), 'utf8');
    expect(md).toContain('status: retired');
    expect(md).toContain('retired: 2026-07-12');
    expect(md).toContain('retire_reason: zero activations');
    // evidence logged
    const log = readFileSync(join(root, '.claude', 'skills-retired', 'retirements.jsonl'), 'utf8');
    expect(JSON.parse(log.trim())).toMatchObject({ action: 'retire', name: 'stale', reason: 'zero activations' });
  });

  it('dry-run reports the plan without moving anything', async () => {
    makeSkill('keep');
    const res = await retireSkill({ name: 'keep', skillsDir, dryRun: true });
    expect(res.ok).toBe(true);
    expect(res.planned).toBe(true);
    expect(existsSync(join(skillsDir, 'keep'))).toBe(true);
    expect(existsSync(join(root, '.claude', 'skills-retired', 'keep'))).toBe(false);
  });

  it('rejects a path-traversal name', async () => {
    const res = await retireSkill({ name: '../evil', skillsDir });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/unsafe skill name/);
  });

  it('errors on a missing skill', async () => {
    const res = await retireSkill({ name: 'ghost', skillsDir });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no such skill/);
  });

  it('refuses to retire twice (dest already exists)', async () => {
    makeSkill('dup', { updated: '2026-01-01' });
    expect((await retireSkill({ name: 'dup', skillsDir })).ok).toBe(true);
    makeSkill('dup', { updated: '2026-01-01' }); // recreate an active one
    const again = await retireSkill({ name: 'dup', skillsDir });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already retired/);
  });
});

describe('restoreSkill', () => {
  it('round-trips a retired skill back into the auto-load path and re-activates it', async () => {
    makeSkill('come-back', { updated: '2026-01-01' });
    await retireSkill({ name: 'come-back', skillsDir, reason: 'oops', now: () => new Date('2026-07-12') });
    const res = await restoreSkill({ name: 'come-back', skillsDir, now: () => new Date('2026-07-13') });

    expect(res.ok).toBe(true);
    expect(existsSync(join(skillsDir, 'come-back', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(root, '.claude', 'skills-retired', 'come-back'))).toBe(false);
    const md = readFileSync(join(skillsDir, 'come-back', 'SKILL.md'), 'utf8');
    expect(md).toContain('status: active');
    expect(md).not.toContain('retire_reason:');
    expect(md).not.toContain('retired:');
  });

  it('errors when there is no retired skill by that name', async () => {
    const res = await restoreSkill({ name: 'nothing', skillsDir });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/no retired skill/);
  });
});

describe('selectRetireCandidates', () => {
  const entry = (name: string, status: string, ageDays: number | null): SkillInventoryEntry => ({
    name, path: `/x/${name}/SKILL.md`, status: status as SkillInventoryEntry['status'], updated: null, ageDays, deprecatedBy: null,
  });

  it('flags only measured-zero active skills past grace, oldest first', () => {
    const entries = [
      entry('old-unused', 'active', 200),   // measured 0, old -> candidate
      entry('older-unused', 'active', 400),  // measured 0, older -> candidate (ranks first)
      entry('used', 'active', 300),          // measured 9 -> not
      entry('never-measured', 'active', 300),// undefined -> not (false-positive guard)
      entry('fresh', 'active', 5),           // in grace -> not
      entry('already-retired', 'retired', 500), // not active -> skipped
    ];
    const activation = new Map<string, number | undefined>([
      ['old-unused', 0], ['older-unused', 0], ['used', 9], ['fresh', 0],
      // 'never-measured' intentionally absent -> undefined
    ]);
    const got: RetireCandidate[] = selectRetireCandidates(entries, activation);
    expect(got.map((c) => c.name)).toEqual(['older-unused', 'old-unused']);
  });
});

describe('buildRetireCandidates', () => {
  it('returns no candidates when nothing is measured (never-measured guard)', async () => {
    makeSkill('a', { updated: '2026-01-01' });
    makeSkill('b', { updated: '2026-01-01' });
    // No .skill-index.json with activation counts -> all undefined -> none flagged.
    const got = await buildRetireCandidates({ skillsDir, now: () => new Date('2026-07-12') });
    expect(got).toEqual([]);
  });
});
