import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  parseDogfoodArgs,
  resolveRun,
  extractSkillUpdates,
  extractRefineInput,
  dogfoodCommand,
} from './dogfood.js';
import type { SkillUpdate } from '../../dogfood/refinement/types.js';
import type { LearnedConcept } from '../../dogfood/learning/types.js';
import type { GapRecord } from '../../dogfood/verification/types.js';

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
    // Expected values are composed with the same path primitives as the
    // implementation so the assertions hold on POSIX and Windows alike
    // (join yields OS-native separators).
    const r = resolveRun('my-run', { cwd: '/work' });
    const runDir = join('/work', '.dogfood', 'runs', 'my-run');
    expect(r.runDir).toBe(runDir);
    expect(r.inputFile).toBe(join(runDir, 'skill-updates.json'));
    expect(r.draftsDir).toBe(join(runDir, 'drafts'));
  });

  it('treats a path-like run as a directory', () => {
    const r = resolveRun('./out/refine', { cwd: '/work' });
    expect(r.runDir).toBe(resolve('/work', './out/refine'));
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

function makeConcept(overrides: Partial<LearnedConcept>): LearnedConcept {
  return {
    id: 'c1',
    name: 'Koopman Operator',
    sourceChunk: 'chunk-1',
    sourceChapter: 7,
    sourcePart: 3,
    theta: 0.5,
    radius: 0.9,
    angularVelocity: 0.1,
    definition: 'A linear operator advancing observables of a nonlinear system.',
    keyRelationships: ['dynamic mode decomposition'],
    prerequisites: [],
    applications: ['forecasting'],
    ecosystemMappings: [],
    confidence: 0.9,
    mathDensity: 0.5,
    abstractionLevel: 3,
    detectedAt: '2026-07-12T00:00:00.000Z',
    ...overrides,
  };
}

function makeGap(overrides: Partial<GapRecord>): GapRecord {
  return {
    id: 'g1',
    type: 'missing-in-ecosystem',
    severity: 'significant',
    concept: 'Koopman Operator',
    textbookSource: 'ch7',
    ecosystemSource: '',
    textbookClaim: '',
    ecosystemClaim: '',
    analysis: '',
    suggestedResolution: '',
    affectsComponents: [],
    ...overrides,
  };
}

describe('extractRefineInput', () => {
  it('reads concepts and gaps', () => {
    const r = extractRefineInput({ concepts: [makeConcept({})], gaps: [makeGap({})] });
    expect(r.concepts).toHaveLength(1);
    expect(r.gaps).toHaveLength(1);
  });

  it('defaults gaps to an empty array', () => {
    const r = extractRefineInput({ concepts: [makeConcept({})] });
    expect(r.gaps).toEqual([]);
  });

  it('throws when concepts is missing', () => {
    expect(() => extractRefineInput({ gaps: [] })).toThrow();
  });
});

describe('dogfoodCommand refine', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'dogfood-refine-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes skill-updates.json that promote then consumes to stage a draft', async () => {
    const sourceFile = join(dir, 'concepts.json');
    writeFileSync(
      sourceFile,
      JSON.stringify({ concepts: [makeConcept({})], gaps: [makeGap({})] }),
    );

    const cwd = process.cwd();
    process.chdir(dir);
    try {
      const refineCode = await dogfoodCommand(['refine', 'r1', '--input', 'concepts.json']);
      expect(refineCode).toBe(0);

      const runDir = join(dir, '.dogfood', 'runs', 'r1');
      expect(existsSync(join(runDir, 'skill-updates.json'))).toBe(true);

      const promoteCode = await dogfoodCommand(['promote', 'r1']);
      expect(promoteCode).toBe(0);
      expect(existsSync(join(runDir, 'drafts', 'koopman-operator', 'SKILL.md'))).toBe(true);
    } finally {
      process.chdir(cwd);
    }
  });

  it('errors without --input', async () => {
    const code = await dogfoodCommand(['refine', 'r1']);
    expect(code).toBe(1);
  });

  it('errors when the refine source is missing', async () => {
    const code = await dogfoodCommand(['refine', 'r1', '--input', 'nope.json']);
    expect(code).toBe(1);
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
