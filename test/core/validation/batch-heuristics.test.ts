/**
 * @file Behavioral tests for detectTimestampClustering and detectSessionCompression
 * @description Phase 558-01: Tests for the first two batch detection heuristics.
 *              Covers boundary conditions, adversarial proofs, and well-formed result shapes.
 */
import { describe, it, expect } from 'vitest';
import {
  detectTimestampClustering,
  detectSessionCompression,
} from '../../../src/core/validation/batch-detection/batch-heuristics.js';
import { DEFAULT_BATCH_DETECTION_CONFIG } from '../../../src/core/validation/batch-detection/batch-types.js';
import type { ArtifactTimestamp } from '../../../src/core/validation/pacing-gate/pacing-types.js';
import type { BatchHeuristicResult } from '../../../src/core/validation/batch-detection/batch-types.js';

/** Helper to create ArtifactTimestamp fixtures with offset seconds (supports sub-second precision) */
function makeArtifact(path: string, offsetSeconds: number, sessionId = 'session-1', subversionId = 'sv-1'): ArtifactTimestamp {
  const baseMs = new Date('2026-03-01T12:00:00.000Z').getTime();
  const offsetMs = Math.round(offsetSeconds * 1000);
  return {
    path,
    createdAt: new Date(baseMs + offsetMs).toISOString(),
    sessionId,
    subversionId,
  };
}

describe('detectTimestampClustering', () => {
  const config = { ...DEFAULT_BATCH_DETECTION_CONFIG };

  it('returns detected=false with empty artifacts array', () => {
    const result = detectTimestampClustering(config, []);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('info');
    expect(result.artifacts).toEqual([]);
  });

  it('returns detected=false when given only 1 artifact', () => {
    const result = detectTimestampClustering(config, [makeArtifact('a.md', 0)]);
    expect(result.detected).toBe(false);
  });

  it('returns detected=false when 2 artifacts within window but minCount is 3', () => {
    const artifacts = [makeArtifact('a.md', 0), makeArtifact('b.md', 10)];
    const result = detectTimestampClustering(config, artifacts);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('info');
  });

  it('returns detected=true when exactly 3 artifacts within 60s window', () => {
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 20),
      makeArtifact('c.md', 40),
    ];
    const result = detectTimestampClustering(config, artifacts);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('warn');
  });

  it('returns detected=false when 3 artifacts are spread across 120s', () => {
    // Each 60s apart: [0, 60, 120] -- no window of 60s contains 3
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 60),
      makeArtifact('c.md', 120),
    ];
    const result = detectTimestampClustering(config, artifacts);
    // Only 2 can fit in any 60s window: [0,60] or [60,120]
    expect(result.detected).toBe(false);
  });

  it('includes count and window in details message when detected', () => {
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 10),
      makeArtifact('c.md', 20),
    ];
    const result = detectTimestampClustering(config, artifacts);
    expect(result.details).toContain('3');
    expect(result.details).toContain('60');
    expect(result.details).toContain('Timestamp clustering');
  });

  it('lists paths of clustered artifacts in result', () => {
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 10),
      makeArtifact('c.md', 20),
    ];
    const result = detectTimestampClustering(config, artifacts);
    expect(result.artifacts).toContain('a.md');
    expect(result.artifacts).toContain('b.md');
    expect(result.artifacts).toContain('c.md');
  });

  it('artifacts at exactly window boundary do NOT cluster', () => {
    // 60.001 seconds apart: just beyond the 60s window
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 30),
      makeArtifact('c.md', 60.001),
    ];
    const result = detectTimestampClustering(config, artifacts);
    // c is >60s from a, so the cluster [a,b,c] doesn't fit in 60s
    // Only [a,b] = 2 artifacts or [b,c] = 2 artifacts
    expect(result.detected).toBe(false);
  });

  it('different configs produce different results (not a constant)', () => {
    const artifacts = [
      makeArtifact('a.md', 0),
      makeArtifact('b.md', 10),
      makeArtifact('c.md', 20),
    ];

    const strictConfig = { ...config, timestampClusteringMinCount: 5 };
    const looseConfig = { ...config, timestampClusteringMinCount: 2 };

    const strictResult = detectTimestampClustering(strictConfig, artifacts);
    const looseResult = detectTimestampClustering(looseConfig, artifacts);

    expect(strictResult.detected).toBe(false);
    expect(looseResult.detected).toBe(true);
  });

  it('returns well-formed BatchHeuristicResult objects', () => {
    const result = detectTimestampClustering(config, []);
    expect(result).toHaveProperty('detected');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('artifacts');
    expect(typeof result.detected).toBe('boolean');
    expect(typeof result.severity).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});

describe('detectSessionCompression', () => {
  it('returns detected=true when completedSubversions exceeds sessionBudget', () => {
    const result = detectSessionCompression(6, 5);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe('warn');
  });

  it('returns detected=false when completedSubversions is within budget', () => {
    const result = detectSessionCompression(3, 5);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe('info');
  });

  it('returns detected=false at exact boundary (completedSubversions === sessionBudget)', () => {
    const result = detectSessionCompression(5, 5);
    expect(result.detected).toBe(false);
  });

  it('returns detected=true at one over boundary', () => {
    const result = detectSessionCompression(6, 5);
    expect(result.detected).toBe(true);
  });

  it('details message includes actual count and budget when detected', () => {
    const result = detectSessionCompression(8, 5);
    expect(result.details).toContain('8');
    expect(result.details).toContain('5');
    expect(result.details).toContain('exceeds budget');
  });

  it('details message includes actual count and budget when not detected', () => {
    const result = detectSessionCompression(3, 5);
    expect(result.details).toContain('3');
    expect(result.details).toContain('5');
    expect(result.details).toContain('within budget');
  });

  it('artifacts array is always empty', () => {
    expect(detectSessionCompression(10, 5).artifacts).toEqual([]);
    expect(detectSessionCompression(3, 5).artifacts).toEqual([]);
  });

  it('0 completed with budget 0 is NOT detected (0 <= 0)', () => {
    const result = detectSessionCompression(0, 0);
    expect(result.detected).toBe(false);
  });

  it('different budgets produce different results (not a constant)', () => {
    const resultSmallBudget = detectSessionCompression(5, 3);
    const resultLargeBudget = detectSessionCompression(5, 10);
    expect(resultSmallBudget.detected).toBe(true);
    expect(resultLargeBudget.detected).toBe(false);
  });

  it('returns well-formed BatchHeuristicResult objects', () => {
    const result = detectSessionCompression(3, 5);
    expect(result).toHaveProperty('detected');
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('artifacts');
    expect(typeof result.detected).toBe('boolean');
    expect(typeof result.severity).toBe('string');
    expect(typeof result.details).toBe('string');
    expect(Array.isArray(result.artifacts)).toBe(true);
  });
});
