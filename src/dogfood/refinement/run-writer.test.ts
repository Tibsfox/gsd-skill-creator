import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleRefinementResult, writeRefinementRun, SKILL_UPDATES_FILENAME } from './run-writer.js';
import type { LearnedConcept } from '../learning/types.js';
import type { GapRecord } from '../verification/types.js';

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

describe('assembleRefinementResult', () => {
  it('folds refineSkills output into a RefinementResult with statistics', () => {
    const gaps = [makeGap({})];
    const result = assembleRefinementResult([makeConcept({})], gaps);

    expect(result.skillUpdates).toHaveLength(1);
    expect(result.skillUpdates[0]!.action).toBe('create');
    expect(result.patches).toEqual([]);
    expect(result.tickets).toEqual([]);
    expect(result.statistics.skillsUpdated).toBe(1);
    expect(result.statistics.gapsProcessed).toBe(1);
  });

  it('produces an empty update set when no concept is eligible', () => {
    const result = assembleRefinementResult([makeConcept({ confidence: 0.1 })], []);
    expect(result.skillUpdates).toHaveLength(0);
    expect(result.statistics.skillsUpdated).toBe(0);
  });
});

describe('writeRefinementRun', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'run-writer-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('creates the run directory and writes skill-updates.json', () => {
    const runDir = join(dir, 'runs', 'r1');
    const result = assembleRefinementResult([makeConcept({})], [makeGap({})]);
    const file = writeRefinementRun(runDir, result);

    expect(file).toBe(join(runDir, SKILL_UPDATES_FILENAME));
    expect(existsSync(file)).toBe(true);

    const roundTrip = JSON.parse(readFileSync(file, 'utf8'));
    expect(roundTrip.skillUpdates).toHaveLength(1);
    expect(roundTrip.statistics.skillsUpdated).toBe(1);
  });
});
