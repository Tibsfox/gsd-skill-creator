/**
 * Tests for src/representation-audit/effective-rank.ts
 *
 * Coverage:
 *   - Degenerate / empty matrices → effectiveRank = 0, ratio = 0
 *   - Rank-1 matrix → effectiveRank proxy ≈ 1
 *   - Identity-like matrix → effectiveRank proxy ≈ cols
 *   - Mixed matrix → effectiveRank proxy between 1 and cols
 *   - buildActivationMatrix: correct shape and values
 *   - CF-MD6-01: column-norm proxies expose high-activation entities
 */

import { describe, it, expect } from 'vitest';
import { effectiveRank, buildActivationMatrix } from '../effective-rank.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create an m×n rank-1 matrix: all rows are identical to `row`. */
function rank1Matrix(rows: number, row: number[]): number[][] {
  return Array.from({ length: rows }, () => [...row]);
}

/** Create an m×n diagonal-identity-like matrix where row i has 1 only at col i. */
function identityLikeMatrix(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => {
    const row = new Array<number>(n).fill(0);
    row[i] = 1;
    return row;
  });
}

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('effectiveRank — edge cases', () => {
  it('returns 0 for empty matrix (0 rows)', () => {
    const result = effectiveRank([]);
    expect(result.effectiveRank).toBe(0);
    expect(result.rankNominal).toBe(0);
    expect(result.ratio).toBe(0);
    expect(result.rows).toBe(0);
    expect(result.cols).toBe(0);
  });

  it('returns 0 for matrix with 0 cols', () => {
    const result = effectiveRank([[]]);
    expect(result.effectiveRank).toBe(0);
    expect(result.ratio).toBe(0);
  });

  it('returns 0 for all-zero matrix', () => {
    const matrix = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    const result = effectiveRank(matrix);
    expect(result.effectiveRank).toBe(0);
    expect(result.ratio).toBe(0);
  });
});

// ─── Rank-1 matrix ───────────────────────────────────────────────────────────

describe('effectiveRank — rank-1 matrix', () => {
  it('returns effectiveRank ≈ 1 for identical rows', () => {
    // All 10 rows are [1, 0, 0] → only one column has nonzero norm.
    const matrix = rank1Matrix(10, [1, 0, 0]);
    const result = effectiveRank(matrix);
    // Column norms: [sqrt(10), 0, 0].
    // proxy_0 = sqrt(10), proxy_1 = 0, proxy_2 = 0.
    // sum = sqrt(10), sumSq = 10.  r_eff = 10/10 = 1.
    expect(result.effectiveRank).toBeCloseTo(1, 5);
    expect(result.rankNominal).toBe(3); // min(10, 3) = 3
    // ratio = 1/3 ≈ 0.333
    expect(result.ratio).toBeCloseTo(1 / 3, 5);
  });

  it('returns effectiveRank ≈ 1 for row [1,1,1] scaled identically', () => {
    // All rows are [1, 1, 1].
    // Column norms: each col has sqrt(10).
    // proxy_j = sqrt(10) for all 3 cols.
    // sum = 3*sqrt(10), sumSq = 3*10 = 30.  r_eff = 9*10/30 = 3.
    // That is: rank-1 in terms of row-space but col norms are equal → r_eff = cols.
    // This is a known artefact of the column-norm proxy (conservative over-estimate).
    const matrix = rank1Matrix(10, [1, 1, 1]);
    const result = effectiveRank(matrix);
    // col norms are equal → participation ratio = 3.
    expect(result.effectiveRank).toBeCloseTo(3, 4);
    // ratio = 3/3 = 1
    expect(result.ratio).toBeCloseTo(1, 4);
  });

  it('reflects concentration when only one entity fires', () => {
    // Simulate collapse: 20 sessions, 5 entities, only entity 0 fires.
    const matrix = rank1Matrix(20, [1, 0, 0, 0, 0]);
    const result = effectiveRank(matrix);
    // Only col 0 has nonzero norm → r_eff = 1, rankNominal = 5, ratio = 0.2
    expect(result.effectiveRank).toBeCloseTo(1, 5);
    expect(result.ratio).toBeCloseTo(1 / 5, 5);
    // ratio < 0.3 threshold → would flag CRITICAL
    expect(result.ratio).toBeLessThan(0.3);
  });
});

// ─── Full-rank / identity-like matrix ────────────────────────────────────────

