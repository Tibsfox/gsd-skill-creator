/**
 * Integration tests for knowledge-drift mitigation hooks (DRIFT-19).
 *
 * Covers:
 *  1. flag-off default: input text = output text (byte-identical, golden-output fixture)
 *  2. flag-on early-stop: detected drift truncates text at drift_point
 *  3. flag-on rerank: candidates reordered by SD score ascending
 *
 * Settings flags are injected via `flagOverride` — no filesystem writes needed.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { earlyStopHook, rerankHook, readEarlyStopFlag, readRerankFlag } from '../knowledge-mitigations.js';
import type { SDResult } from '../semantic-drift.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '../__fixtures__');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface GoldenPair {
  id: string;
  description: string;
  input: string;
  expected_output: string;
}
interface GoldenFixture {
  flag_off_pairs: GoldenPair[];
}

function loadGoldenFixture(): GoldenFixture {
  const raw = readFileSync(join(fixturesDir, 'golden-output.json'), 'utf8');
  return JSON.parse(raw) as GoldenFixture;
}

// ---------------------------------------------------------------------------
// Helper SDResult factories
// ---------------------------------------------------------------------------

function sdResultWithDrift(score: number, driftPoint: number): SDResult {
  return { score, drift_point: driftPoint, confidence: score };
}

function sdResultNoDrift(score: number): SDResult {
  return { score, drift_point: null, confidence: score };
}

// ---------------------------------------------------------------------------
// 1. Flag-off default: byte-identity
// ---------------------------------------------------------------------------

describe('knowledge-mitigations: flag-off byte-identity', () => {
  const fixture = loadGoldenFixture();

  it('earlyStopHook is a no-op when flag is false (golden pairs)', () => {
    for (const pair of fixture.flag_off_pairs) {
      const result = earlyStopHook({
        text: pair.input,
        sdResult: sdResultWithDrift(0.9, 1), // high score, would truncate if enabled
        threshold: 0.6,
        flagOverride: false,
      });
      expect(result.text).toBe(pair.expected_output);
      expect(result.truncated).toBe(false);
      expect(result.truncated_at).toBeNull();
    }
  });

  it('rerankHook preserves original order when flag is false', () => {
    const candidates = [
      { text: 'high drift text', sdResult: sdResultNoDrift(0.9) },
      { text: 'medium drift text', sdResult: sdResultNoDrift(0.5) },
      { text: 'low drift text', sdResult: sdResultNoDrift(0.1) },
    ];

    const result = rerankHook({ candidates, flagOverride: false });
    expect(result.reranked).toBe(false);
    // Original order preserved byte-for-byte.
    expect(result.candidates.map((c) => c.text)).toEqual([
      'high drift text',
      'medium drift text',
      'low drift text',
    ]);
  });

  it('earlyStopHook default (no settingsPath, no flagOverride) returns no-op when settings absent', () => {
    // When settings file doesn't exist, flag defaults to false.
    const result = earlyStopHook({
      text: 'Some generated text here.',
      sdResult: sdResultWithDrift(0.9, 1),
      settingsPath: '/nonexistent/settings.json',
    });
    expect(result.text).toBe('Some generated text here.');
    expect(result.truncated).toBe(false);
  });

  it('rerankHook default (no settingsPath, no flagOverride) returns no-op when settings absent', () => {
    const candidates = [
      { text: 'a', sdResult: sdResultNoDrift(0.9) },
      { text: 'b', sdResult: sdResultNoDrift(0.1) },
    ];
    const result = rerankHook({ candidates, settingsPath: '/nonexistent/settings.json' });
    expect(result.reranked).toBe(false);
    expect(result.candidates.map((c) => c.text)).toEqual(['a', 'b']);
  });

  it('golden-output fixture loads correctly', () => {
    const fixture2 = loadGoldenFixture();
    expect(fixture2.flag_off_pairs.length).toBeGreaterThanOrEqual(3);
    for (const pair of fixture2.flag_off_pairs) {
      expect(pair.input).toBe(pair.expected_output);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Flag-on early-stop: truncates at drift_point
// ---------------------------------------------------------------------------

describe('knowledge-mitigations: early-stop enabled', () => {
  const multiSentenceText =
    'Ada Lovelace was born in 1815. She was daughter of Lord Byron. She worked with Babbage on the Analytical Engine. She wrote the first machine algorithm. Zephyr crystals precipitated during the entropy phase.';

  it('truncates text at drift_point when flag is true and score exceeds threshold', () => {
    const result = earlyStopHook({
      text: multiSentenceText,
      sdResult: sdResultWithDrift(0.8, 2),
      threshold: 0.6,
      flagOverride: true,
    });
    expect(result.truncated).toBe(true);
    expect(result.truncated_at).toBe(2);
    // Truncated text should be shorter than original.
    expect(result.text.length).toBeLessThan(multiSentenceText.length);
    // Should not contain the last sentences (drift part).
    expect(result.text).not.toContain('Zephyr');
  });

  it('does not truncate when score is below threshold even with flag on', () => {
    const result = earlyStopHook({
      text: multiSentenceText,
      sdResult: sdResultNoDrift(0.3),
      threshold: 0.6,
      flagOverride: true,
    });
    expect(result.truncated).toBe(false);
    expect(result.truncated_at).toBeNull();
    expect(result.text).toBe(multiSentenceText);
  });

  it('does not truncate when drift_point is null even with high score', () => {
    const result = earlyStopHook({
      text: multiSentenceText,
      sdResult: sdResultNoDrift(0.9),
      threshold: 0.6,
      flagOverride: true,
    });
    expect(result.truncated).toBe(false);
    expect(result.text).toBe(multiSentenceText);
  });

  it('truncated text consists of the first drift_point claims', () => {
    const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
    const result = earlyStopHook({
      text,
      sdResult: sdResultWithDrift(0.9, 2),
      threshold: 0.6,
      flagOverride: true,
    });
    expect(result.truncated).toBe(true);
    // Should contain first 2 claims only.
    expect(result.text).toContain('First sentence.');
    expect(result.text).toContain('Second sentence.');
    expect(result.text).not.toContain('Third sentence.');
  });
});

// ---------------------------------------------------------------------------
// 3. Flag-on rerank: candidates ordered by SD score ascending
// ---------------------------------------------------------------------------

describe('knowledge-mitigations: rerank enabled', () => {
  it('reorders candidates by SD score ascending when flag is true', () => {
    const candidates = [
      { text: 'high drift text', sdResult: sdResultNoDrift(0.9) },
      { text: 'low drift text', sdResult: sdResultNoDrift(0.1) },
      { text: 'medium drift text', sdResult: sdResultNoDrift(0.5) },
    ];

    const result = rerankHook({ candidates, flagOverride: true });
    expect(result.reranked).toBe(true);
    expect(result.candidates[0].text).toBe('low drift text');    // score 0.1
    expect(result.candidates[1].text).toBe('medium drift text'); // score 0.5
    expect(result.candidates[2].text).toBe('high drift text');   // score 0.9
  });

  it('does not mutate original candidates array', () => {
    const candidates = [
      { text: 'high', sdResult: sdResultNoDrift(0.9) },
      { text: 'low', sdResult: sdResultNoDrift(0.1) },
    ];
    const original = [...candidates];
    rerankHook({ candidates, flagOverride: true });
    expect(candidates[0].text).toBe(original[0].text);
    expect(candidates[1].text).toBe(original[1].text);
  });

  it('handles single candidate correctly', () => {
    const candidates = [{ text: 'only candidate', sdResult: sdResultNoDrift(0.5) }];
    const result = rerankHook({ candidates, flagOverride: true });
    expect(result.reranked).toBe(true);
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].text).toBe('only candidate');
  });

  it('handles empty candidates array', () => {
    const result = rerankHook({ candidates: [], flagOverride: true });
    expect(result.reranked).toBe(true);
    expect(result.candidates).toEqual([]);
  });

  it('stable for equal SD scores (order preserved among ties)', () => {
    const candidates = [
      { text: 'first', sdResult: sdResultNoDrift(0.5) },
      { text: 'second', sdResult: sdResultNoDrift(0.5) },
    ];
    const result = rerankHook({ candidates, flagOverride: true });
    // Stable sort: equal scores maintain original order.
    expect(result.candidates[0].text).toBe('first');
    expect(result.candidates[1].text).toBe('second');
  });
});

// ---------------------------------------------------------------------------
// 4. Settings reader unit tests
// ---------------------------------------------------------------------------

describe('knowledge-mitigations: settings readers', () => {
  it('readEarlyStopFlag returns false when settings file is absent', () => {
    expect(readEarlyStopFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readRerankFlag returns false when settings file is absent', () => {
    expect(readRerankFlag('/nonexistent/settings.json')).toBe(false);
  });

  it('readEarlyStopFlag returns false for malformed JSON', () => {
    // Test with a temp file containing invalid JSON
    // Since we can't write files here easily, verify the error-safe default.
    expect(readEarlyStopFlag('/dev/null')).toBe(false);
  });
});
