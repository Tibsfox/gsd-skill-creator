/**
 * MA-3 / MD-2 stochastic-bridge wire into ActivationSelector.select().
 *
 * Covers the WIRE (selector consulting the bridge), not the bridge internals
 * (those live in src/stochastic/__tests__/selector-bridge.test.ts). Load-bearing
 * invariants of the wire:
 *   - flag-off (default) ⇒ deterministic ranking, unchanged
 *   - enabled but NOT in a branch context ⇒ deterministic (bridge no-op)
 *   - baseTemperature 0 ⇒ deterministic (T=0 safety valve)
 *   - enabled + in-branch + seeded rng ⇒ reproducible AND a permutation of the
 *     deterministic set; only position 0 is promoted, the tail order is preserved
 *   - exploration actually reaches the single-selection (topK=1) path
 *   - the module-level select() wrapper honors opts.stochastic + context
 */
import { describe, it, expect } from 'vitest';
import {
  ActivationSelector,
  select,
  type Candidate,
  type SelectorOptions,
} from '../selector.js';
import type { ActivationWriter } from '../../traces/activation-writer.js';
import { mulberry32 } from '../../stochastic/sampler.js';

// No-op trace writer — keeps these unit tests pure (no disk I/O) and fast.
const noopWriter = { activation: async () => undefined } as unknown as ActivationWriter;

function candidatesFixture(): Candidate[] {
  // Same content token (equal M2 relevance) + distinct importance ⇒ distinct,
  // closely-spaced composite scores. Close spacing makes softmax exploration
  // reachable while distinct scores keep the deterministic order unambiguous.
  return [
    { id: 'a', content: 'shared task token', importance: 0.55 },
    { id: 'b', content: 'shared task token', importance: 0.5 },
    { id: 'c', content: 'shared task token', importance: 0.45 },
    { id: 'd', content: 'shared task token', importance: 0.4 },
    { id: 'e', content: 'shared task token', importance: 0.35 },
  ];
}

const ids = (ds: Array<{ id: string }>): string[] => ds.map((d) => d.id);

function selector(opts: SelectorOptions = {}): ActivationSelector {
  return new ActivationSelector({ writer: noopWriter, ...opts });
}

const QUERY = 'shared task token';

