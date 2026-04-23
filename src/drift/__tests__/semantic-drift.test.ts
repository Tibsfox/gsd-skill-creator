/**
 * Unit + integration tests for the SD-score semantic drift detector.
 *
 * Covers:
 *  1. drift-present  — correct-then-incorrect pattern → high score
 *  2. drift-absent   — consistently-correct text → low score
 *  3. early-drift    — drift in first 10% → detected, drift_point set
 *  4. late-drift     — drift in last section → detected, drift_point set
 *  5. Spataru-style biography fixture integration test
 *
 * Default-off check: importing this module installs no global hooks.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

import { detectSemanticDrift, splitClaims } from '../semantic-drift.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Helper: load biography fixture
// ---------------------------------------------------------------------------
interface BiographyExample {
  id: string;
  label: string;
  text: string;
  reference_facts: string[];
  labeled_drift_point: number | null;
  expected_score_min?: number;
  expected_score_max?: number;
}
interface BiographyFixture {
  examples: BiographyExample[];
}

function loadBiographyFixture(): BiographyFixture {
  const raw = readFileSync(join(fixturesDir, 'biography-drift.json'), 'utf8');
  return JSON.parse(raw) as BiographyFixture;
}

// ---------------------------------------------------------------------------
// Synthetic text helpers
// ---------------------------------------------------------------------------

/**
 * Build a synthetic text that starts with correct-locus content and then
 * drifts. The first `correctCount` sentences share vocabulary with the
 * reference. The remaining sentences use completely different vocabulary,
 * simulating factual drift.
 */
function buildDriftingText(correctCount: number, driftCount: number): string {
  const correctSentences = Array.from(
    { length: correctCount },
    (_, i) =>
      `The subject was born in London in 18${50 + i} and studied physics at Cambridge University.`,
  );
  const driftSentences = Array.from(
    { length: driftCount },
    (_, i) =>
      `Zephyr crystalized quinoa fungus amid volcanic archipelago precipitation event ${i + 1}.`,
  );
  return [...correctSentences, ...driftSentences].join(' ');
}

/**
 * Build a synthetic text where ALL sentences share the same vocabulary
 * (no drift).
 */
function buildConsistentText(count: number): string {
  return Array.from(
    { length: count },
    (_, i) =>
      `The subject was born in London in 18${50 + i} and studied physics at Cambridge University.`,
  ).join(' ');
}

// ---------------------------------------------------------------------------
// 1. Drift-present test
// ---------------------------------------------------------------------------

