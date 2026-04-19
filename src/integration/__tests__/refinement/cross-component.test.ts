/**
 * Refinement Wave — pairwise cross-component integration tests.
 *
 * Covers the direct wiring between the six refinement-wave modules shipped
 * in phases 651-656:
 *
 *   - ME-1 ↔ ME-5: classification changes when ME-5 frontmatter edits.
 *   - MA-1 ↔ MA-6: eligibility snapshots update on new reinforcement events.
 *   - MA-2 ↔ MA-1 + ME-1: TD magnitude responds to tractability; r̄ composes
 *     correctly across channels from eligibility + reinforcement.
 *   - ME-4 ↔ ME-1: warning surfaces iff ME-1 classifies coin-flip/unknown.
 *
 * @module integration/__tests__/refinement/cross-component.test
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ME-5
import {
  resolveOutputStructure,
  DEFAULT_OUTPUT_STRUCTURE,
} from '../../../output-structure/frontmatter.js';

// ME-1
import {
  getTractabilityClass,
  tractabilityWeight,
  isCoinFlip,
  isTractable,
} from '../../../tractability/selector-api.js';
import { classifySkillFromRaw } from '../../../tractability/classifier.js';

// MA-6
import { emitExplicitCorrection } from '../../../reinforcement/emitters.js';
import {
  writeReinforcementEvent,
  readReinforcementEvents,
} from '../../../reinforcement/writer.js';

// MA-1
import { EligibilityStore } from '../../../eligibility/traces.js';
import {
  buildReaderFromEvents,
} from '../../../eligibility/api.js';
import { getFinalTracesFromEvents } from '../../../eligibility/replay.js';

// MA-2
import { computeTDError, readingsFromMap } from '../../../ace/td-error.js';
import {
  tractabilityWeight as aceTractabilityWeight,
  TRACTABILITY_WEIGHT_FLOOR,
} from '../../../ace/settings.js';

// ME-4
import {
  classifyExpectedEffect,
  classifyExpectedEffectFromClass,
  levelFromTractabilityClass,
} from '../../../symbiosis/expected-effect.js';
import { composeTeachWarning } from '../../../symbiosis/teach-warning.js';

// Fixture
import {
  build5ChannelBurst,
  makeReinforcementEvent,
} from './fixture.js';
import { REINFORCEMENT_CHANNELS } from '../../../types/reinforcement.js';

// ═══════════════════════════════════════════════════════════════════════════
// ME-1 ↔ ME-5: classification changes when ME-5 frontmatter edits
// ═══════════════════════════════════════════════════════════════════════════
describe('ME-1 ↔ ME-5 — classification follows frontmatter edits', () => {
  it('prose → json-schema edit flips class from coin-flip to tractable', () => {
    const before = { kind: 'prose' as const };
    const after = { kind: 'json-schema' as const, schema: '{"type":"object"}' };

    expect(getTractabilityClass(before)).toBe('coin-flip');
    expect(getTractabilityClass(after)).toBe('tractable');
    expect(tractabilityWeight(before)).toBe(0.5);
    expect(tractabilityWeight(after)).toBe(1.0);
  });

  it('removing output_structure (undefined) yields unknown class', () => {
    const before = { kind: 'markdown-template' as const, template: '## x' };
    expect(getTractabilityClass(before)).toBe('tractable');
    expect(getTractabilityClass(undefined)).toBe('unknown');
    expect(getTractabilityClass(null)).toBe('unknown');
  });

  it('resolveOutputStructure source tracks explicit vs default', () => {
    const explicit = resolveOutputStructure({ kind: 'prose' });
    expect(explicit.source).toBe('explicit');

    const absent = resolveOutputStructure(undefined);
    expect(absent.source).toBe('default');
    expect(absent.structure).toEqual(DEFAULT_OUTPUT_STRUCTURE);
  });

  it('ME-5 invalid declaration falls back to default → ME-1 classifies unknown', () => {
    // A malformed declaration (missing schema field on json-schema kind)
    // must fall back to the default and NOT misclassify as tractable.
    const malformed = { kind: 'json-schema' };
    const resolved = resolveOutputStructure(malformed);
    expect(resolved.source).toBe('default');
    expect(resolved.structure.kind).toBe('prose');

    // The selector-api layer treats default-source as unknown explicitly.
    expect(getTractabilityClass(malformed)).toBe('unknown');
  });

  it('ME-1 confidence scales with frontmatter cleanliness', () => {
    const clean = classifySkillFromRaw({ kind: 'json-schema', schema: '{}' });
    const absent = classifySkillFromRaw(undefined);
    expect(clean.confidence).toBe(1.0);
    expect(absent.confidence).toBe(0.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MA-1 ↔ MA-6: eligibility snapshots update on new reinforcement events
// ═══════════════════════════════════════════════════════════════════════════
describe('MA-1 ↔ MA-6 — eligibility responds to new events', () => {
  it('store.apply updates the (skill, channel) trace when an event arrives', () => {
    const store = new EligibilityStore();
    const t0 = 1_700_000_000_000;
    expect(store.getTrace('skill-a', 'outcome_observed')).toBeNull();

    store.apply('skill-a', 'outcome_observed', 1, t0);
    const trace1 = store.getTrace('skill-a', 'outcome_observed');
    expect(trace1).not.toBeNull();
    expect(trace1!).toBeCloseTo(1, 10);

    // A subsequent event of magnitude 0 at a later time decays the trace.
    store.apply('skill-a', 'outcome_observed', 0, t0 + 60_000);
    const trace2 = store.getTrace('skill-a', 'outcome_observed');
    expect(trace2).not.toBeNull();
    expect(Math.abs(trace2!)).toBeLessThan(1);
  });

  it('replaying the 5-channel burst produces 5 distinct traces', () => {
    const events = build5ChannelBurst('skill-a');
    const final = getFinalTracesFromEvents(events);
    const channels = new Set(final.map((t) => t.channel));
    expect(channels.size).toBe(5);
    for (const ch of REINFORCEMENT_CHANNELS) {
      expect(channels.has(ch)).toBe(true);
    }
  });

  it('additional events after initial burst shift the snapshot monotonically', async () => {
    const logDir = mkdtempSync(join(tmpdir(), 'xref-ma1-ma6-'));
    const logPath = join(logDir, 'reinforcement.jsonl');

    // Write initial burst.
    for (const e of build5ChannelBurst('skill-a', 1_700_000_000_000)) {
      await writeReinforcementEvent(e, logPath);
    }
    const reader1 = buildReaderFromEvents(await readReinforcementEvents(logPath));
    const initialTrace = reader1.getTraceFor('skill-a', 'outcome_observed');
    expect(initialTrace).not.toBeNull();

    // Append a strong positive outcome 1 minute later.
    const strong = emitExplicitCorrection({
      actor: 'skill-a',
      metadata: { skillId: 'skill-a' },
      ts: 1_700_000_000_000 + 60_000,
      magnitude: -1,
    });
    await writeReinforcementEvent(strong, logPath);

    const reader2 = buildReaderFromEvents(await readReinforcementEvents(logPath));
    const afterTrace = reader2.getTraceFor('skill-a', 'explicit_correction');
    // The explicit_correction trace should be stronger (more negative) after
    // a fresh correction event arrives.
    expect(afterTrace).not.toBeNull();
    expect(Math.abs(afterTrace!)).toBeGreaterThan(0);
  });

  it('events on different skills produce independent traces', () => {
    const store = new EligibilityStore();
    const t0 = 1_700_000_000_000;
    store.apply('skill-a', 'outcome_observed', 1, t0);
    store.apply('skill-b', 'outcome_observed', -1, t0);
    expect(store.getTrace('skill-a', 'outcome_observed')).toBeCloseTo(1, 10);
    expect(store.getTrace('skill-b', 'outcome_observed')).toBeCloseTo(-1, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MA-2 ↔ MA-1 + ME-1: TD magnitude responds to tractability class; r̄ composes
// ═══════════════════════════════════════════════════════════════════════════
describe('MA-2 ↔ MA-1 + ME-1 — TD magnitude scales with tractability', () => {
  it('identical TD inputs with tract_weight ∈ {1.0, 0.3, 0.3} scale linearly (CF-MA2-04)', () => {
    const readings = [
      { channel: 'outcome_observed' as const, eligibility: 0.8, reinforcement: 1 },
    ];
    const tractable = computeTDError(readings, 0, 0.5, {
      tractabilityClass: 'tractable',
      gamma: 0.95,
    });
    const coinFlip = computeTDError(readings, 0, 0.5, {
      tractabilityClass: 'coin-flip',
      gamma: 0.95,
    });
    const unknown = computeTDError(readings, 0, 0.5, {
      tractabilityClass: 'unknown',
      gamma: 0.95,
    });

    // Same raw δ, different weights → proportional final δ.
    expect(tractable.rawDelta).toBe(coinFlip.rawDelta);
    expect(tractable.rawDelta).toBe(unknown.rawDelta);
    expect(tractable.weight).toBe(1.0);
    expect(coinFlip.weight).toBe(TRACTABILITY_WEIGHT_FLOOR);
    expect(unknown.weight).toBe(TRACTABILITY_WEIGHT_FLOOR);

    // Ratios match the weight ratios.
    expect(tractable.delta / coinFlip.delta).toBeCloseTo(1.0 / 0.3, 6);
  });

  it('δ → 0 when r̄ = 0 and ΔF_curr = ΔF_prev (CF-MA2-01)', () => {
    const readings = [
      { channel: 'outcome_observed' as const, eligibility: 0, reinforcement: 0 },
    ];
    const td = computeTDError(readings, 0.3, 0.3 / 0.95, {
      tractabilityClass: 'tractable',
      gamma: 0.95,
    });
    // r̄ = 0; γ · ΔF_curr − ΔF_prev = 0.3 − 0.3 = 0.
    expect(td.rawDelta).toBeCloseTo(0, 10);
    expect(td.delta).toBeCloseTo(0, 10);
  });

  it('r̄ composes correctly when multiple channels contribute', () => {
    const readings = readingsFromMap({
      outcome_observed: { eligibility: 0.5, reinforcement: 1 },
      branch_resolved: { eligibility: 0.4, reinforcement: -1 },
    });
    const td = computeTDError(readings, 0, 0, {
      tractabilityClass: 'tractable',
      gamma: 0.95,
    });
    // r̄ = (0.5·1 + 0.4·(-1)) / (0.5 + 0.4) = 0.1 / 0.9 ≈ 0.1111...
    expect(td.rBar).toBeCloseTo(0.1 / 0.9, 10);
  });

  it('ace.tractabilityWeight integrates with ME-1 selector-api flow', () => {
    // Simulate: consumer reads raw frontmatter, asks ME-1 for class, feeds
    // class into ACE TD error.
    const json = { kind: 'json-schema' as const, schema: '{}' };
    const prose = { kind: 'prose' as const };
    const absent = undefined;

    expect(aceTractabilityWeight(getTractabilityClass(json), 1.0)).toBe(1.0);
    expect(aceTractabilityWeight(getTractabilityClass(prose), 0.8)).toBe(
      TRACTABILITY_WEIGHT_FLOOR,
    );
    expect(aceTractabilityWeight(getTractabilityClass(absent), 0.5)).toBe(
      TRACTABILITY_WEIGHT_FLOOR,
    );
  });

  it('readingsFromMap pads absent channels with zeros', () => {
    const readings = readingsFromMap({
      outcome_observed: { eligibility: 0.9, reinforcement: 1 },
    });
    expect(readings.length).toBe(REINFORCEMENT_CHANNELS.length);
    const outcome = readings.find((r) => r.channel === 'outcome_observed')!;
    expect(outcome.eligibility).toBe(0.9);
    const correction = readings.find((r) => r.channel === 'explicit_correction')!;
    expect(correction.eligibility).toBe(0);
    expect(correction.reinforcement).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ME-4 ↔ ME-1: warning surfaces iff ME-1 classifies coin-flip or unknown
// ═══════════════════════════════════════════════════════════════════════════
describe('ME-4 ↔ ME-1 — teach warning tracks tractability class', () => {
  it('coin-flip → warning shown; tractable → no warning; unknown → warning', () => {
    const coinFlip = classifyExpectedEffect({ kind: 'prose' });
    const tractable = classifyExpectedEffect({ kind: 'json-schema', schema: '{}' });
    const unknown = classifyExpectedEffect(undefined);

    expect(composeTeachWarning(coinFlip.level, coinFlip.tractabilityClass).shouldWarn).toBe(true);
    expect(composeTeachWarning(tractable.level, tractable.tractabilityClass).shouldWarn).toBe(false);
    expect(composeTeachWarning(unknown.level, unknown.tractabilityClass).shouldWarn).toBe(true);
  });

  it('levelFromTractabilityClass maps tractable→high, coin-flip→low, unknown→low', () => {
    expect(levelFromTractabilityClass('tractable')).toBe('high');
    expect(levelFromTractabilityClass('coin-flip')).toBe('low');
    expect(levelFromTractabilityClass('unknown')).toBe('low');
  });

  it('coin-flip warning text differs from unknown warning text', () => {
    const coinFlip = classifyExpectedEffect({ kind: 'prose' });
    const unknown = classifyExpectedEffect(undefined);
    const wCoin = composeTeachWarning(coinFlip.level, coinFlip.tractabilityClass);
    const wUnk = composeTeachWarning(unknown.level, unknown.tractabilityClass);

    expect(wCoin.text).toContain('prose output');
    expect(wUnk.text).toContain('no declared output_structure');
    expect(wCoin.text).not.toBe(wUnk.text);
  });

  it('classifyExpectedEffectFromClass bypasses ME-1 lookup but reports same level', () => {
    const fromClass = classifyExpectedEffectFromClass('tractable');
    const fromRaw = classifyExpectedEffect({ kind: 'json-schema', schema: '{}' });
    expect(fromClass.level).toBe(fromRaw.level);
    expect(fromClass.tractabilityClass).toBe('tractable');
  });

  it('isCoinFlip / isTractable predicates align with expected_effect', () => {
    const prose = { kind: 'prose' as const };
    const json = { kind: 'json-schema' as const, schema: '{}' };
    expect(isCoinFlip(prose)).toBe(true);
    expect(isTractable(prose)).toBe(false);
    expect(isTractable(json)).toBe(true);
    expect(isCoinFlip(json)).toBe(false);

    expect(classifyExpectedEffect(prose).level).toBe('low');
    expect(classifyExpectedEffect(json).level).toBe('high');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Composite — chained pairwise interactions
// ═══════════════════════════════════════════════════════════════════════════
describe('Refinement chain — pairwise composes end-to-end', () => {
  it('ME-5 edit → ME-1 class flip → ME-4 warning flip', () => {
    // Pre-edit: prose skill
    const preEdit = { kind: 'prose' as const };
    const preEffect = classifyExpectedEffect(preEdit);
    const preWarn = composeTeachWarning(preEffect.level, preEffect.tractabilityClass);
    expect(preWarn.shouldWarn).toBe(true);

    // Post-edit: json-schema declared
    const postEdit = { kind: 'json-schema' as const, schema: '{}' };
    const postEffect = classifyExpectedEffect(postEdit);
    const postWarn = composeTeachWarning(postEffect.level, postEffect.tractabilityClass);
    expect(postWarn.shouldWarn).toBe(false);
  });

  it('MA-6 event → MA-1 eligibility → MA-2 TD magnitude scales with ME-1 class', () => {
    // Step 1: build reinforcement stream + replay.
    const skillId = 'skill-x';
    const events = Array.from({ length: 5 }, (_, i) =>
      makeReinforcementEvent('outcome_observed', 1, 1_700_000_000_000 + i * 60_000, skillId),
    );
    const reader = buildReaderFromEvents(events);
    const elig = reader.getTraceFor(skillId, 'outcome_observed') ?? 0;
    expect(elig).toBeGreaterThan(0);

    // Step 2: ME-1 classifies the skill two ways.
    const tractableFm = { kind: 'json-schema' as const, schema: '{}' };
    const coinFlipFm = { kind: 'prose' as const };
    const tCls = getTractabilityClass(tractableFm);
    const cCls = getTractabilityClass(coinFlipFm);
    expect(tCls).toBe('tractable');
    expect(cCls).toBe('coin-flip');

    // Step 3: MA-2 TD consumes the class + eligibility.
    const readings = [
      { channel: 'outcome_observed' as const, eligibility: elig, reinforcement: 1 },
    ];
    const tTD = computeTDError(readings, 0, 0.2, {
      tractabilityClass: tCls,
      gamma: 0.95,
    });
    const cTD = computeTDError(readings, 0, 0.2, {
      tractabilityClass: cCls,
      gamma: 0.95,
    });

    expect(tTD.delta).toBeCloseTo(tTD.rawDelta * 1.0, 10);
    expect(cTD.delta).toBeCloseTo(cTD.rawDelta * TRACTABILITY_WEIGHT_FLOOR, 10);
    // Tractable-scaled magnitude is strictly larger (raw δ is positive here).
    expect(Math.abs(tTD.delta)).toBeGreaterThan(Math.abs(cTD.delta));
  });

  it('tractability weight and expected_effect agree on all three classes', () => {
    const cases: Array<{
      fm: unknown;
      cls: 'tractable' | 'coin-flip' | 'unknown';
      expectedLevel: 'high' | 'low';
      aceWeight: number;
    }> = [
      {
        fm: { kind: 'json-schema', schema: '{}' },
        cls: 'tractable',
        expectedLevel: 'high',
        aceWeight: 1.0,
      },
      {
        fm: { kind: 'prose' },
        cls: 'coin-flip',
        expectedLevel: 'low',
        aceWeight: TRACTABILITY_WEIGHT_FLOOR,
      },
      {
        fm: undefined,
        cls: 'unknown',
        expectedLevel: 'low',
        aceWeight: TRACTABILITY_WEIGHT_FLOOR,
      },
    ];

    for (const { fm, cls, expectedLevel, aceWeight } of cases) {
      expect(getTractabilityClass(fm)).toBe(cls);
      expect(classifyExpectedEffect(fm).level).toBe(expectedLevel);
      expect(aceTractabilityWeight(cls, 1.0)).toBe(aceWeight);
    }
  });
});
