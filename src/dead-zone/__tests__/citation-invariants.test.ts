/**
 * Citation Invariants Test — v1.49.585 C03
 *
 * The four (five-assertion) bounded-learning constants below are CITATION-
 * ANCHORED ARCHITECTURAL INVARIANTS, not configuration. Each value is derived
 * from a published paper and cannot be changed without amending CITATION.md
 * and updating the citation-anchors specification document.
 *
 * If you are reading this because the test FAILED:
 *
 *   1. STOP.
 *   2. Re-read CLAUDE.md "External Citations" section.
 *   3. Re-read the cited arXiv paper for the constant in question.
 *   4. If the citation rationale has been superseded by a newer published
 *      derivation, author a CITATION.md amendment AND update
 *      .planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md
 *      FIRST, in the same commit as the value change.
 *   5. Then update this test (in the same commit as the value change).
 *
 * Citation anchors:
 *   cooldownDays = 7              → arXiv:2604.20874 (bounded-tape framing C1)
 *   diffThreshold = 0.20          → arXiv:2604.20915 (causal-synchronization KL bound)
 *   MAX_CORRECTIONS_BEFORE_BLOCK = 3  → arXiv:2604.20874 (bounded-tape three-correction implication)
 *   SMALL_DATA_FLOOR = 12         → arXiv:2604.21101 (hybridizable neural time integrator)
 *
 * If this test FAILS, do NOT change the assertion to make it pass. Engage
 * with the citation rationale first. See:
 *   .planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md
 *
 * Authored 2026-04-28 in v1.49.585 component C03.
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_COOLDOWN_ADAPTER_PARAMS } from '../cooldown-adapter.js';
import { DEFAULT_DEAD_ZONE_PARAMS } from '../diff-bound-adapter.js';
import { MAX_CORRECTIONS_BEFORE_BLOCK, SMALL_DATA_FLOOR } from '../settings.js';

describe('citation invariants — bounded-learning architectural anchors', () => {
  it('cooldownDays = 7 in DEFAULT_COOLDOWN_ADAPTER_PARAMS (arXiv:2604.20874)', () => {
    expect(DEFAULT_COOLDOWN_ADAPTER_PARAMS.cooldownDays).toBe(7);
  });

  it('cooldownDays = 7 in DEFAULT_DEAD_ZONE_PARAMS (arXiv:2604.20874)', () => {
    expect(DEFAULT_DEAD_ZONE_PARAMS.cooldownDays).toBe(7);
  });

  it('diffThreshold = 0.20 in DEFAULT_DEAD_ZONE_PARAMS (arXiv:2604.20915)', () => {
    expect(DEFAULT_DEAD_ZONE_PARAMS.diffThreshold).toBe(0.20);
  });

  it('MAX_CORRECTIONS_BEFORE_BLOCK = 3 (arXiv:2604.20874)', () => {
    expect(MAX_CORRECTIONS_BEFORE_BLOCK).toBe(3);
  });

  it('SMALL_DATA_FLOOR = 12 (arXiv:2604.21101)', () => {
    expect(SMALL_DATA_FLOOR).toBe(12);
  });
});
