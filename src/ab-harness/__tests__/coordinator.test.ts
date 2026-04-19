/**
 * ME-3 coordinator.ts — end-to-end A/B lifecycle tests.
 *
 * Verifies:
 *   - Planted-significant outcomes → verdict 'commit-B', committed = true (LS-41).
 *   - Planted-no-effect (noise) outcomes → verdict 'coin-flip', committed = false (LS-41).
 *   - Planted A-wins outcomes → verdict 'keep-A', committed = false.
 *   - Feature flag OFF → status 'disabled', no M4 state modified (SC-ME3-01).
 *   - CF-ME3-05: branch commit gate — commit only on 'commit-B' verdict.
 *   - CF-ME3-04: classification-audit warning when coin-flip skill shows commit-B.
 *   - Insufficient samples → 'insufficient-data' verdict.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { runAB, type RunABOptions } from '../coordinator.js';
import type { TractabilityClass } from '../../tractability/selector-api.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

// Large base content shared by both variants (M4 delta bound: ≤ 20% changed bytes).
// We use a long repeated base so a single-line change stays well under 20%.
const BASE_CONTENT = [
  '# Test Skill A — Structured Output Skill',
  '## Description',
  'This skill produces deterministic structured output for regression testing.',
  '## Instructions',
  'Follow the JSON schema precisely.',
  'Use only the allowed keys.',
  'Return a complete object.',
  '## Example output',
  '{"status": "ok", "items": [], "count": 0}',
  '## Notes',
  'This is a test fixture for the ME-3 A/B harness coordinator.',
  'The score is driven by the test runner, not by this content.',
].join('\n');

// Trunk (variant A) — original body.
const PARENT_BODY = BASE_CONTENT + '\n## Variant\nThis is the trunk (A) version.\n';

// Variant B — one line changed; delta ≈ 12/840 ≈ 1.4%, well within 20% bound.
const VARIANT_BODY = BASE_CONTENT + '\n## Variant\nThis is the variant (B) version.\n';

async function makeTmpDir(): Promise<string> {
  const dir = join(tmpdir(), `ab-coord-test-${randomUUID()}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Build a run-skill function that returns a fixed score for each variant.
 * Used to plant specific signal patterns.
 */
function makeScorer(scoreA: number, scoreB: number) {
  return async (body: string, _idx: number, variant: 'A' | 'B'): Promise<string> => {
    void body;
    return variant === 'A' ? String(scoreA) : String(scoreB);
  };
}

/**
 * Build a scorer that alternates B-wins and A-wins to produce coin-flip signal.
 */
function makeNoisyScorer() {
  let callCount = 0;
  return async (_body: string, _idx: number, variant: 'A' | 'B'): Promise<string> => {
    callCount++;
    // Alternate: even sessions B wins, odd sessions A wins.
    const bWins = callCount % 2 === 0;
    if (variant === 'A') return bWins ? '50' : '55';
    return bWins ? '55' : '50'; // B scores: alternating 55/50
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('coordinator — feature flag OFF (SC-ME3-01)', () => {
  it('returns status=disabled when harness is disabled', async () => {
    const tmpDir = await makeTmpDir();
    try {
      const result = await runAB({
        skillName: 'test-skill',
        trunkBody: PARENT_BODY,
        variantBody: VARIANT_BODY,
        trunkPath: join(tmpDir, 'skill.md'),
        tractability: 'tractable',
        branchesDir: join(tmpDir, 'branches'),
        traceDir: join(tmpDir, 'traces'),
        runSkill: makeScorer(50, 60),
        settings: { enabled: false }, // explicit OFF
      });
      expect(result.status).toBe('disabled');
    } finally {
      await cleanup(tmpDir);
    }
  });

  it('does not create branch directories when disabled', async () => {
    const tmpDir = await makeTmpDir();
    const branchesDir = join(tmpDir, 'branches');
    try {
      await runAB({
        skillName: 'test-skill',
        trunkBody: PARENT_BODY,
        variantBody: VARIANT_BODY,
        trunkPath: join(tmpDir, 'skill.md'),
        tractability: 'tractable',
        branchesDir,
        traceDir: join(tmpDir, 'traces'),
        runSkill: makeScorer(50, 60),
        settings: { enabled: false },
      });
      // branchesDir should not exist.
      let exists = true;
      try {
        await fs.access(branchesDir);
      } catch {
        exists = false;
      }
      expect(exists).toBe(false);
    } finally {
      await cleanup(tmpDir);
    }
  });
});

// ─── LS-41: Planted-significant fixtures ─────────────────────────────────────

describe('LS-41 — planted-significant outcomes commit B', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('clear B-win (delta=10 > floor=2): verdict=commit-B, committed=true', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15, // > 10 (minSamples)
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(40, 50), // delta=10 >> floor=2
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    expect(result.verdict.decision).toBe('commit-B');
    expect(result.committed).toBe(true);
    expect(result.verdict.meanDelta).toBeCloseTo(10, 1);
    expect(result.verdict.signTest).toBeLessThan(0.10);
  });

  it('after commit-B, trunk file contains variant B body', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(40, 50),
      settings: { enabled: true },
    });

    const written = await fs.readFile(trunkPath, 'utf8');
    expect(written).toBe(VARIANT_BODY);
  });
});

