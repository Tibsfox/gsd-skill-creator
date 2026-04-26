/**
 * JP-003 (BLOCK, Phase 830) — CITATION.md existence + content assertions.
 *
 * Verifies that the bounded-learning citation pin document:
 *   1. Exists at the canonical path.
 *   2. References arXiv:2604.20915 (Absorber LLM causal-synchronization paper).
 *   3. References arXiv:2510.04070 (Degenne et al. Mathlib Markov kernels paper).
 *   4. Contains "compose" or "compose-with" (documents non-replacement of byte-diff cap).
 *   5. References lean-toolchain.md (cross-link to JP-001 deliverable).
 *
 * These are pure filesystem / string assertions — no Lean installation required.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const CITATION_DOC = path.join(
  process.cwd(),
  'src',
  'bounded-learning',
  'CITATION.md',
);

const ARXIV_CAUSAL_SYNC  = 'arXiv:2604.20915';
const ARXIV_MATHLIB_MK   = 'arXiv:2510.04070';

describe('JP-003 CITATION.md pin assertions', () => {
  it('CITATION.md exists at src/bounded-learning/CITATION.md', () => {
    expect(fs.existsSync(CITATION_DOC)).toBe(true);
  });

  it(`document references ${ARXIV_CAUSAL_SYNC} (Absorber LLM causal-synchronization)`, () => {
    const content = fs.readFileSync(CITATION_DOC, 'utf8');
    expect(content).toContain(ARXIV_CAUSAL_SYNC);
  });

  it(`document references ${ARXIV_MATHLIB_MK} (Degenne et al. Mathlib Markov kernels)`, () => {
    const content = fs.readFileSync(CITATION_DOC, 'utf8');
    expect(content).toContain(ARXIV_MATHLIB_MK);
  });

  it('document contains "compose" or "compose-with" (byte-diff cap is complementary, not replaced)', () => {
    const content = fs.readFileSync(CITATION_DOC, 'utf8');
    const hasCompose = content.toLowerCase().includes('compose');
    expect(hasCompose).toBe(true);
  });

  it('document references lean-toolchain.md (cross-link to JP-001)', () => {
    const content = fs.readFileSync(CITATION_DOC, 'utf8');
    expect(content).toContain('lean-toolchain.md');
  });
});
