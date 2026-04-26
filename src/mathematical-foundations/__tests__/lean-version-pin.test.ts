/**
 * JP-001 (BLOCK, Phase 828) — lean-toolchain.md existence + content assertions.
 *
 * Verifies that the Lean toolchain pin document:
 *   1. Exists at the canonical path.
 *   2. Contains the pinned Lean toolchain version string.
 *   3. Contains the Mathlib commit hash field (placeholder or verified).
 *   4. References arXiv:2510.04070 (Degenne et al. Markov kernels formalization).
 *   5. References arXiv:2604.20915 (target Lean statement — Absorber LLM).
 *
 * These are pure filesystem / string assertions — no Lean installation required.
 * The smoke test (lean-build-smoke.test.ts) gates on LEAN_AVAILABLE=1.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const TOOLCHAIN_DOC = path.join(
  process.cwd(),
  'src',
  'mathematical-foundations',
  'lean-toolchain.md',
);

// Pinned values that the document must declare. Update these constants when
// bumping the pin (see lean-toolchain.md §How to Bump the Pin).
const EXPECTED_TOOLCHAIN_VERSION = 'leanprover/lean4:v4.15.0';

// Mathlib commit hash field: either the real 40-char SHA or the documented
// placeholder. The assertion checks for the placeholder tag so the test
// remains green until the real hash is verified and substituted.
const MATHLIB_HASH_PLACEHOLDER = '<MATHLIB_COMMIT_HASH_TO_VERIFY>';

// arXiv IDs required in the document.
const ARXIV_MARKOV_KERNELS = 'arXiv:2510.04070';
const ARXIV_TARGET_STATEMENT = 'arXiv:2604.20915';

describe('JP-001 lean-toolchain.md pin assertions', () => {
  it('lean-toolchain.md exists at src/mathematical-foundations/lean-toolchain.md', () => {
    expect(fs.existsSync(TOOLCHAIN_DOC)).toBe(true);
  });

  it(`document declares Lean toolchain version "${EXPECTED_TOOLCHAIN_VERSION}"`, () => {
    const content = fs.readFileSync(TOOLCHAIN_DOC, 'utf8');
    expect(content).toContain(EXPECTED_TOOLCHAIN_VERSION);
  });

  it('document contains a Mathlib commit hash field (placeholder or verified SHA)', () => {
    const content = fs.readFileSync(TOOLCHAIN_DOC, 'utf8');
    // Accept either the placeholder (pending verification) or any 40-char hex SHA.
    const hasPlaceholder = content.includes(MATHLIB_HASH_PLACEHOLDER);
    const hasRealHash = /\b[0-9a-f]{40}\b/.test(content);
    expect(hasPlaceholder || hasRealHash).toBe(true);
  });

  it(`document references ${ARXIV_MARKOV_KERNELS} (Degenne et al. Markov kernels)`, () => {
    const content = fs.readFileSync(TOOLCHAIN_DOC, 'utf8');
    expect(content).toContain(ARXIV_MARKOV_KERNELS);
  });

  it(`document references ${ARXIV_TARGET_STATEMENT} (target Lean statement)`, () => {
    const content = fs.readFileSync(TOOLCHAIN_DOC, 'utf8');
    expect(content).toContain(ARXIV_TARGET_STATEMENT);
  });

  it('document declares the four load-bearing Mathlib namespaces', () => {
    const content = fs.readFileSync(TOOLCHAIN_DOC, 'utf8');
    expect(content).toContain('MeasureTheory.Kernel');
    expect(content).toContain('MeasureTheory.KLDivergence');
    expect(content).toContain('ProbabilityTheory.entropy');
    expect(content).toContain('ProbabilityTheory.subgaussian');
  });
});
