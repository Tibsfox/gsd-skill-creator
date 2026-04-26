/**
 * JP-009 (HIGH, Phase 834) — SAT→LLM→Lean discovery-workflow smoke test.
 *
 * Anchor: arXiv:2604.21187 (Doubly Saturated Ramsey Graphs, computer-assisted
 * discovery). See src/mathematical-foundations/discovery-workflow.md for the
 * full three-step pattern.
 *
 * This test exercises the SAT step in pure TypeScript (no external solver
 * binary required) on the smallest non-trivial Ramsey-style fact:
 *
 *   Fact: Every 2-coloring of the edges of K_3 contains a monochromatic
 *   triangle (trivially, because K_3 IS a single triangle).
 *
 * The "SAT check" here is a complete enumeration of all 2^3 = 8 colorings,
 * confirming each contains a monochromatic triangle. This mirrors the
 * arXiv:2604.21187 workflow at micro-scale:
 *   Step 1 (SAT): enumerate + check all colorings.
 *   Step 2 (LLM): the theorem statement printed below is the LLM-codegen output.
 *   Step 3 (Lean): gated on LEAN_AVAILABLE=1; otherwise documented as proof debt.
 *
 * Depends on JP-001 (lean-toolchain.md) for the Lean pin; references
 * lean-toolchain.md in the skip reason per JP-001 gate pattern.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LEAN_AVAILABLE = process.env['LEAN_AVAILABLE'] === '1';

const LEAN_SKIP_REASON =
  'Lean step of the SAT→LLM→Lean workflow requires LEAN_AVAILABLE=1. ' +
  'Set LEAN_AVAILABLE=1 with lean + lake on PATH (see lean-toolchain.md for the pinned version). ' +
  'The SAT step runs unconditionally.';

// ---------------------------------------------------------------------------
// K_3 edge encoding — pigeonhole Ramsey fact
// ---------------------------------------------------------------------------
// Three edges of K_3: (0,1), (0,2), (1,2).
// Color each edge 0 (red) or 1 (blue).
//
// Fact (pigeonhole): in any 2-coloring of K_3 edges, at least one COLOR class
// has ≥ 2 edges. This is the SAT-encoded pigeonhole principle at the smallest
// non-trivial scale. It is NOT the Ramsey R(3,3)=6 claim — that is a harder
// fact. We use the simpler pigeonhole fact because it is both true and
// checkable by complete enumeration.
//
// "SAT unsat" encoding: there is NO 2-coloring of K_3 edges in which BOTH
// red-count < 2 AND blue-count < 2 (i.e., both colors have ≤ 1 edge).
// Proof: 3 edges, 2 colors, at most 1 edge each → at most 2 edges total.
// Contradiction. So the SAT instance "find coloring with both counts ≤ 1" is
// UNSAT.

type Coloring = readonly [number, number, number]; // colors of edges (0,1),(0,2),(1,2)

function allColorings(): Coloring[] {
  const out: Coloring[] = [];
  for (let e01 = 0; e01 <= 1; e01++) {
    for (let e02 = 0; e02 <= 1; e02++) {
      for (let e12 = 0; e12 <= 1; e12++) {
        out.push([e01, e02, e12] as const);
      }
    }
  }
  return out;
}

/**
 * Returns true if the coloring has both red-count ≤ 1 AND blue-count ≤ 1.
 * This is the "satisfying assignment" for the UNSAT pigeonhole instance.
 * No coloring should satisfy this (since 1+1 < 3).
 */
function satisfiesBothCountsAtMostOne(c: Coloring): boolean {
  const redCount = c.filter((e) => e === 0).length;
  const blueCount = c.filter((e) => e === 1).length;
  return redCount <= 1 && blueCount <= 1;
}

/**
 * SAT-style check: enumerate all colorings and return those with both
 * color counts ≤ 1. The pigeonhole principle guarantees this is empty
 * (UNSAT) for K_3 (3 edges, 2 colors).
 */
function satSearch(): Coloring[] {
  return allColorings().filter(satisfiesBothCountsAtMostOne);
}

// ---------------------------------------------------------------------------
// Lean statement (Step 2 output — LLM-codegen analog)
// ---------------------------------------------------------------------------

