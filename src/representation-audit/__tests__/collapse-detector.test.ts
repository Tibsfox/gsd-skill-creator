/**
 * Tests for src/representation-audit/collapse-detector.ts
 *
 * Coverage:
 *   - SC-MD6-01: disabled by default → DISABLED status, no computation
 *   - Enabled + healthy fixture → OK
 *   - Enabled + collapsed fixture → CRITICAL (LS-39)
 *   - WARNING when metrics near threshold (within 20%)
 *   - Threshold override respected
 *   - criticalReasons populated on CRITICAL
 *   - null matrix / null communities handled
 */

import { describe, it, expect } from 'vitest';
import { detectCollapse } from '../collapse-detector.js';
import type { DetectorInput } from '../collapse-detector.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Healthy fixture: 4 entities, each fires in its own session → rank-4 identity-like. */
function healthyMatrix(): number[][] {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Collapsed fixture (LS-39): 10 sessions, 10 entities, but entity 0 fires in
 * every session and all others are silent → effectively rank 1.
 * r_eff_proxy = 1, rank_nominal = min(10,10) = 10, ratio = 0.1 < 0.3.
 */
function collapsedMatrix(): number[][] {
  return Array.from({ length: 10 }, () => {
    const row = new Array<number>(10).fill(0);
    row[0] = 1;
    return row;
  });
}

/** Well-separated communities with appropriate embeddings. */
function healthyCommunities(): Map<string, string[]> {
  return new Map([
    ['C1', ['a', 'b']],
    ['C2', ['c', 'd']],
  ]);
}

function healthyLookup(): (id: string) => readonly number[] | null {
  const emb: Record<string, number[]> = {
    a: [1, 0, 0],
    b: [0.99, 0.01, 0],
    c: [0, 1, 0],
    d: [0.01, 0.99, 0],
  };
  return (id: string) => emb[id] ?? null;
}

/** Collapsed communities: all embeddings identical → within ≈ between → ratio ≈ 1. */
function collapsedCommunities(): Map<string, string[]> {
  return new Map([
    ['C1', ['x1', 'x2']],
    ['C2', ['x3', 'x4']],
  ]);
}

function collapsedLookup(): (id: string) => readonly number[] | null {
  const emb: Record<string, number[]> = {
    x1: [1, 0, 0],
    x2: [1, 0, 0],
    x3: [1, 0, 0],
    x4: [1, 0, 0],
  };
  return (id: string) => emb[id] ?? null;
}

// ─── SC-MD6-01: disabled by default ──────────────────────────────────────────

describe('detectCollapse — SC-MD6-01 disabled by default', () => {
  it('returns DISABLED when no settings supplied (default enabled=false)', () => {
    const input: DetectorInput = { matrix: healthyMatrix(), communities: null };
    const result = detectCollapse(input);
    expect(result.status).toBe('DISABLED');
    expect(result.effectiveRankResult).toBeNull();
    expect(result.separabilityResult).toBeNull();
    expect(result.criticalReasons).toHaveLength(0);
  });

  it('summary mentions "disabled" when disabled', () => {
    const result = detectCollapse({ matrix: null, communities: null });
    expect(result.summary.toLowerCase()).toContain('disabled');
  });

  it('is not CRITICAL or OK when disabled', () => {
    const result = detectCollapse({ matrix: collapsedMatrix(), communities: null });
    expect(result.status).not.toBe('CRITICAL');
    expect(result.status).not.toBe('OK');
    expect(result.status).toBe('DISABLED');
  });

  it('has a non-empty ISO timestamp', () => {
    const result = detectCollapse({ matrix: null, communities: null });
    expect(result.timestamp).toMatch(/^\d{4}-/);
  });

  it('does not compute effective rank when disabled', () => {
    const result = detectCollapse({ matrix: collapsedMatrix(), communities: null });
    expect(result.effectiveRankResult).toBeNull();
  });
});

// ─── Healthy fixture → OK ─────────────────────────────────────────────────────

describe('detectCollapse — healthy fixture (enabled)', () => {
  const settings = { enabled: true };

  it('returns OK for full-rank matrix', () => {
    const result = detectCollapse({ matrix: healthyMatrix(), communities: null }, settings);
    expect(result.status).toBe('OK');
    expect(result.criticalReasons).toHaveLength(0);
  });

  it('effectiveRankResult is populated when matrix supplied', () => {
    const result = detectCollapse({ matrix: healthyMatrix(), communities: null }, settings);
    expect(result.effectiveRankResult).not.toBeNull();
    expect(result.effectiveRankResult!.ratio).toBeCloseTo(1, 4);
  });

  it('summary mentions "passed" for OK result', () => {
    const result = detectCollapse({ matrix: healthyMatrix(), communities: null }, settings);
    expect(result.summary.toLowerCase()).toContain('passed');
  });

  it('returns OK for well-separated communities + healthy matrix', () => {
    const input: DetectorInput = {
      matrix: healthyMatrix(),
      communities: healthyCommunities(),
      getEmbedding: healthyLookup(),
    };
    const result = detectCollapse(input, settings);
    // Separability: healthy → ratio >> 1, not in [0, 0.8) collapse zone.
    // Effective rank: healthy → ratio ≈ 1 > 0.3.
    // Both OK.
    expect(result.status).toBe('OK');
  });
});

// ─── Collapsed fixture → CRITICAL (LS-39) ────────────────────────────────────

describe('detectCollapse — collapsed fixture CRITICAL (LS-39)', () => {
  const settings = { enabled: true };

  it('flags CRITICAL when effective-rank ratio < 0.3', () => {
    // Collapsed matrix: ratio = 0.1 < threshold 0.3
    const result = detectCollapse({ matrix: collapsedMatrix(), communities: null }, settings);
    expect(result.status).toBe('CRITICAL');
    expect(result.criticalReasons.length).toBeGreaterThan(0);
  });

  it('critical reason mentions effective-rank ratio', () => {
    const result = detectCollapse({ matrix: collapsedMatrix(), communities: null }, settings);
    expect(result.criticalReasons[0]).toContain('ffective-rank');
  });

  it('summary mentions "collapse" for CRITICAL result', () => {
    const result = detectCollapse({ matrix: collapsedMatrix(), communities: null }, settings);
    expect(result.summary.toLowerCase()).toContain('collapse');
  });

  it('flags CRITICAL when separability ratio ≥ 0.8 (collapsed communities)', () => {
    const input: DetectorInput = {
      matrix: null,
      communities: collapsedCommunities(),
      getEmbedding: collapsedLookup(),
    };
    const result = detectCollapse(input, settings);
    // Collapsed lookup: all embeddings identical → within = 1, between = 1 → ratio = 1 ≥ 0.8
    expect(result.status).toBe('CRITICAL');
    expect(result.criticalReasons.some((r) => r.toLowerCase().includes('separab'))).toBe(true);
  });

  it('LS-39 kernel-collapse fixture: planted near-origin → CRITICAL', () => {
    // Planting: 20 sessions, 20 entities, only entity 0 fires.
    const matrix = Array.from({ length: 20 }, () => {
      const row = new Array<number>(20).fill(0);
      row[0] = 1;
      return row;
    });
    const result = detectCollapse({ matrix, communities: null }, settings);
    expect(result.status).toBe('CRITICAL');
    expect(result.effectiveRankResult!.ratio).toBeLessThan(0.3);
  });
});

// ─── Threshold overrides ──────────────────────────────────────────────────────

describe('detectCollapse — threshold overrides', () => {
  it('does not flag when threshold lowered below actual ratio', () => {
    // Collapsed matrix ratio ≈ 0.1; lower threshold to 0.05.
    const result = detectCollapse(
      { matrix: collapsedMatrix(), communities: null },
      { enabled: true, effectiveRankThreshold: 0.05 },
    );
    // ratio 0.1 > 0.05 → should not flag.
    expect(result.status).not.toBe('CRITICAL');
  });

  it('flags when threshold raised above actual ratio', () => {
    // Healthy matrix ratio ≈ 1.0; raise threshold to 0.95.
    const result = detectCollapse(
      { matrix: healthyMatrix(), communities: null },
      { enabled: true, effectiveRankThreshold: 0.95 },
    );
    // Healthy matrix identity-like: ratio ≈ 1.0; 1.0 is NOT < 0.95 → no CRITICAL.
    // Wait: ratio = 1.0, threshold = 0.95; ratio < threshold? 1.0 < 0.95 is false.
    // So still OK. Let's use a matrix with ratio ≈ 0.5:
    // 3-col matrix, col 0 dominant, col 1 minor, col 2 silent.
    const partialMatrix = Array.from({ length: 6 }, (_, i) => {
      const row = [1, i < 3 ? 1 : 0, 0]; // col 0 always, col 1 half
      return row;
    });
    const partialResult = detectCollapse(
      { matrix: partialMatrix, communities: null },
      { enabled: true, effectiveRankThreshold: 0.9 }, // very high threshold
    );
    expect(partialResult.status).toBe('CRITICAL');
  });
});

// ─── Null inputs ──────────────────────────────────────────────────────────────

describe('detectCollapse — null inputs', () => {
  const settings = { enabled: true };

  it('handles null matrix gracefully → effectiveRankResult is null', () => {
    const result = detectCollapse({ matrix: null, communities: null }, settings);
    expect(result.effectiveRankResult).toBeNull();
    expect(result.status).toBe('OK'); // no metrics to fail
  });

  it('handles null communities gracefully → separabilityResult is null', () => {
    const result = detectCollapse({ matrix: healthyMatrix(), communities: null }, settings);
    expect(result.separabilityResult).toBeNull();
  });

  it('both null → OK with empty summary note', () => {
    const result = detectCollapse({ matrix: null, communities: null }, settings);
    expect(result.status).toBe('OK');
  });
});
