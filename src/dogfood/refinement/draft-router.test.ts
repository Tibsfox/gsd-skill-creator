import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { routeSkillUpdatesToDrafts } from './draft-router.js';
import type { SkillUpdate } from './types.js';

function makeUpdate(overrides: Partial<SkillUpdate>): SkillUpdate {
  return {
    id: 'skill-c1',
    skillName: 'Fourier Transform',
    action: 'create',
    proposedDefinition: 'Decomposes a signal into frequencies. Applications include filtering.',
    triggerPatterns: ['fourier transform', 'frequency domain'],
    complexPlanePosition: { theta: 0.5, radius: 0.9 },
    evidenceFromTextbook: 'Chapter 7',
    evidenceFromEcosystem: 'New knowledge - no ecosystem precedent',
    ...overrides,
  };
}

describe('routeSkillUpdatesToDrafts', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'draft-router-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('materializes a create update as a staged draft', () => {
    const out = join(dir, 'drafts');
    const res = routeSkillUpdatesToDrafts([makeUpdate({})], { outputDir: out });

    expect(res.staged).toHaveLength(1);
    expect(res.skipped).toHaveLength(0);
    const draft = res.staged[0]!;
    expect(draft.skillName).toBe('fourier-transform');
    expect(existsSync(draft.skillFile)).toBe(true);
    expect(existsSync(draft.manifestFile)).toBe(true);

    const skill = readFileSync(draft.skillFile, 'utf8');
    expect(skill).toContain('name: fourier-transform');
    expect(skill).toContain('theta: 0.5');
    expect(skill).toContain('radius: 0.9');
    expect(skill).toContain('fourier transform');
    expect(skill).toContain('Chapter 7');

    const manifest = JSON.parse(readFileSync(draft.manifestFile, 'utf8'));
    expect(manifest.action).toBe('create');
    expect(manifest.status).toBe('draft');
    expect(manifest.complexPlanePosition).toEqual({ theta: 0.5, radius: 0.9 });
    expect(manifest.triggerPatterns).toEqual(['fourier transform', 'frequency domain']);
  });

  it('skips refine/merge/annotate updates (proposed definitions, not scaffolds)', () => {
    const updates: SkillUpdate[] = [
      makeUpdate({ id: 'a', skillName: 'refine-me', action: 'refine' }),
      makeUpdate({ id: 'b', skillName: 'merge-me', action: 'merge' }),
      makeUpdate({ id: 'c', skillName: 'annotate-me', action: 'annotate' }),
    ];
    const res = routeSkillUpdatesToDrafts(updates, { outputDir: join(dir, 'drafts') });
    expect(res.staged).toHaveLength(0);
    expect(res.skipped.map((s) => s.action).sort()).toEqual(['annotate', 'merge', 'refine']);
    expect(existsSync(join(dir, 'drafts'))).toBe(false);
  });

  it('routes only the create updates in a mixed batch', () => {
    const updates: SkillUpdate[] = [
      makeUpdate({ id: 'a', skillName: 'new-one', action: 'create' }),
      makeUpdate({ id: 'b', skillName: 'refine-me', action: 'refine' }),
      makeUpdate({ id: 'c', skillName: 'another-new', action: 'create' }),
    ];
    const res = routeSkillUpdatesToDrafts(updates, { outputDir: join(dir, 'drafts') });
    expect(res.staged.map((s) => s.skillName).sort()).toEqual(['another-new', 'new-one']);
    expect(res.skipped).toHaveLength(1);
  });

  it('refuses to stage into the live .claude/skills path', () => {
    const live = join(dir, '.claude', 'skills');
    expect(() =>
      routeSkillUpdatesToDrafts([makeUpdate({})], { outputDir: live }),
    ).toThrow(/live skills path/);
    expect(existsSync(live)).toBe(false);
  });

  it('is idempotent — a re-run skips an already-staged draft', () => {
    const out = join(dir, 'drafts');
    const first = routeSkillUpdatesToDrafts([makeUpdate({})], { outputDir: out });
    expect(first.staged).toHaveLength(1);
    const second = routeSkillUpdatesToDrafts([makeUpdate({})], { outputDir: out });
    expect(second.staged).toHaveLength(0);
    expect(second.skipped[0]!.reason).toContain('already staged');
    expect(readdirSync(out)).toEqual(['fourier-transform']);
  });
});
