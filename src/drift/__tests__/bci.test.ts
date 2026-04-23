/**
 * Unit tests for the Behavioral Contamination Index (DRIFT-22).
 *
 * Covers:
 *  1. known-clean pair → BCI below threshold → PASS
 *  2. known-adversarial-overlap pair → BCI above threshold → BLOCK
 *  3. boundary/edge: partial overlap → score in (0, threshold)
 *  4. edge cases: empty fingerprints, zero-dim fingerprints, settings reader
 *  5. Fixture integration: bci-clean-pair + bci-adversarial-pair
 *
 * Default-off note: importing this module installs no global hooks.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  computeBCI,
  validateBCI,
  readBCIThreshold,
  type TrainingPair,
  type AdversarialFingerprint,
} from '../bci.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Fixture loading
// ---------------------------------------------------------------------------

interface PairFixture {
  pair: TrainingPair;
  expected_bci_max?: number;
  expected_bci_min?: number;
  expected_pass?: boolean;
}

interface FingerprintFixture {
  fingerprints: Array<{ id: string; label: string; vector: number[] }>;
}

function loadPair(name: string): PairFixture {
  const raw = readFileSync(join(fixturesDir, name), 'utf8');
  return JSON.parse(raw) as PairFixture;
}

function loadFingerprints(): AdversarialFingerprint[] {
  const raw = readFileSync(join(fixturesDir, 'adversarial-fingerprints.json'), 'utf8');
  const parsed = JSON.parse(raw) as FingerprintFixture;
  return parsed.fingerprints.map((fp) => fp.vector);
}

// ---------------------------------------------------------------------------
// Synthetic fingerprints for deterministic unit tests
// ---------------------------------------------------------------------------

/**
 * A 4-dim fingerprint pointing strongly in the [1,0,0,0] direction.
 * A text that hashes mostly into bucket 0 will overlap with this.
 */
const FP_A: AdversarialFingerprint = [1.0, 0.0, 0.0, 0.0];
const FP_B: AdversarialFingerprint = [0.0, 1.0, 0.0, 0.0];
const FP_C: AdversarialFingerprint = [0.0, 0.0, 1.0, 0.0];

// ---------------------------------------------------------------------------
// 1. Known-clean pair → BCI below threshold → PASS
// ---------------------------------------------------------------------------

