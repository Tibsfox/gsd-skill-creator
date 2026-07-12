import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseDogfoodArgs,
  resolveRun,
  extractSkillUpdates,
  dogfoodCommand,
} from './dogfood.js';
import type { SkillUpdate } from '../../dogfood/refinement/types.js';

function createUpdate(overrides: Partial<SkillUpdate>): SkillUpdate {
  return {
    id: 'skill-c1',
    skillName: 'New Concept',
    action: 'create',
    proposedDefinition: 'A brand new capability.',
    triggerPatterns: ['new concept'],
    complexPlanePosition: { theta: 0.1, radius: 0.2 },
    evidenceFromTextbook: 'Chapter 1',
    evidenceFromEcosystem: 'New knowledge - no ecosystem precedent',
    ...overrides,
  };
}

describe('parseDogfoodArgs', () => {
  it('reads the subcommand and positional run', () => {
    const r = parseDogfoodArgs(['promote', 'run-1']);
    expect(r.subcommand).toBe('promote');
    expect(r.positional).toEqual(['run-1']);
  });

  it('captures --input and --out in both forms', () => {
    const r = parseDogfoodArgs(['promote', 'r', '--input', 'a.json', '--out=drafts']);
    expect(r.input).toBe('a.json');
    expect(r.out).toBe('drafts');
    expect(r.positional).toEqual(['r']);
  });

  it('flags --json and --help', () => {
    const r = parseDogfoodArgs(['promote', 'r', '--json', '--help']);
    expect(r.json).toBe(true);
    expect(r.help).toBe(true);
  });
});

describe('resolveRun', () => {
  it('resolves a bare id under .dogfood/runs', () => {
    const r = resolveRun('my-run', { cwd: '/work' });
    expect(r.runDir).toBe('/work/.dogfood/runs/my-run');
    expect(r.inputFile).toBe('/work/.dogfood/runs/my-run/skill-updates.json');
    expect(r.draftsDir).toBe('/work/.dogfood/runs/my-run/drafts');
  });

  it('treats a path-like run as a directory', () => {
    const r = resolveRun('./out/refine', { cwd: '/work' });
    expect(r.runDir).toBe('/work/out/refine');
  });
});

describe('extractSkillUpdates', () => {
  it('reads a bare array', () => {
    const u = [createUpdate({})];
    expect(extractSkillUpdates(u)).toHaveLength(1);
  });

  it('reads a RefinementResult-shaped object', () => {
    expect(extractSkillUpdates({ skillUpdates: [createUpdate({})] })).toHaveLength(1);
  });

  it('throws on a malformed payload', () => {
    expect(() => extractSkillUpdates({ nope: true })).toThrow();
  });
});

describe('dogfoodCommand promote', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'dogfood-cli-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('stages create drafts from a run and leaves .claude/skills untouched', async () => {
    const runDir = join(dir, '.dogfood', 'runs', 'r1');
    mkdirSync(runDir, { recursive: true });
    const updates: SkillUpdate[] = [
      createUpdate({ id: 'a', skillName: 'Alpha Skill', action: 'create' }),
      createUpdate({ id: 'b', skillName: 'refine-me', action: 'refine' }),
    ];
    writeFileSync(join(runDir, 'skill-updates.json'), JSON.stringify({ skillUpdates: updates }));

    const cwd = process.cwd();
    process.chdir(dir);
    try {
      const code = await dogfoodCommand(['promote', 'r1']);
      expect(code).toBe(0);
    } finally {
      process.chdir(cwd);
    }

    expect(existsSync(join(runDir, 'drafts', 'alpha-skill', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(runDir, 'drafts', 'refine-me'))).toBe(false);
    expect(existsSync(join(dir, '.claude', 'skills'))).toBe(false);
  });

  it('errors when the run has no skill-updates source', async () => {
    const code = await dogfoodCommand(['promote', join(dir, 'missing')]);
    expect(code).toBe(1);
  });

  it('bare invocation prints help and exits 0', async () => {
    expect(await dogfoodCommand([])).toBe(0);
  });

  it('unknown subcommand exits 1', async () => {
    expect(await dogfoodCommand(['bogus'])).toBe(1);
  });
});