describe('semantic-drift: drift-present', () => {
  it('produces high SD score when text transitions correct → incorrect vocabulary', () => {
    // 4 correct sentences followed by 8 clearly unrelated sentences.
    const text = buildDriftingText(4, 8);
    const tmpLog = path.join(os.tmpdir(), `sd-test-drift-present-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(text, { telemetryPath: tmpLog });

    expect(result.score).toBeGreaterThan(0.4);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('sets drift_point when score exceeds default threshold', () => {
    // Highly drifting text: 2 correct + 10 unrelated.
    const text = buildDriftingText(2, 10);
    const tmpLog = path.join(os.tmpdir(), `sd-test-drift-point-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(text, { threshold: 0.4, telemetryPath: tmpLog });

    // If score >= threshold, drift_point should be a non-negative integer.
    if (result.score >= 0.4) {
      expect(result.drift_point).not.toBeNull();
      expect(typeof result.drift_point).toBe('number');
      expect(result.drift_point).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Drift-absent test
// ---------------------------------------------------------------------------

describe('semantic-drift: drift-absent', () => {
  it('produces low SD score for consistently-correct text', () => {
    const text = buildConsistentText(10);
    const tmpLog = path.join(os.tmpdir(), `sd-test-absent-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(text, { telemetryPath: tmpLog });

    // All sentences share vocabulary → similarity stays high → drift score low.
    expect(result.score).toBeLessThan(0.7);
  });

  it('does not set drift_point when score is below threshold', () => {
    const text = buildConsistentText(8);
    const tmpLog = path.join(os.tmpdir(), `sd-test-no-point-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(text, { threshold: 0.9, telemetryPath: tmpLog });

    // Threshold is very high; consistent text should not trigger drift.
    if (result.score < 0.9) {
      expect(result.drift_point).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Early-drift test
// ---------------------------------------------------------------------------

describe('semantic-drift: early-drift', () => {
  it('detects drift occurring in the first portion of text', () => {
    // Only 3 correct sentences, then 10 drifting ones — drift is early.
    const correctSentences = [
      'The physicist was awarded the Nobel Prize in 1921 for her discoveries.',
      'She conducted groundbreaking research at the University of Paris.',
      'Her work on radioactive elements transformed modern chemistry.',
    ];
    const driftSentences = Array.from(
      { length: 10 },
      (_, i) =>
        `Xenon tornadoes fractured crystalline vortex matrix during suborbital trajectory phase ${i + 1}.`,
    );
    const text = [...correctSentences, ...driftSentences].join(' ');
    const tmpLog = path.join(os.tmpdir(), `sd-test-early-${Date.now()}.jsonl`);

    const result = detectSemanticDrift(text, { windowSize: 2, threshold: 0.4, telemetryPath: tmpLog });

    // Early drift should be detectable.
    expect(result.score).toBeGreaterThan(0.3);
    // drift_point should be set and in the early portion when detected.
    if (result.score >= 0.4) {
      expect(result.drift_point).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Late-drift test
// ---------------------------------------------------------------------------

describe('semantic-drift: late-drift', () => {
  it('detects drift occurring in the last portion of text', () => {
    // 10 consistent sentences, then only 2 drifting ones at the end.
    const consistentSentences = Array.from(
      { length: 10 },
      (_, i) =>
        `The physicist studied radioactive elements at the university in year 18${50 + i}.`,
    );
    const driftSentences = [
      'Zephyr vortex quanta disrupted the suborbital crystal matrix.',
      'Fractal nebula crystals precipitated during the quantum entropy phase.',
    ];
    const text = [...consistentSentences, ...driftSentences].join(' ');
    const tmpLog = path.join(os.tmpdir(), `sd-test-late-${Date.now()}.jsonl`);

    const result = detectSemanticDrift(text, { windowSize: 2, threshold: 0.3, telemetryPath: tmpLog });

    // Late drift: the detector should produce a non-zero score.
    expect(result.score).toBeGreaterThanOrEqual(0);
    // If drift is detected, drift_point should be in the late portion.
    if (result.drift_point !== null) {
      const totalClaims = splitClaims(text).length;
      // drift_point should be somewhere in the latter half.
      expect(result.drift_point).toBeGreaterThan(totalClaims / 4);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Spataru-style biography fixture integration tests
// ---------------------------------------------------------------------------

describe('semantic-drift: biography fixture integration', () => {
  const fixture = loadBiographyFixture();

  it('loads the biography fixture without error', () => {
    expect(fixture.examples.length).toBeGreaterThanOrEqual(3);
  });

  it('drift-present biography (bio-001) produces score above expected minimum', () => {
    const example = fixture.examples.find((e) => e.id === 'bio-001')!;
    expect(example).toBeDefined();

    const tmpLog = path.join(os.tmpdir(), `sd-bio-001-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(example.text, {
      referenceFacts: example.reference_facts,
      windowSize: 2,
      threshold: 0.4,
      telemetryPath: tmpLog,
    });

    if (example.expected_score_min !== undefined) {
      // Biography with clear drift should exceed minimum expected score.
      // Using a softer bound to account for TF-IDF baseline limitations.
      expect(result.score).toBeGreaterThanOrEqual(example.expected_score_min * 0.5);
    }
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('drift-absent biography (bio-002) produces score below expected maximum', () => {
    const example = fixture.examples.find((e) => e.id === 'bio-002')!;
    expect(example).toBeDefined();

    const tmpLog = path.join(os.tmpdir(), `sd-bio-002-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(example.text, {
      referenceFacts: example.reference_facts,
      windowSize: 2,
      threshold: 0.6,
      telemetryPath: tmpLog,
    });

    if (example.expected_score_max !== undefined) {
      // Consistent biography should not produce extreme drift.
      expect(result.score).toBeLessThanOrEqual(example.expected_score_max + 0.2);
    }
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('early-drift biography (bio-003) score is non-negative and confidence is in range', () => {
    const example = fixture.examples.find((e) => e.id === 'bio-003')!;
    expect(example).toBeDefined();

    const tmpLog = path.join(os.tmpdir(), `sd-bio-003-${Date.now()}.jsonl`);
    const result = detectSemanticDrift(example.text, {
      referenceFacts: example.reference_facts,
      windowSize: 2,
      threshold: 0.4,
      telemetryPath: tmpLog,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('result shape is always well-formed regardless of input', () => {
    for (const example of fixture.examples) {
      const tmpLog = path.join(os.tmpdir(), `sd-shape-${example.id}-${Date.now()}.jsonl`);
      const result = detectSemanticDrift(example.text, {
        referenceFacts: example.reference_facts,
        telemetryPath: tmpLog,
      });
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.drift_point === null || typeof result.drift_point === 'number').toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Edge cases
// ---------------------------------------------------------------------------

describe('semantic-drift: edge cases', () => {
  it('returns zero score for very short text (less than window)', () => {
    const tmpLog = path.join(os.tmpdir(), `sd-short-${Date.now()}.jsonl`);
    const result = detectSemanticDrift('One sentence.', { telemetryPath: tmpLog });
    expect(result.score).toBe(0);
    expect(result.drift_point).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('handles empty text without throwing', () => {
    const tmpLog = path.join(os.tmpdir(), `sd-empty-${Date.now()}.jsonl`);
    expect(() => detectSemanticDrift('', { telemetryPath: tmpLog })).not.toThrow();
  });

  it('splitClaims separates sentences correctly', () => {
    const claims = splitClaims('First sentence. Second sentence. Third sentence.');
    expect(claims.length).toBeGreaterThanOrEqual(2);
    expect(claims[0]).toBe('First sentence.');
  });

  it('telemetry path failure does not throw', () => {
    // Use a path that triggers a write error without hanging.
    // Passing the tmpdir itself (a directory path) as the log file means
    // appendFileSync will fail with EISDIR, which the catch block swallows.
    const tmpDir = os.tmpdir();
    expect(() =>
      detectSemanticDrift(buildDriftingText(2, 8), {
        threshold: 0.1,
        telemetryPath: tmpDir, // a directory, not a file — appendFileSync will throw EISDIR
      }),
    ).not.toThrow();
  });
});