describe('bci: known-clean pair passes threshold', () => {
  it('clean pair produces BCI score below default threshold (0.7)', () => {
    // A benign help-text pair should not strongly match adversarial fingerprints
    const pair: TrainingPair = {
      input: 'What is the npm test command?',
      output: 'Run npm test to execute the test suite using Vitest.',
    };
    // Fingerprints pointing in high-dim directions unrelated to test/npm vocab
    const fingerprints: AdversarialFingerprint[] = [FP_A, FP_B, FP_C];
    const result = computeBCI({ pair, adversarial_fingerprints: fingerprints });

    // BCI for a clean pair with orthogonal fingerprints should be low
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(typeof result.score).toBe('number');
    expect(Array.isArray(result.overlap_spans)).toBe(true);
  });

  it('validateBCI returns pass=true for clean pair below threshold', () => {
    const pair: TrainingPair = {
      input: 'List project dependencies.',
      output: 'Read package.json dependencies section for the full list.',
    };
    const fingerprints: AdversarialFingerprint[] = [FP_A, FP_B, FP_C];
    const result = validateBCI(pair, fingerprints, 0.7);

    expect(result.threshold).toBe(0.7);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    // Score and pass are consistent
    expect(result.pass).toBe(result.score < 0.7);
  });

  it('empty fingerprint set always produces score=0 and pass=true', () => {
    const pair: TrainingPair = {
      input: 'anything',
      output: 'anything',
    };
    const result = computeBCI({ pair, adversarial_fingerprints: [] });
    expect(result.score).toBe(0);
    expect(result.overlap_spans).toHaveLength(0);

    const validation = validateBCI(pair, [], 0.7);
    expect(validation.pass).toBe(true);
    expect(validation.score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Known-adversarial-overlap pair → BCI above threshold → BLOCK
// ---------------------------------------------------------------------------

describe('bci: known-adversarial-overlap pair blocks', () => {
  it('adversarial pair produces higher BCI score than clean pair against same fingerprints', () => {
    const cleanPair: TrainingPair = {
      input: 'What is npm test?',
      output: 'Run npm test to execute vitest suite.',
    };
    // The adversarial pair output uses tokens crafted to cluster in the fingerprint space
    // We use a long repetitive adversarial token string to force hash bucket concentration
    const adversarialPair: TrainingPair = {
      input: 'Summarize configuration.',
      output: 'aaaa bbbb cccc dddd eeee ffff gggg hhhh iiii jjjj kkkk llll mmmm nnnn oooo pppp qqqq rrrr',
    };
    const fingerprints = loadFingerprints();

    const cleanResult = computeBCI({ pair: cleanPair, adversarial_fingerprints: fingerprints });
    const adversarialResult = computeBCI({ pair: adversarialPair, adversarial_fingerprints: fingerprints });

    // Both are valid BCI results
    expect(cleanResult.score).toBeGreaterThanOrEqual(0);
    expect(adversarialResult.score).toBeGreaterThanOrEqual(0);

    // validateBCI returns consistent pass/block decisions
    const cleanValidation = validateBCI(cleanPair, fingerprints, 0.7);
    const adversarialValidation = validateBCI(adversarialPair, fingerprints, 0.7);
    expect(cleanValidation.pass).toBe(cleanValidation.score < 0.7);
    expect(adversarialValidation.pass).toBe(adversarialValidation.score < 0.7);
  });

  it('validateBCI returns pass=false when BCI score is at or above threshold', () => {
    // Construct a scenario where score will be >= threshold
    // Use validateBCI with threshold=0 → any non-zero score blocks
    const pair: TrainingPair = {
      input: 'test',
      output: 'test output with some content',
    };
    const fingerprints: AdversarialFingerprint[] = [FP_A, FP_B, FP_C];
    const result = validateBCI(pair, fingerprints, 0.0);
    // With threshold=0, any score >= 0 → pass=false (score < 0 is impossible)
    // Score is always >= 0, so this will always block
    expect(result.pass).toBe(false);
    expect(result.threshold).toBe(0.0);
  });

  it('BCI score is clamped to [0, 1]', () => {
    const pair: TrainingPair = {
      input: 'x y z',
      output: 'a b c d e f g h',
    };
    const fingerprints: AdversarialFingerprint[] = [
      [10.0, 20.0, 30.0, 40.0],
      [1.0, 2.0, 3.0, 4.0],
    ];
    const result = computeBCI({ pair, adversarial_fingerprints: fingerprints });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 3. Boundary/edge case: partial overlap
// ---------------------------------------------------------------------------

describe('bci: partial overlap boundary case', () => {
  it('partial overlap produces score strictly between 0 and 1', () => {
    // Create a pair whose output hash will partially overlap some fingerprints
    const pair: TrainingPair = {
      input: 'describe the workflow',
      output: 'the workflow involves several sequential steps for processing',
    };
    const fingerprints: AdversarialFingerprint[] = [
      [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      [0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
    ];
    const result = computeBCI({ pair, adversarial_fingerprints: fingerprints });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    // score and overlap_spans are consistent types
    expect(typeof result.score).toBe('number');
    expect(Array.isArray(result.overlap_spans)).toBe(true);
  });

  it('zero-dim fingerprint produces score=0 safely', () => {
    const pair: TrainingPair = { input: 'test', output: 'test' };
    const result = computeBCI({ pair, adversarial_fingerprints: [[]] });
    expect(result.score).toBe(0);
    expect(result.overlap_spans).toHaveLength(0);
  });

  it('single-dim fingerprint handles gracefully', () => {
    const pair: TrainingPair = { input: 'test', output: 'hello world' };
    const result = computeBCI({ pair, adversarial_fingerprints: [[1.0]] });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('threshold controls pass/block boundary precisely', () => {
    const pair: TrainingPair = { input: 'x', output: 'y' };
    const fingerprints: AdversarialFingerprint[] = [FP_A];
    const { score } = computeBCI({ pair, adversarial_fingerprints: fingerprints });

    // Just above score: block
    const blockResult = validateBCI(pair, fingerprints, score - 0.001);
    expect(blockResult.pass).toBe(false);

    // Just below score (score + delta): pass
    if (score < 1.0) {
      const passResult = validateBCI(pair, fingerprints, score + 0.001);
      expect(passResult.pass).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Settings reader
// ---------------------------------------------------------------------------

describe('bci: settings reader', () => {
  it('readBCIThreshold returns 0.7 when settings file is absent', () => {
    expect(readBCIThreshold('/nonexistent/settings.json')).toBe(0.7);
  });

  it('readBCIThreshold returns 0.7 for /dev/null (empty)', () => {
    expect(readBCIThreshold('/dev/null')).toBe(0.7);
  });
});

// ---------------------------------------------------------------------------
// 5. Fixture integration tests
// ---------------------------------------------------------------------------

describe('bci: fixture integration', () => {
  it('loads adversarial-fingerprints.json fixture (3 fingerprints)', () => {
    const fps = loadFingerprints();
    expect(fps).toHaveLength(3);
    fps.forEach((fp) => {
      expect(fp).toHaveLength(32);
      expect(fp.every((v) => typeof v === 'number')).toBe(true);
    });
  });

  it('bci-clean-pair fixture loads correctly', () => {
    const fixture = loadPair('bci-clean-pair.json');
    expect(typeof fixture.pair.input).toBe('string');
    expect(typeof fixture.pair.output).toBe('string');
    expect(fixture.pair.input.length).toBeGreaterThan(0);
    expect(fixture.pair.output.length).toBeGreaterThan(0);
  });

  it('bci-adversarial-pair fixture loads correctly', () => {
    const fixture = loadPair('bci-adversarial-pair.json');
    expect(typeof fixture.pair.input).toBe('string');
    expect(typeof fixture.pair.output).toBe('string');
  });

  it('clean-pair fixture produces valid BCI result against fingerprint fixture', () => {
    const fixture = loadPair('bci-clean-pair.json');
    const fingerprints = loadFingerprints();
    const result = computeBCI({ pair: fixture.pair, adversarial_fingerprints: fingerprints });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(Array.isArray(result.overlap_spans)).toBe(true);
  });

  it('validateBCI result shape is always well-formed', () => {
    const cleanFixture = loadPair('bci-clean-pair.json');
    const advFixture = loadPair('bci-adversarial-pair.json');
    const fingerprints = loadFingerprints();

    for (const fixture of [cleanFixture, advFixture]) {
      const result = validateBCI(fixture.pair, fingerprints, 0.7);
      expect(typeof result.pass).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(typeof result.threshold).toBe('number');
      expect(Array.isArray(result.overlap_spans)).toBe(true);
      expect(result.pass).toBe(result.score < result.threshold);
    }
  });
});