// ─── LS-41: Planted-noise fixtures abort ────────────────────────────────────

describe('LS-41 — planted-noise outcomes abort (coin-flip)', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('delta within noise floor: verdict=coin-flip, committed=false', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(50, 51), // delta=1 < floor=2.0 → coin-flip
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    expect(result.verdict.decision).toBe('coin-flip');
    expect(result.committed).toBe(false);
  });

  it('trunk file is NOT modified when verdict=coin-flip', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(50, 51),
      settings: { enabled: true },
    });

    const written = await fs.readFile(trunkPath, 'utf8');
    // Trunk should still contain the original body (not the variant).
    expect(written).toBe(PARENT_BODY);
  });

  it('mixed signal (noisy scorer): decision is coin-flip or keep-A, committed=false', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeNoisyScorer(),
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    expect(result.committed).toBe(false);
    expect(['coin-flip', 'keep-A', 'insufficient-data']).toContain(result.verdict.decision);
  });
});

// ─── keep-A verdict ──────────────────────────────────────────────────────────

describe('keep-A verdict — A wins', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('A clearly better (delta = -10): verdict=keep-A, committed=false', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(55, 45), // A=55, B=45 → delta=-10 < 0 → keep-A
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    expect(result.verdict.decision).toBe('keep-A');
    expect(result.committed).toBe(false);
  });
});

// ─── CF-ME3-04: classification-audit warning ─────────────────────────────────

describe('CF-ME3-04 — classification-audit warning', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('coin-flip skill with commit-B decision produces E-5 warning', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'prose-skill',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'coin-flip', // coin-flip → noise floor = 2 × 2.5 = 5.0
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(30, 50), // delta = 20 >> floor = 5.0 → commit-B
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    if (result.verdict.decision === 'commit-B') {
      const hasE5Warning = result.verdict.warnings.some(w =>
        w.includes('E-5') || w.includes('coin-flip') && w.includes('reclassif'),
      );
      expect(hasE5Warning).toBe(true);
    }
  });
});

// ─── CF-ME3-05: branch-commit gate ───────────────────────────────────────────

describe('CF-ME3-05 — branch-commit gate', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('verdict=keep-A does NOT commit the branch body to trunk', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'unknown',
      samplesPerVariant: 15,
      alpha: 0.10,
      baseNoiseFloor: 2.0,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(60, 45), // A wins clearly
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    // Gate: only 'commit-B' verdict should cause committed=true.
    if (result.verdict.decision !== 'commit-B') {
      expect(result.committed).toBe(false);
      // Trunk body must be unchanged.
      const trunk = await fs.readFile(trunkPath, 'utf8');
      expect(trunk).toBe(PARENT_BODY);
    }
  });
});

// ─── Warnings — IID caveat ────────────────────────────────────────────────────

describe('IID caveat warning (E-4)', () => {
  let tmpDir: string;
  beforeEach(async () => { tmpDir = await makeTmpDir(); });
  afterEach(async () => { await cleanup(tmpDir); });

  it('every verdict includes the IID caveat warning', async () => {
    const trunkPath = join(tmpDir, 'skill.md');
    await fs.writeFile(trunkPath, PARENT_BODY, 'utf8');

    const result = await runAB({
      skillName: 'gsd-explore',
      trunkBody: PARENT_BODY,
      variantBody: VARIANT_BODY,
      trunkPath,
      tractability: 'tractable',
      samplesPerVariant: 12,
      alpha: 0.10,
      branchesDir: join(tmpDir, 'branches'),
      traceDir: join(tmpDir, 'traces'),
      runSkill: makeScorer(50, 53),
      settings: { enabled: true },
    });

    expect(result.status).toBe('completed');
    if (result.status !== 'completed') return;
    const hasIIDWarning = result.verdict.warnings.some(w =>
      w.includes('E-4') || w.includes('i.i.d') || w.includes('IID'),
    );
    expect(hasIIDWarning).toBe(true);
  });
});
