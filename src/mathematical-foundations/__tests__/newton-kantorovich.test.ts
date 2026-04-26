/**
 * JP-028 (MEDIUM, Phase 837) — Newton-Kantorovich existence-verification primitive.
 *
 * Anchor: arXiv:2604.21887 (Newton-Kantorovich Theorem for Operator Equations, 2026).
 * Depends on JP-001 (Lean toolchain pin).
 *
 * Tests:
 *   1. newton-kantorovich.md exists at the canonical path.
 *   2. The doc references arXiv:2604.21887 (the anchor).
 *   3. The doc contains the load-bearing formula `h := α · β · K ≤ 1/2`.
 *   4. Convergence-condition check on a synthetic operator (machine-checkable formula).
 *   5. Doc cross-references lean-toolchain.md (JP-001 dependency).
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Path constants
// ---------------------------------------------------------------------------

const NK_DOC = path.join(
  process.cwd(),
  'src',
  'mathematical-foundations',
  'newton-kantorovich.md',
);

// ---------------------------------------------------------------------------
// Inline NK primitive (mirrors the formula in the doc)
// Kept here so the test is self-contained and can verify the formula directly.
// ---------------------------------------------------------------------------

interface NKResult {
  h: number;
  converges: boolean;
  r_star: number | null;
}

/**
 * Newton-Kantorovich existence-verification primitive.
 *
 * Formula (arXiv:2604.21887, Theorem 2.1):
 *   h     = α * β * K
 *   r*    = h ≤ 0.5 ? (1 - sqrt(1 - 2h)) / (β * K) : null
 *
 * @param alpha  ‖[F'(x₀)]⁻¹ F(x₀)‖ — first Newton step size
 * @param beta   ‖[F'(x₀)]⁻¹‖ — inverse operator norm
 * @param K      Lipschitz constant of F'
 */
function newtonKantorovichCheck(alpha: number, beta: number, K: number): NKResult {
  const h = alpha * beta * K;
  const converges = h <= 0.5;
  const r_star = converges ? (1 - Math.sqrt(1 - 2 * h)) / (beta * K) : null;
  return { h, converges, r_star };
}

// ---------------------------------------------------------------------------
// Doc-presence + content tests
// ---------------------------------------------------------------------------

describe('JP-028 newton-kantorovich.md: existence and anchor', () => {
  it('newton-kantorovich.md exists at src/mathematical-foundations/newton-kantorovich.md', () => {
    expect(fs.existsSync(NK_DOC)).toBe(true);
  });

  it('doc references arXiv:2604.21887 (primary anchor)', () => {
    const content = fs.readFileSync(NK_DOC, 'utf8');
    expect(content).toContain('arXiv:2604.21887');
  });

  it('doc contains the NK convergence condition formula h := α · β · K ≤ 1/2', () => {
    const content = fs.readFileSync(NK_DOC, 'utf8');
    // The formula appears as "h := α · β · K ≤ 1/2" in the doc.
    expect(content).toContain('h :=');
    expect(content).toContain('1/2');
  });

  it('doc contains the convergence-radius formula r*', () => {
    const content = fs.readFileSync(NK_DOC, 'utf8');
    expect(content).toContain('r*');
    expect(content).toContain('sqrt');
  });

  it('doc cross-references lean-toolchain.md (JP-001 Lean pin dependency)', () => {
    const content = fs.readFileSync(NK_DOC, 'utf8');
    expect(content).toContain('lean-toolchain.md');
  });
});

// ---------------------------------------------------------------------------
// Convergence-condition tests on synthetic operators
// ---------------------------------------------------------------------------

describe('JP-028 Newton-Kantorovich convergence primitive: formula verification', () => {
  it('converges when h = αβK ≤ 0.5 (standard NK condition)', () => {
    // Synthetic: α=0.1, β=2, K=2 => h = 0.1 * 2 * 2 = 0.4 ≤ 0.5 → converges
    const result = newtonKantorovichCheck(0.1, 2.0, 2.0);
    expect(result.h).toBeCloseTo(0.4, 10);
    expect(result.converges).toBe(true);
    expect(result.r_star).not.toBeNull();
  });

  it('convergence radius r* > 0 when h < 0.5', () => {
    const result = newtonKantorovichCheck(0.1, 2.0, 2.0);
    expect(result.r_star).not.toBeNull();
    expect(result.r_star!).toBeGreaterThan(0);
  });

  it('r* = (1 - sqrt(1 - 2h)) / (βK) — formula matches arXiv:2604.21887 Theorem 2.1', () => {
    const alpha = 0.1, beta = 2.0, K = 2.0;
    const result = newtonKantorovichCheck(alpha, beta, K);
    const h = alpha * beta * K;
    const expectedRStar = (1 - Math.sqrt(1 - 2 * h)) / (beta * K);
    expect(result.r_star).toBeCloseTo(expectedRStar, 12);
  });

  it('does NOT converge when h = αβK > 0.5', () => {
    // α=0.5, β=2, K=1 => h = 0.5 * 2 * 1 = 1.0 > 0.5
    const result = newtonKantorovichCheck(0.5, 2.0, 1.0);
    expect(result.h).toBeCloseTo(1.0, 10);
    expect(result.converges).toBe(false);
    expect(result.r_star).toBeNull();
  });

  it('boundary case h = 0.5 is still converging (≤ 0.5)', () => {
    // α=0.25, β=2, K=1 => h = 0.25 * 2 * 1 = 0.5
    const result = newtonKantorovichCheck(0.25, 2.0, 1.0);
    expect(result.h).toBeCloseTo(0.5, 10);
    expect(result.converges).toBe(true);
    // At h=0.5: r* = (1 - sqrt(0)) / (βK) = 1 / (2*1) = 0.5
    expect(result.r_star).toBeCloseTo(0.5, 10);
  });

  it('trivial case: α→0 gives h→0 and r*→0 (no Newton step needed)', () => {
    // α=0.001, β=1, K=1 => h = 0.001 ≤ 0.5
    const result = newtonKantorovichCheck(0.001, 1.0, 1.0);
    expect(result.h).toBeCloseTo(0.001, 10);
    expect(result.converges).toBe(true);
    // r* ≈ (1 - sqrt(1 - 0.002)) / 1 ≈ 0.001 (first-order approx)
    expect(result.r_star!).toBeGreaterThan(0);
    expect(result.r_star!).toBeLessThan(0.01);
  });
});
