import { describe, it, expect } from 'vitest';
import {
  extractTriggerTerms,
  checkCoverage,
  assertActivationEquivalence,
} from '../activation-equivalence.js';

describe('extractTriggerTerms', () => {
  it('drops stopwords and short tokens', () => {
    const terms = extractTriggerTerms('this is a skill for the git commit workflow');
    expect(terms).toContain('skill');
    expect(terms).toContain('git');
    expect(terms).toContain('commit');
    expect(terms).toContain('workflow');
    expect(terms).not.toContain('the');
    expect(terms).not.toContain('is');
  });

  it('dedupes repeated terms', () => {
    const terms = extractTriggerTerms('commit commit commit');
    expect(terms).toEqual(['commit']);
  });

  it('lowercases', () => {
    const terms = extractTriggerTerms('Beautiful COMMITS with Git');
    expect(terms).toContain('beautiful');
    expect(terms).toContain('commits');
    expect(terms).toContain('git');
  });
});

describe('checkCoverage', () => {
  it('reports covered=true when every source term appears in merged', () => {
    const src = { name: 'a', description: 'git commit workflow' };
    const merged = { name: 'z', description: 'unified git commit workflow helper' };
    const r = checkCoverage(src, merged);
    expect(r.covered).toBe(true);
    expect(r.missing).toEqual([]);
  });

  it('reports missing terms when merged drops coverage', () => {
    const src = { name: 'a', description: 'beautiful git commit' };
    const merged = { name: 'z', description: 'git workflow' };
    const r = checkCoverage(src, merged);
    expect(r.covered).toBe(false);
    expect(r.missing).toContain('beautiful');
    expect(r.missing).toContain('commit');
  });
});

describe('assertActivationEquivalence', () => {
  it('returns results for all sources when coverage holds', () => {
    const sources = [
      { name: 'a', description: 'git commit' },
      { name: 'b', description: 'beautiful commits' },
    ];
    const merged = { name: 'commit-style', description: 'beautiful git commit and commits styling' };
    const results = assertActivationEquivalence(sources, merged);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.covered)).toBe(true);
  });

  it('throws with detail when any source is uncovered', () => {
    const sources = [
      { name: 'a', description: 'beautiful commit' },
      { name: 'b', description: 'dispatch workflow' },
    ];
    const merged = { name: 'bad', description: 'commit workflow' };
    expect(() => assertActivationEquivalence(sources, merged)).toThrow(/Activation equivalence/);
  });
});
