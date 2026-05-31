/**
 * CF2a — M4 in-branch stochastic selector wire (v1.49.931).
 *
 * Proves end-to-end that `selectBranchVariant()` (and `explore()` consuming it)
 * is a REAL production caller of the M5 selector's `inBranchContext: true`
 * stochastic path — the path that, until this wire, only unit tests could reach
 * (live sessions are blocked by the ME-3 gate; CF-MA3-03). Drives a REAL
 * `ActivationSelector` over real candidate variants with a seeded `mulberry32`,
 * not a mock.
 *
 * Coverage:
 *   1. flag-off → deterministic argmax (byte-identical to plain ranking).
 *   2. flag-on + seed → reproducible choice (same seed ⇒ same variant).
 *   3. flag-on → stochastic spread across seeds (>1 distinct winner), whereas
 *      flag-off across the same seeds is a single winner. This is the
 *      load-bearing assertion: it can ONLY pass if `inBranchContext: true`
 *      reaches the bridge. (Mutation: forcing inBranchContext:false collapses
 *      the spread to 1 → test fails.)
 *   4. single variant / empty guards.
 *   5. explore() with `variantSelection` runs the CHOSEN variant body (the
 *      in-loop wire) and returns the selection; without it, behaviour is
 *      unchanged and no selection is attached.
 *
 * @module tests/integration/branch-variant-stochastic-wire
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  selectBranchVariant,
  type BranchVariant,
} from '../../src/branches/select-variant.js';
import { explore } from '../../src/branches/explore.js';
import type { BranchManifest } from '../../src/branches/manifest.js';

// Three well-separated variants: 'a' is the deterministic argmax (highest
// importance), mirroring the v927 selector-stochastic unit-test pool.
function variants(): Array<BranchVariant & { body: string }> {
  return [
    { id: 'a', content: 'alpha refactor', importance: 0.9, body: 'BODY_A' },
    { id: 'b', content: 'beta refactor', importance: 0.6, body: 'BODY_B' },
    { id: 'c', content: 'gamma refactor', importance: 0.3, body: 'BODY_C' },
  ];
}

describe('CF2a — in-branch stochastic branch-variant selection', () => {
  it('flag-off → deterministic argmax (highest-importance variant)', async () => {
    const sel = await selectBranchVariant({
      query: 'alpha',
      variants: variants(),
      branchSeed: 123,
      stochasticEnabled: false,
    });
    expect(sel.chosenId).toBe('a');
    expect(sel.stochastic).toBe(false);
    expect(sel.decisions.map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });

  it('flag-on + seed → reproducible choice (same seed ⇒ same winner)', async () => {
    const opts = {
      query: 'alpha',
      variants: variants(),
      branchSeed: 7,
      baseTemperature: 2.0,
      stochasticEnabled: true,
    };
    const a = await selectBranchVariant(opts);
    const b = await selectBranchVariant(opts);
    expect(a.chosenId).toBe(b.chosenId);
    expect(a.stochastic).toBe(true);
    // The chosen variant object is the one whose id won.
    expect(a.chosen.id).toBe(a.chosenId);
    expect(a.chosen.body).toBe(`BODY_${a.chosenId.toUpperCase()}`);
  });

  it('flag-on → stochastic spread across seeds; flag-off → single winner (load-bearing)', async () => {
    const winners = async (stochasticEnabled: boolean) => {
      const ids = new Set<string>();
      for (let seed = 0; seed < 40; seed++) {
        const sel = await selectBranchVariant({
          query: 'alpha',
          variants: variants(),
          branchSeed: seed,
          baseTemperature: 2.0,
          stochasticEnabled,
        });
        ids.add(sel.chosenId);
      }
      return ids;
    };

    const onIds = await winners(true);
    const offIds = await winners(false);

    // Flag-on: the in-branch stochastic path produces a spread of winners.
    // This can ONLY happen if inBranchContext:true reaches the bridge.
    expect(onIds.size).toBeGreaterThan(1);
    // Flag-off: every seed yields the deterministic argmax — a single winner.
    expect(offIds).toEqual(new Set(['a']));
  });

  it('single variant → that variant, stochastic=false', async () => {
    const sel = await selectBranchVariant({
      query: 'solo',
      variants: [{ id: 'only', content: 'only option', importance: 0.5, body: 'X' }],
      branchSeed: 1,
      stochasticEnabled: true,
    });
    expect(sel.chosenId).toBe('only');
    expect(sel.stochastic).toBe(false);
  });

  it('empty variants → throws', async () => {
    await expect(
      selectBranchVariant({ query: 'q', variants: [], branchSeed: 1 }),
    ).rejects.toThrow(/non-empty/);
  });

  // ── explore() in-loop wire ────────────────────────────────────────────────
  describe('explore() consumes selectBranchVariant', () => {
    let tmpRoot: string;
    let branchesDir: string;
    let traceDir: string;
    const branchId = 'branch-test-cf2a';

    beforeEach(() => {
      tmpRoot = mkdtempSync(join(tmpdir(), 'cf2a-explore-'));
      branchesDir = join(tmpRoot, 'branches');
      traceDir = join(tmpRoot, 'traces');
      const branchDir = join(branchesDir, branchId);
      mkdirSync(branchDir, { recursive: true });
      mkdirSync(traceDir, { recursive: true });
      const manifest: BranchManifest = {
        branchId,
        skillName: 'test-skill',
        forkedAt: '2026-05-31T00:00:00.000Z',
        trunkHashAtFork: 'deadbeef',
        exploreSessionCount: 0,
        tracePaths: [],
        state: 'open',
      };
      writeFileSync(
        join(branchDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2) + '\n',
        'utf8',
      );
      // Note: deliberately NO skill.md — the variantSelection path must not read it.
    });

    afterEach(() => {
      try { rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* best-effort */ }
    });

    it('runs the CHOSEN variant body and returns the selection', async () => {
      const seenBranchBodies: string[] = [];
      const result = await explore({
        branchId,
        branchesDir,
        traceDir,
        trunkBody: 'TRUNK',
        sessionCount: 1,
        runSkill: async (body) => {
          seenBranchBodies.push(body);
          return 'ok';
        },
        variantSelection: {
          query: 'alpha',
          variants: variants(),
          branchSeed: 7,
          baseTemperature: 2.0,
          stochasticEnabled: true,
        },
      });

      expect(result.variantSelection).toBeDefined();
      const chosenId = result.variantSelection!.chosenId;
      const chosenBody = `BODY_${chosenId.toUpperCase()}`;
      // The branch side ran the chosen variant body (not skill.md, which is absent).
      expect(seenBranchBodies).toContain(chosenBody);
      // Reproducible: a second identical run picks the same variant.
      const result2 = await explore({
        branchId,
        branchesDir,
        traceDir,
        trunkBody: 'TRUNK',
        sessionCount: 1,
        runSkill: async () => 'ok',
        variantSelection: {
          query: 'alpha',
          variants: variants(),
          branchSeed: 7,
          baseTemperature: 2.0,
          stochasticEnabled: true,
        },
      });
      expect(result2.variantSelection!.chosenId).toBe(chosenId);
    });

    it('without variantSelection → reads skill.md, no selection attached', async () => {
      // Now the disk body IS required.
      writeFileSync(join(branchesDir, branchId, 'skill.md'), 'DISK_BODY', 'utf8');
      const seen: string[] = [];
      const result = await explore({
        branchId,
        branchesDir,
        traceDir,
        trunkBody: 'TRUNK',
        sessionCount: 1,
        runSkill: async (body) => {
          seen.push(body);
          return 'ok';
        },
      });
      expect(result.variantSelection).toBeUndefined();
      expect(seen).toContain('DISK_BODY');
    });
  });
});
