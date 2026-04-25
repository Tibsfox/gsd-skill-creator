/**
 * HB-05 structural-completeness linter — main test suite.
 *
 * Exercises each of the five principles with at least one positive
 * inline assertion and one negative inline assertion, plus the on-disk
 * fixture corpus (3 positive + 3 negative).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRINCIPLES,
  checkStructuralCompleteness,
} from '../index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), 'utf8');
}

describe('checkStructuralCompleteness — per-principle', () => {
  describe('Principle 1: computability-grounding', () => {
    it('flags computational claim without complexity grounding', () => {
      const md = '# Skill\n\nThis runs an algorithm to compute results.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['computability-grounding'].satisfied).toBe(false);
    });

    it('passes when complexity is grounded', () => {
      const md = '# Skill\n\nAlgorithm with complexity O(n log n); decidable.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['computability-grounding'].satisfied).toBe(true);
    });

    it('vacuously passes when no algorithmic claim is made (default)', () => {
      const md = '# Skill\n\nA description.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['computability-grounding'].satisfied).toBe(true);
    });
  });

  describe('Principle 2: proof-theoretic-structure', () => {
    it('flags deductive claim without proof structure', () => {
      const md = '# Skill\n\nWe prove that the input always meets the requirement.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['proof-theoretic-structure'].satisfied).toBe(false);
    });

    it('passes with explicit if/then plus invariant', () => {
      const md = '# Skill\n\nIf precondition holds then postcondition is established. Invariant maintained.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['proof-theoretic-structure'].satisfied).toBe(true);
    });
  });

  describe('Principle 3: bayesian-epistemology', () => {
    it('flags uncertainty claim without Bayesian framing', () => {
      const md = '# Skill\n\nThe answer is uncertain; maybe wrong; perhaps a guess.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['bayesian-epistemology'].satisfied).toBe(false);
    });

    it('passes with posterior + confidence interval', () => {
      const md = '# Skill\n\nWe report a Bayesian posterior with 95% confidence interval over the likelihood.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['bayesian-epistemology'].satisfied).toBe(true);
    });
  });

  describe('Principle 4: data-classification', () => {
    it('flags data-handling without classification', () => {
      const md = '# Skill\n\nReads input data and writes output records to a file.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['data-classification'].satisfied).toBe(false);
    });

    it('passes with explicit classification', () => {
      const md = '# Skill\n\nReads data classified as **public** or **internal**; PII redacted; GDPR compliant.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['data-classification'].satisfied).toBe(true);
    });
  });

  describe('Principle 5: assessment-rubric', () => {
    it('flags quality claim without rubric', () => {
      const md = '# Skill\n\nThe output should be good and correct; success is the goal.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['assessment-rubric'].satisfied).toBe(false);
    });

    it('passes with explicit rubric / criteria', () => {
      const md = '# Skill\n\nQuality assessed via rubric: passes if metric ≥ 0.95; acceptance criteria documented.';
      const r = checkStructuralCompleteness(md, 'inline.md');
      expect(r.principleResults['assessment-rubric'].satisfied).toBe(true);
    });
  });
});

describe('checkStructuralCompleteness — fixture corpus', () => {
  for (const name of [
    'positive-1-full-coverage.md',
    'positive-2-full-coverage.md',
    'positive-3-full-coverage.md',
  ]) {
    it(`positive fixture passes all five principles: ${name}`, () => {
      const md = loadFixture(name);
      const r = checkStructuralCompleteness(md, name);
      const failing = PRINCIPLES.filter(
        (p) => !r.principleResults[p].satisfied,
      ).map((p) => `${p}: ${r.principleResults[p].rationale}`);
      expect(failing, `Positive fixture ${name} should pass all principles`).toEqual([]);
      expect(r.passed).toBe(true);
      expect(r.overallScore).toBe(5);
    });
  }

  it('negative-1 fails ONLY computability-grounding', () => {
    const md = loadFixture('negative-1-missing-computability.md');
    const r = checkStructuralCompleteness(md, 'negative-1.md');
    expect(r.passed).toBe(false);
    expect(r.principleResults['computability-grounding'].satisfied).toBe(false);
    expect(r.principleResults['proof-theoretic-structure'].satisfied).toBe(true);
    expect(r.principleResults['bayesian-epistemology'].satisfied).toBe(true);
    expect(r.principleResults['data-classification'].satisfied).toBe(true);
    expect(r.principleResults['assessment-rubric'].satisfied).toBe(true);
    expect(r.overallScore).toBe(4);
  });

  it('negative-2 fails ONLY bayesian-epistemology', () => {
    const md = loadFixture('negative-2-missing-bayesian.md');
    const r = checkStructuralCompleteness(md, 'negative-2.md');
    expect(r.passed).toBe(false);
    expect(r.principleResults['bayesian-epistemology'].satisfied).toBe(false);
    expect(r.principleResults['computability-grounding'].satisfied).toBe(true);
    expect(r.principleResults['proof-theoretic-structure'].satisfied).toBe(true);
    expect(r.principleResults['data-classification'].satisfied).toBe(true);
    expect(r.principleResults['assessment-rubric'].satisfied).toBe(true);
    expect(r.overallScore).toBe(4);
  });

  it('negative-3 fails ONLY assessment-rubric', () => {
    const md = loadFixture('negative-3-missing-rubric.md');
    const r = checkStructuralCompleteness(md, 'negative-3.md');
    expect(r.passed).toBe(false);
    expect(r.principleResults['assessment-rubric'].satisfied).toBe(false);
    expect(r.principleResults['computability-grounding'].satisfied).toBe(true);
    expect(r.principleResults['proof-theoretic-structure'].satisfied).toBe(true);
    expect(r.principleResults['bayesian-epistemology'].satisfied).toBe(true);
    expect(r.principleResults['data-classification'].satisfied).toBe(true);
    expect(r.overallScore).toBe(4);
  });
});

describe('checkStructuralCompleteness — result shape', () => {
  it('always returns 5 principle results', () => {
    const r = checkStructuralCompleteness('', 'empty.md');
    expect(Object.keys(r.principleResults).sort()).toEqual([...PRINCIPLES].sort());
  });

  it('preserves filePath in result', () => {
    const r = checkStructuralCompleteness('hello', 'some/path/SKILL.md');
    expect(r.filePath).toBe('some/path/SKILL.md');
  });

  it('handles empty input gracefully (vacuously passes everything in default mode)', () => {
    const r = checkStructuralCompleteness('', 'empty.md');
    expect(r.passed).toBe(true);
    expect(r.overallScore).toBe(5);
  });
});
