/**
 * Tests for `src/model-affinity/actuator.ts` — the ME-2 dispatch actuator.
 *
 * Coverage:
 *   - CF-ME2-01: flag-off is a byte-identical no-op (returns base, ignores decisions).
 *   - escalation tier selection: strongest target wins; ties accumulate drivers.
 *   - base-model floor: an escalation at/below the base never downgrades or "escalates".
 *   - `inherit` base (tier −1) is replaced by any concrete escalation.
 *   - CF-ME2-02: `shouldEscalate: false` (coin-flip) never escalates.
 *   - defensive guards: `escalateTo` of `'unknown'` / `undefined` is ignored.
 */

import { describe, it, expect } from 'vitest';
import { resolveDispatchModel, type DispatchModel } from '../actuator.js';
import type { AffinityDecision } from '../policy.js';
import type { ModelFamily } from '../schema.js';

// ─── Fixtures ──────────────────────────────────────────

/** A decision that escalates to a concrete tier (tractable + unreliable). */
function escalating(escalateTo: ModelFamily): AffinityDecision {
  return {
    ok: false,
    penalty: 0.5,
    shouldEscalate: true,
    escalateTo,
    reason: `unreliable on base; suggest ${escalateTo}`,
  };
}

/** A penalised-but-non-escalating decision (coin-flip / neutral). */
function nonEscalating(): AffinityDecision {
  return { ok: false, penalty: 0.1, shouldEscalate: false, reason: 'coin-flip' };
}

function decisions(
  entries: Array<[string, AffinityDecision | null]>,
): ReadonlyMap<string, AffinityDecision | null> {
  return new Map(entries);
}

// ─── Flag-off: byte-identical no-op (CF-ME2-01) ─────────

describe('resolveDispatchModel — flag-off (CF-ME2-01)', () => {
  it('returns base unchanged even when a decision WOULD escalate', () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', escalating('opus')]]),
      'sonnet',
      false,
    );
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
    expect(r.from).toBeUndefined();
    expect(r.to).toBeUndefined();
    expect(r.drivers).toBeUndefined();
  });

  it('ignores multiple escalating decisions when disabled', () => {
    const r = resolveDispatchModel(
      decisions([
        ['skill-a', escalating('opus')],
        ['skill-b', escalating('sonnet')],
      ]),
      'haiku',
      false,
    );
    expect(r.model).toBe('haiku');
    expect(r.escalated).toBe(false);
  });
});

// ─── Flag-on: no escalation cases ───────────────────────

describe('resolveDispatchModel — flag-on, no escalation', () => {
  it('empty decision map → base unchanged', () => {
    const r = resolveDispatchModel(decisions([]), 'sonnet', true);
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('all-null decisions → base unchanged', () => {
    const r = resolveDispatchModel(
      decisions([
        ['skill-a', null],
        ['skill-b', null],
      ]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('non-escalating decision (coin-flip, CF-ME2-02) → base unchanged', () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', nonEscalating()]]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('escalation at the base tier → not strictly above → base unchanged', () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', escalating('sonnet')]]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('escalation below the base tier → never downgrades', () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', escalating('sonnet')]]),
      'opus',
      true,
    );
    expect(r.model).toBe('opus');
    expect(r.escalated).toBe(false);
  });
});

// ─── Flag-on: escalation cases ──────────────────────────

describe('resolveDispatchModel — flag-on, escalation fires', () => {
  it('single escalation above base → raises model and reports drivers', () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', escalating('opus')]]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('opus');
    expect(r.escalated).toBe(true);
    expect(r.from).toBe('sonnet');
    expect(r.to).toBe('opus');
    expect(r.drivers).toEqual(['skill-a']);
  });

  it('picks the STRONGEST escalation tier across skills', () => {
    const r = resolveDispatchModel(
      decisions([
        ['skill-a', escalating('sonnet')],
        ['skill-b', escalating('opus')],
        ['skill-c', nonEscalating()],
      ]),
      'haiku',
      true,
    );
    expect(r.model).toBe('opus');
    expect(r.escalated).toBe(true);
    expect(r.drivers).toEqual(['skill-b']); // only the strongest driver
  });

  it('ties at the strongest tier accumulate all drivers (in iteration order)', () => {
    const r = resolveDispatchModel(
      decisions([
        ['skill-a', escalating('opus')],
        ['skill-b', escalating('opus')],
      ]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('opus');
    expect(r.drivers).toEqual(['skill-a', 'skill-b']);
  });

  it("base 'inherit' is replaced by any concrete escalation", () => {
    const r = resolveDispatchModel(
      decisions([['skill-a', escalating('haiku')]]),
      'inherit',
      true,
    );
    expect(r.model).toBe('haiku');
    expect(r.escalated).toBe(true);
    expect(r.from).toBe('inherit');
  });
});

// ─── Defensive guards ───────────────────────────────────

describe('resolveDispatchModel — defensive guards', () => {
  it("ignores escalateTo === 'unknown'", () => {
    const decision: AffinityDecision = {
      ok: false,
      penalty: 0.5,
      shouldEscalate: true,
      escalateTo: 'unknown' as ModelFamily,
    };
    const r = resolveDispatchModel(decisions([['skill-a', decision]]), 'sonnet', true);
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('ignores shouldEscalate:true with missing escalateTo', () => {
    const decision: AffinityDecision = {
      ok: false,
      penalty: 0.5,
      shouldEscalate: true,
      // escalateTo intentionally absent
    };
    const r = resolveDispatchModel(decisions([['skill-a', decision]]), 'sonnet', true);
    expect(r.model).toBe('sonnet');
    expect(r.escalated).toBe(false);
  });

  it('a guarded skill does not suppress a valid escalation on another skill', () => {
    const bad: AffinityDecision = {
      ok: false,
      penalty: 0.5,
      shouldEscalate: true,
      escalateTo: 'unknown' as ModelFamily,
    };
    const r = resolveDispatchModel(
      decisions([
        ['skill-bad', bad],
        ['skill-good', escalating('opus')],
      ]),
      'sonnet',
      true,
    );
    expect(r.model).toBe('opus');
    expect(r.drivers).toEqual(['skill-good']);
  });
});

// ─── Exhaustive base × target matrix (escalate iff target tier > base tier) ───

describe('resolveDispatchModel — base × target tier matrix', () => {
  const TIER: Record<DispatchModel, number> = { inherit: -1, haiku: 0, sonnet: 1, opus: 2 };
  const bases: DispatchModel[] = ['inherit', 'haiku', 'sonnet', 'opus'];
  // Concrete escalation targets only (escalateTo is never 'unknown'/'inherit').
  const targets: Array<'haiku' | 'sonnet' | 'opus'> = ['haiku', 'sonnet', 'opus'];

  it('escalates exactly when the target tier exceeds the base tier', () => {
    let checked = 0;
    for (const base of bases) {
      for (const target of targets) {
        const r = resolveDispatchModel(
          decisions([['s', escalating(target)]]),
          base,
          true,
        );
        const shouldEscalate = TIER[target] > TIER[base];
        expect(r.escalated).toBe(shouldEscalate);
        expect(r.model).toBe(shouldEscalate ? target : base);
        checked++;
      }
    }
    expect(checked).toBe(bases.length * targets.length);
  });
});