describe('ActivationSelector — MA-3 stochastic wire', () => {
  it('flag-off (default) is deterministic and unchanged across calls', async () => {
    const sel = selector();
    const a = ids(await sel.select(QUERY, candidatesFixture()));
    const b = ids(await sel.select(QUERY, candidatesFixture()));
    expect(a).toEqual(b);
    expect(a.length).toBe(5);
  });

  it('enabled but NOT in a branch context matches the deterministic baseline', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const out = ids(
      await selector({ stochastic: { enabled: true } }).select(QUERY, candidatesFixture(), {
        inBranchContext: false,
        tractabilityClass: 'tractable',
        rng: mulberry32(7),
      }),
    );
    expect(out).toEqual(baseline);
  });

  it('enabled but context omits inBranchContext matches the baseline', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const out = ids(
      await selector({ stochastic: { enabled: true } }).select(QUERY, candidatesFixture(), {
        rng: mulberry32(7),
      }),
    );
    expect(out).toEqual(baseline);
  });

  it('baseTemperature 0 collapses temperature → deterministic (T=0 safety valve)', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 0 } });
    for (let seed = 1; seed <= 20; seed++) {
      const out = ids(
        await sel.select(QUERY, candidatesFixture(), {
          inBranchContext: true,
          tractabilityClass: 'tractable',
          rng: mulberry32(seed),
        }),
      );
      expect(out).toEqual(baseline);
    }
  });

  it('enabled + in-branch + seeded rng is reproducible across instances', async () => {
    const mk = () =>
      selector({ stochastic: { enabled: true, baseTemperature: 2.0 } }).select(
        QUERY,
        candidatesFixture(),
        { inBranchContext: true, tractabilityClass: 'tractable', rng: mulberry32(42) },
      );
    expect(ids(await mk())).toEqual(ids(await mk()));
  });

  it('exploration is always a permutation of the deterministic set', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 2.0 } });
    for (let seed = 1; seed <= 40; seed++) {
      const out = ids(
        await sel.select(QUERY, candidatesFixture(), {
          inBranchContext: true,
          tractabilityClass: 'tractable',
          rng: mulberry32(seed),
        }),
      );
      expect([...out].sort()).toEqual([...baseline].sort());
    }
  });

  it('exploration actually re-orders position 0 for some seed (the wire is live)', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 2.0 } });
    let sawDifferentWinner = false;
    for (let seed = 1; seed <= 80 && !sawDifferentWinner; seed++) {
      const out = ids(
        await sel.select(QUERY, candidatesFixture(), {
          inBranchContext: true,
          tractabilityClass: 'tractable',
          rng: mulberry32(seed),
        }),
      );
      if (out[0] !== baseline[0]) sawDifferentWinner = true;
    }
    expect(sawDifferentWinner).toBe(true);
  });

  it('only position 0 is promoted; the tail keeps deterministic order (bridge contract)', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 2.0 } });
    let checked = false;
    for (let seed = 1; seed <= 80; seed++) {
      const out = ids(
        await sel.select(QUERY, candidatesFixture(), {
          inBranchContext: true,
          tractabilityClass: 'tractable',
          rng: mulberry32(seed),
        }),
      );
      if (out[0] === baseline[0]) continue; // only inspect genuinely re-ordered runs
      checked = true;
      const winner = out[0];
      // baseline with the promoted winner removed, in baseline order:
      const baselineMinusWinner = baseline.filter((x) => x !== winner);
      expect(out.slice(1)).toEqual(baselineMinusWinner);
    }
    expect(checked).toBe(true);
  });

  it('topK=1 single-selection path is reachable by exploration', async () => {
    const baselineTop = ids(await selector({ topK: 1 }).select(QUERY, candidatesFixture()))[0];
    const sel = selector({ topK: 1, stochastic: { enabled: true, baseTemperature: 2.0 } });
    let sawNonArgmax = false;
    for (let seed = 1; seed <= 80 && !sawNonArgmax; seed++) {
      const out = await sel.select(QUERY, candidatesFixture(), {
        inBranchContext: true,
        tractabilityClass: 'tractable',
        rng: mulberry32(seed),
      });
      expect(out.length).toBe(1);
      if (out[0].id !== baselineTop) sawNonArgmax = true;
    }
    expect(sawNonArgmax).toBe(true);
  });

  it('module-level select() wrapper honors opts.stochastic + context', async () => {
    const baseline = ids(await select(QUERY, candidatesFixture(), { writer: noopWriter }));
    const mk = () =>
      select(
        QUERY,
        candidatesFixture(),
        { writer: noopWriter, stochastic: { enabled: true, baseTemperature: 2.0 } },
        { inBranchContext: true, tractabilityClass: 'tractable', rng: mulberry32(42) },
      );
    const a = ids(await mk());
    const b = ids(await mk());
    expect(a).toEqual(b); // honored + reproducible
    expect([...a].sort()).toEqual([...baseline].sort()); // permutation of baseline
    // disabled wrapper stays deterministic even with a branch context supplied
    const off = ids(
      await select(QUERY, candidatesFixture(), { writer: noopWriter }, {
        inBranchContext: true,
        tractabilityClass: 'tractable',
        rng: mulberry32(42),
      }),
    );
    expect(off).toEqual(baseline);
  });

  it('tractabilityClass defaults to "unknown" when omitted (no throw, permutation holds)', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const out = ids(
      await selector({ stochastic: { enabled: true, baseTemperature: 2.0 } }).select(
        QUERY,
        candidatesFixture(),
        { inBranchContext: true, rng: mulberry32(5) }, // no tractabilityClass
      ),
    );
    expect([...out].sort()).toEqual([...baseline].sort());
  });

  it("re-ordering preserves each decision's score and signals payload", async () => {
    const baselineDecisions = await selector().select(QUERY, candidatesFixture());
    const scoreById = new Map(baselineDecisions.map((d) => [d.id, d.score]));
    const baselineWinner = ids(baselineDecisions)[0];
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 2.0 } });
    let inspectedReorder = false;
    for (let seed = 1; seed <= 80; seed++) {
      const out = await sel.select(QUERY, candidatesFixture(), {
        inBranchContext: true,
        tractabilityClass: 'tractable',
        rng: mulberry32(seed),
      });
      // Every returned decision keeps the score its id earned deterministically
      // and carries a well-formed payload — the bridge re-orders, never rewrites.
      for (const d of out) {
        expect(d.score).toBe(scoreById.get(d.id));
        expect(d.signals).toBeDefined();
        expect(typeof d.activated).toBe('boolean');
      }
      if (ids(out)[0] !== baselineWinner) inspectedReorder = true;
    }
    expect(inspectedReorder).toBe(true);
  });

  it('coin-flip tractabilityClass still yields a permutation of the baseline', async () => {
    const baseline = ids(await selector().select(QUERY, candidatesFixture()));
    const sel = selector({ stochastic: { enabled: true, baseTemperature: 2.0 } });
    for (let seed = 1; seed <= 20; seed++) {
      const out = ids(
        await sel.select(QUERY, candidatesFixture(), {
          inBranchContext: true,
          tractabilityClass: 'coin-flip',
          rng: mulberry32(seed),
        }),
      );
      expect([...out].sort()).toEqual([...baseline].sort());
    }
  });

  it('default baseTemperature equals an explicit 1.0 (the default is honored)', async () => {
    const def = selector({ stochastic: { enabled: true } }); // baseTemperature defaults to 1.0
    const explicit = selector({ stochastic: { enabled: true, baseTemperature: 1.0 } });
    const base = { inBranchContext: true, tractabilityClass: 'tractable' as const };
    for (let seed = 1; seed <= 30; seed++) {
      // Each call gets its OWN seeded RNG instance — mulberry32 is stateful, so
      // sharing one instance across the two calls would diverge them spuriously.
      const a = ids(await def.select(QUERY, candidatesFixture(), { ...base, rng: mulberry32(seed) }));
      const b = ids(await explicit.select(QUERY, candidatesFixture(), { ...base, rng: mulberry32(seed) }));
      expect(a).toEqual(b);
    }
  });
});