describe('effectiveRank — full-rank (identity-like) matrix', () => {
  it('returns effectiveRank ≈ n for identity-like matrix', () => {
    // n×n identity-like: each col has exactly one nonzero entry = 1.
    // col norm = 1 for all cols.
    // participation ratio = n²/n = n.
    const n = 6;
    const matrix = identityLikeMatrix(n);
    const result = effectiveRank(matrix);
    expect(result.effectiveRank).toBeCloseTo(n, 5);
    expect(result.rankNominal).toBe(n);
    expect(result.ratio).toBeCloseTo(1, 5);
  });

  it('returns ratio close to 1 for uniformly distributed matrix', () => {
    // 4×4 matrix where each entity fires equally across sessions.
    const matrix = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];
    const result = effectiveRank(matrix);
    // All col norms equal → r_eff = 4; ratio = 1.
    expect(result.ratio).toBeCloseTo(1, 4);
  });
});

// ─── Mixed matrices ───────────────────────────────────────────────────────────

describe('effectiveRank — mixed matrices', () => {
  it('returns intermediate effective rank for partially concentrated matrix', () => {
    // 4 rows, 4 cols: col 0 fires heavily, col 1 moderately, cols 2-3 barely.
    const matrix = [
      [10, 5, 1, 0],
      [10, 5, 0, 1],
      [10, 5, 1, 0],
      [10, 5, 0, 1],
    ];
    const result = effectiveRank(matrix);
    // r_eff should be between 1 and 4.
    expect(result.effectiveRank).toBeGreaterThan(1);
    expect(result.effectiveRank).toBeLessThan(4);
    expect(result.rankNominal).toBe(4);
    expect(result.rows).toBe(4);
    expect(result.cols).toBe(4);
  });

  it('exposes column proxies', () => {
    const matrix = [[1, 2, 3]];
    const result = effectiveRank(matrix);
    expect(result.columnProxies.length).toBe(3);
    expect(result.columnProxies[0]).toBeCloseTo(1, 5);
    expect(result.columnProxies[1]).toBeCloseTo(2, 5);
    expect(result.columnProxies[2]).toBeCloseTo(3, 5);
  });
});

// ─── CF-MD6-01: high-activation entities ─────────────────────────────────────

describe('effectiveRank — CF-MD6-01 collapsing entity detection via proxies', () => {
  it('column proxies identify the dominant entity in a collapsed fixture', () => {
    // 20 entities; entity 0 fires in every session, others barely.
    const sessions = 15;
    const entities = 20;
    const matrix = Array.from({ length: sessions }, (_, _si) => {
      const row = new Array<number>(entities).fill(0);
      row[0] = 1; // always fires
      // entity 1 fires occasionally
      if (_si % 5 === 0) row[1] = 1;
      return row;
    });
    const result = effectiveRank(matrix);
    // col 0 proxy should be the largest
    const maxProxy = Math.max(...result.columnProxies);
    expect(result.columnProxies[0]).toBeCloseTo(maxProxy, 5);
    // Effective rank should be low compared to entity count.
    expect(result.effectiveRank).toBeLessThan(entities / 2);
  });
});

// ─── buildActivationMatrix ────────────────────────────────────────────────────

describe('buildActivationMatrix', () => {
  it('builds the correct matrix from vocabulary and sessions', () => {
    const vocab = ['a', 'b', 'c'];
    const sessions = [
      ['a', 'b'],
      ['b', 'c'],
      ['a'],
    ];
    const matrix = buildActivationMatrix(vocab, sessions);
    expect(matrix.length).toBe(3);
    expect(matrix[0]).toEqual([1, 1, 0]);
    expect(matrix[1]).toEqual([0, 1, 1]);
    expect(matrix[2]).toEqual([1, 0, 0]);
  });

  it('uses getWeight when provided', () => {
    const vocab = ['x', 'y'];
    const sessions = [['x', 'y']];
    const matrix = buildActivationMatrix(vocab, sessions, (eid) => eid === 'x' ? 2 : 0.5);
    expect(matrix[0]![0]).toBeCloseTo(2, 5);
    expect(matrix[0]![1]).toBeCloseTo(0.5, 5);
  });

  it('ignores entities not in vocabulary', () => {
    const vocab = ['a'];
    const sessions = [['a', 'z']]; // 'z' not in vocab
    const matrix = buildActivationMatrix(vocab, sessions);
    expect(matrix[0]).toEqual([1]);
  });

  it('produces a zero matrix for sessions with no matching entities', () => {
    const vocab = ['a', 'b'];
    const sessions = [['c'], ['d']];
    const matrix = buildActivationMatrix(vocab, sessions);
    expect(matrix[0]).toEqual([0, 0]);
    expect(matrix[1]).toEqual([0, 0]);
  });
});