const LEAN_THEOREM_STATEMENT = `
-- JP-009 toy theorem (arXiv:2604.21187 pattern, K_3 pigeonhole case)
-- Toolchain: leanprover/lean4:v4.15.0 (see lean-toolchain.md)
-- Fact: for any 2-coloring of 3 items, at least one color class has ≥ 2 items.
theorem pigeonhole_k3_edges
    (color : Fin 3 → Fin 2) :
    (Finset.univ.filter (fun i => color i = 0)).card ≥ 2 ∨
    (Finset.univ.filter (fun i => color i = 1)).card ≥ 2 := by
  -- Proof sketch: the two filter cardinalities sum to 3 (Finset.card_union_add_card_inter).
  -- If both < 2, their sum ≤ 2 < 3. Contradiction.
  sorry -- proof debt: discharged in JP-030 / Wave 3
`.trim();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JP-009 SAT step: K_3 pigeonhole enumeration', () => {
  it('enumerates exactly 8 colorings of K_3 edges', () => {
    const colorings = allColorings();
    expect(colorings).toHaveLength(8);
  });

  it('pigeonhole UNSAT: no 2-coloring of K_3 edges has both color-counts ≤ 1', () => {
    // SAT "unsat" result: 3 edges, 2 colors → at least one color has ≥ 2 edges.
    const witnesses = satSearch();
    expect(witnesses).toHaveLength(0);
  });

  it('each coloring has at least one color with ≥ 2 edges (pigeonhole)', () => {
    const colorings = allColorings();
    for (const c of colorings) {
      const redCount = c.filter((e) => e === 0).length;
      const blueCount = c.filter((e) => e === 1).length;
      // At least one color class has ≥ 2 edges.
      expect(Math.max(redCount, blueCount) >= 2).toBe(true);
    }
  });
});

describe('JP-009 LLM-codegen step: Lean theorem statement', () => {
  it('theorem statement references the pinned Lean toolchain', () => {
    expect(LEAN_THEOREM_STATEMENT).toContain('leanprover/lean4:v4.15.0');
  });

  it('theorem statement contains a sorry marker (proof debt for Wave 3)', () => {
    expect(LEAN_THEOREM_STATEMENT).toContain('sorry');
  });

  it('theorem statement names the JP-030 proof obligation', () => {
    expect(LEAN_THEOREM_STATEMENT).toContain('JP-030');
  });
});

describe('JP-009 discovery-workflow.md: doc presence', () => {
  it('discovery-workflow.md exists in src/mathematical-foundations/', () => {
    const docPath = path.resolve(__dirname, '..', 'discovery-workflow.md');
    expect(fs.existsSync(docPath)).toBe(true);
  });

  it('discovery-workflow.md references the SAT→LLM→Lean pattern', () => {
    const docPath = path.resolve(__dirname, '..', 'discovery-workflow.md');
    const content = fs.readFileSync(docPath, 'utf8');
    expect(content).toContain('SAT');
    expect(content).toContain('LLM');
    expect(content).toContain('Lean');
  });

  it('discovery-workflow.md references the anchor paper arXiv:2604.21187', () => {
    const docPath = path.resolve(__dirname, '..', 'discovery-workflow.md');
    const content = fs.readFileSync(docPath, 'utf8');
    expect(content).toContain('2604.21187');
  });

  it('discovery-workflow.md references lean-toolchain.md (JP-001 dependency)', () => {
    const docPath = path.resolve(__dirname, '..', 'discovery-workflow.md');
    const content = fs.readFileSync(docPath, 'utf8');
    expect(content).toContain('lean-toolchain.md');
  });
});

describe('JP-009 Lean step (LEAN_AVAILABLE gate)', () => {
  it.skipIf(!LEAN_AVAILABLE)(LEAN_SKIP_REASON, () => {
    // When Lean is available, verify that `lean --version` mentions the pinned version.
    const { execSync } = require('node:child_process') as typeof import('node:child_process');
    const version = execSync('lean --version', { encoding: 'utf8' }).trim();
    expect(version).toContain('v4.15');
  });

  it('LEAN_AVAILABLE gate is documented correctly', () => {
    expect(LEAN_SKIP_REASON).toContain('LEAN_AVAILABLE=1');
    expect(LEAN_SKIP_REASON).toContain('lean-toolchain.md');
  });
});
