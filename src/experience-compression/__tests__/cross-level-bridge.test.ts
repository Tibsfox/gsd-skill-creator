/**
 * Experience Compression — cross-level bridge tests.
 *
 * Verifies the "missing diagonal" (Zhang et al. arXiv:2604.15877 §4):
 *   - bridgeLevels returns records at adjacent admitted levels
 *   - diagonalLevels lists only the non-canonical admitted levels
 *   - disabled path returns only canonical record, no diagonal
 *   - forceLevel produces correct level regardless of canonical classification
 *   - episodic content with regularity admits procedural framing
 *   - procedural content with abstraction admits declarative framing
 */

import { describe, it, expect } from 'vitest';
import { bridgeLevels, forceLevel } from '../cross-level-bridge.js';
import type { ExperienceContent } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEpisodicContent(id: string): ExperienceContent {
  return {
    id,
    // Moderately regular structure → should admit procedural framing (regularity ≥ 0.35)
    payload: [
      { event: 'tick', seq: 1, ts: 1714000001, tag: 'loop' },
      { event: 'tick', seq: 2, ts: 1714000002, tag: 'loop' },
      { event: 'tick', seq: 3, ts: 1714000003, tag: 'loop' },
    ],
    byteSize: 200,
    variabilityScore: 0.65, // high variability → episodic canonical
  };
}

function makeProceduralContent(id: string): ExperienceContent {
  return {
    id,
    payload: {
      skillName: 'compress-session',
      parameters: { level: 'procedural', threshold: 0.4 },
      steps: ['classify', 'extract-pattern', 'emit-record'],
    },
    byteSize: 300,
    variabilityScore: 0.35, // moderate
    abstractionDepth: 2,    // procedural
  };
}

function makeDeclarativeContent(id: string): ExperienceContent {
  return {
    id,
    payload: { rule: 'max-change', constraint: '0.20' },
    byteSize: 50,
    variabilityScore: 0.05, // very low
    abstractionDepth: 4,    // declarative
  };
}

// ---------------------------------------------------------------------------
// Core missing-diagonal tests
// ---------------------------------------------------------------------------

describe('cross-level-bridge — missing diagonal (episodic → procedural)', () => {
  it('episodic content with structural regularity admits procedural framing (diagonal #1)', () => {
    const content = makeEpisodicContent('ep-diag-1');
    const result = bridgeLevels(content, true);

    expect(result.canonicalLevel).toBe('episodic');
    // The procedural record must be present in the diagonal
    expect(result.diagonalLevels).toContain('procedural');
    expect(result.records['procedural']).toBeDefined();
    expect(result.records['episodic']).toBeDefined();
    // Confirm the diagonal record has a higher ratio than episodic
    const ep = result.records['episodic']!;
    const pr = result.records['procedural']!;
    expect(pr.level).toBe('procedural');
    expect(ep.level).toBe('episodic');
  });
});

describe('cross-level-bridge — missing diagonal (procedural → declarative)', () => {
  it('procedural content with abstraction depth ≥ 2 admits declarative framing (diagonal #2)', () => {
    const content = makeProceduralContent('proc-diag-1');
    const result = bridgeLevels(content, true);

    expect(result.canonicalLevel).toBe('procedural');
    expect(result.diagonalLevels).toContain('declarative');
    expect(result.records['declarative']).toBeDefined();
    expect(result.records['procedural']).toBeDefined();

    const pr = result.records['procedural']!;
    const dc = result.records['declarative']!;
    expect(pr.level).toBe('procedural');
    expect(dc.level).toBe('declarative');
    // Declarative ratio must be higher than procedural
    expect(dc.ratio).toBeGreaterThan(pr.ratio);
  });
});

// ---------------------------------------------------------------------------
// Disabled path
// ---------------------------------------------------------------------------

describe('cross-level-bridge — disabled path', () => {
  it('returns only canonical record and empty diagonalLevels when disabled', () => {
    const content = makeEpisodicContent('ep-disabled-1');
    const result = bridgeLevels(content, false);

    expect(result.diagonalLevels).toHaveLength(0);
    // The canonical record is present and marked disabled
    const canonicalRecord = result.records[result.canonicalLevel];
    expect(canonicalRecord).toBeDefined();
    expect(canonicalRecord?.disabled).toBe(true);
    // No procedural or declarative records
    expect(result.records['procedural']).toBeUndefined();
    expect(result.records['declarative']).toBeUndefined();
  });

  it('disabled bridgeLevels is byte-identical for procedural content', () => {
    const content = makeProceduralContent('proc-disabled-1');
    const result = bridgeLevels(content, false);
    const record = result.records[result.canonicalLevel]!;
    expect(record.disabled).toBe(true);
    expect(record.ratio).toBe(1.0);
    expect(record.compressedPayload).toEqual(content.payload);
  });
});

// ---------------------------------------------------------------------------
// Declarative → procedural (reverse diagonal)
// ---------------------------------------------------------------------------

describe('cross-level-bridge — declarative admits procedural (reverse diagonal)', () => {
  it('declarative content always admits procedural framing', () => {
    const content = makeDeclarativeContent('dec-diag-1');
    const result = bridgeLevels(content, true);

    expect(result.canonicalLevel).toBe('declarative');
    expect(result.diagonalLevels).toContain('procedural');
    expect(result.records['procedural']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// forceLevel
// ---------------------------------------------------------------------------

describe('cross-level-bridge — forceLevel', () => {
  it('forceLevel produces declarative record for episodic content when enabled', () => {
    const content = makeEpisodicContent('ep-force-1');
    const record = forceLevel(content, 'declarative', true);
    expect(record.level).toBe('declarative');
    expect(record.disabled).toBeUndefined();
    expect(record.ratio).toBeGreaterThanOrEqual(1);
  });

  it('forceLevel returns disabled record when disabled', () => {
    const content = makeProceduralContent('proc-force-1');
    const record = forceLevel(content, 'declarative', false);
    expect(record.disabled).toBe(true);
    expect(record.ratio).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Structure invariants
// ---------------------------------------------------------------------------

describe('cross-level-bridge — structural invariants', () => {
  it('canonicalLevel is always present in records', () => {
    for (const content of [
      makeEpisodicContent('inv-ep'),
      makeProceduralContent('inv-proc'),
      makeDeclarativeContent('inv-dec'),
    ]) {
      const result = bridgeLevels(content, true);
      expect(result.records[result.canonicalLevel]).toBeDefined();
    }
  });

  it('diagonalLevels does not include the canonicalLevel', () => {
    for (const content of [
      makeEpisodicContent('dl-ep'),
      makeProceduralContent('dl-proc'),
      makeDeclarativeContent('dl-dec'),
    ]) {
      const result = bridgeLevels(content, true);
      expect(result.diagonalLevels).not.toContain(result.canonicalLevel);
    }
  });
});
