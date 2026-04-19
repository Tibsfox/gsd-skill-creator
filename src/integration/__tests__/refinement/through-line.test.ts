/**
 * Refinement Wave — canonical through-line integration tests.
 *
 * IT-W1-ME5, IT-W1-ME1, IT-W1-MA6, IT-W1-MA1, IT-W1-MA2, IT-W1-ME4:
 * each proposal's acceptance-gate integration test composed end-to-end so
 * that the full ME-5 → ME-1 → MA-6 → MA-1 → MA-2 → ME-4 pipeline is
 * exercised in a single vitest run.
 *
 * These tests DO NOT duplicate the unit tests already shipped with each
 * phase — they verify cross-component wiring, not single-component
 * correctness.
 *
 * @module integration/__tests__/refinement/through-line.test
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ME-5 (output-structure)
import { resolveOutputStructure } from '../../../output-structure/frontmatter.js';

// ME-1 (tractability)
import { runAudit } from '../../../tractability/audit.js';
import {
  getTractabilityClass,
  tractabilityWeight,
} from '../../../tractability/selector-api.js';
import { classifySkillFromRaw } from '../../../tractability/classifier.js';

// MA-6 (reinforcement)
import {
  emitExplicitCorrection,
  emitOutcomeObserved,
  emitBranchResolved,
  emitSurpriseTriggered,
  emitQuintessenceUpdated,
} from '../../../reinforcement/emitters.js';
import {
  writeReinforcementEvent,
  readReinforcementEvents,
} from '../../../reinforcement/writer.js';
import { REINFORCEMENT_CHANNELS } from '../../../types/reinforcement.js';

// MA-1 (eligibility)
import {
  replayEvents,
  getFinalTracesFromEvents,
} from '../../../eligibility/replay.js';
import { buildReaderFromEvents } from '../../../eligibility/api.js';

// MA-2 (ACE)
import { AceLoop } from '../../../ace/loop.js';
import {
  computeTDError,
  readingsFromMap,
} from '../../../ace/td-error.js';
import { ActivationSelector } from '../../../orchestration/selector.js';
import { ActivationWriter } from '../../../traces/activation-writer.js';

// ME-4 (teach warning)
import {
  classifyExpectedEffect,
} from '../../../symbiosis/expected-effect.js';
import {
  composeTeachWarning,
  formatTeachWarningBlock,
} from '../../../symbiosis/teach-warning.js';
import { validateOffering } from '../../../symbiosis/parasocial-guard.js';

// Fixture helpers
import {
  buildMigratedSkillFixture,
  buildSkillFixture,
  renderSkillMd,
  buildReinforcementStream,
  build5ChannelBurst,
  makeReinforcementEvent,
  buildSessionFixture,
  analyticRBar,
  analyticTD,
} from './fixture.js';

// ───────────────────────────────────────────────────────────────────────────
// Shared helper: materialise a SyntheticSkill[] into a tempdir as SKILL.md
// files, returning the root directory so `runAudit` can scan it.
// ───────────────────────────────────────────────────────────────────────────

function materialiseSkillsToDisk(skills: ReturnType<typeof buildSkillFixture>): string {
  const root = mkdtempSync(join(tmpdir(), 'ref-skills-'));
  for (const skill of skills) {
    const dir = join(root, skill.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), renderSkillMd(skill), 'utf8');
  }
  return root;
}

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-ME5 — Output-structure migration closes coverage
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-ME5 — migrated skills reach classified_ratio ≥ 95%', () => {
  it('a 50-skill migrated fixture audits at classified_ratio ≥ 0.95', async () => {
    const skills = buildMigratedSkillFixture(50);
    const root = materialiseSkillsToDisk(skills);

    const report = await runAudit({
      extraDirs: [root],
      cwd: '/nonexistent-cwd-so-defaults-are-empty',
      featureEnabled: true,
    });

    expect(report.isDisabled).toBe(false);
    expect(report.total).toBe(50);
    expect(report.classifiedRatio).toBeGreaterThanOrEqual(0.95);
    expect(report.counts.unknown).toBeLessThanOrEqual(2);
  });

  it('migration is idempotent: re-resolving already-explicit frontmatter is a no-op', () => {
    const skills = buildMigratedSkillFixture(10);
    for (const skill of skills) {
      const first = resolveOutputStructure(skill.rawOutputStructure);
      const second = resolveOutputStructure(skill.rawOutputStructure);
      expect(first.structure).toEqual(second.structure);
      expect(first.source).toBe(second.source);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-ME1 — Tractability classifier over a 50-skill fixture
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-ME1 — tractability audit on a 50-skill mixed fixture', () => {
  it('class distribution matches the frontmatter signals the fixture supplied', async () => {
    const skills = buildSkillFixture(50);
    const root = materialiseSkillsToDisk(skills);

    const report = await runAudit({
      extraDirs: [root],
      cwd: '/nonexistent-cwd-so-defaults-are-empty',
      featureEnabled: true,
    });

    expect(report.isDisabled).toBe(false);
    expect(report.total).toBe(50);

    // buildSkillFixture distributes: 20 json-schema + 10 markdown-template +
    // 10 prose + 10 unknown (no frontmatter).
    expect(report.counts.tractable).toBe(30);
    expect(report.counts['coin-flip']).toBe(10);
    expect(report.counts.unknown).toBe(10);
  });

  it('classifier is a pure function of its inputs (CF-ME1-04)', () => {
    const skills = buildSkillFixture(20);
    for (const skill of skills) {
      const a = classifySkillFromRaw(skill.rawOutputStructure, skill.body);
      const b = classifySkillFromRaw(skill.rawOutputStructure, skill.body);
      expect(a.tractabilityClass).toBe(b.tractabilityClass);
      expect(a.confidence).toBe(b.confidence);
    }
  });

  it('classification never throws on malformed frontmatter (CF-ME1-05)', () => {
    const malformed: unknown[] = [
      { kind: 'fictional-kind' },
      { kind: 'json-schema' /* missing schema */ },
      42,
      'prose',
      [],
    ];
    for (const m of malformed) {
      expect(() => classifySkillFromRaw(m)).not.toThrow();
      const result = classifySkillFromRaw(m);
      expect(['tractable', 'coin-flip', 'unknown']).toContain(result.tractabilityClass);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-MA6 — 5-channel emission + round-trip via writer
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-MA6 — reinforcement events emit on all 5 channels and round-trip', () => {
  it('each of the 5 channels produces a valid event', () => {
    const ts = 1_700_000_000_000;
    const actor = 'integration-test';

    const events = [
      emitExplicitCorrection({
        actor,
        metadata: { skillId: 'skill-a', category: 'correction' },
        ts,
      }),
      emitOutcomeObserved({
        actor,
        metadata: { outcomeKind: 'test-pass' },
        magnitude: 0.8,
        ts: ts + 1,
      }),
      emitBranchResolved({
        actor,
        metadata: { branchId: 'b-1', resolution: 'committed' },
        ts: ts + 2,
      }),
      emitSurpriseTriggered({
        actor,
        metadata: { sigma: 3, klDivergence: 1.2, threshold: 2 },
        ts: ts + 3,
      }),
      emitQuintessenceUpdated({
        actor,
        metadata: {
          axes: {
            selfVsNonSelf: 0.1,
            essentialTensions: 0.2,
            growthAndEnergyFlow: 0.3,
            stabilityVsNovelty: 0.4,
            fatefulEncounters: 0.1,
          },
        },
        ts: ts + 4,
      }),
    ];

    expect(events).toHaveLength(5);
    for (const channel of REINFORCEMENT_CHANNELS) {
      const e = events.find((e) => e.channel === channel);
      expect(e).toBeDefined();
      expect(e!.value.magnitude).toBeGreaterThanOrEqual(-1);
      expect(e!.value.magnitude).toBeLessThanOrEqual(1);
    }
  });

  it('round-trip through reinforcement.jsonl preserves event identity', async () => {
    const logDir = mkdtempSync(join(tmpdir(), 'ref-ma6-'));
    const logPath = join(logDir, 'reinforcement.jsonl');

    const burst = build5ChannelBurst('skill-alpha', 1_700_000_000_000);
    for (const e of burst) {
      await writeReinforcementEvent(e, logPath);
    }

    const read = await readReinforcementEvents(logPath);
    expect(read.length).toBe(burst.length);
    for (let i = 0; i < burst.length; i++) {
      expect(read[i]!.channel).toBe(burst[i]!.channel);
      expect(read[i]!.value.magnitude).toBeCloseTo(burst[i]!.value.magnitude, 10);
      expect(read[i]!.actor).toBe(burst[i]!.actor);
    }
  });

  it('MA-1 picks up the emitted events and populates eligibility traces', () => {
    const events = build5ChannelBurst('skill-alpha', 1_700_000_000_000);
    const final = getFinalTracesFromEvents(events);
    // Each channel writes into a distinct (skillId, channel) trace.
    const channels = new Set(final.map((t) => t.channel));
    expect(channels.size).toBe(5);
    for (const channel of REINFORCEMENT_CHANNELS) {
      expect(channels.has(channel)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-MA1 — MA-6 → MA-1 → TD-reference match ≤ 1e-6 over 100 steps
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-MA1 — reinforcement event → eligibility decay matches TD reference', () => {
  it('r̄ from readings matches analytic r̄ to ≤ 1e-6 over 100 steps', () => {
    const events = buildReinforcementStream(100, 'skill-alpha');
    const reader = buildReaderFromEvents(events);

    // Gather readings at the final tick for each channel that has a live trace.
    const readings: Array<{
      channel: typeof REINFORCEMENT_CHANNELS[number];
      eligibility: number;
      reinforcement: number;
    }> = [];
    for (const ch of REINFORCEMENT_CHANNELS) {
      const trace = reader.getTraceFor('skill-alpha', ch);
      if (trace !== null) {
        readings.push({
          channel: ch,
          eligibility: trace,
          reinforcement: 0, // last-tick reinforcement is 0 after replay
        });
      }
    }

    // Call the production r̄ via computeTDError's rBar component.
    const td = computeTDError(readings, 0, 0, {
      tractabilityClass: 'tractable',
      gamma: 0.95,
    });
    const expectedRBar = analyticRBar(readings);
    expect(td.rBar).toBeCloseTo(expectedRBar, 6);
  });

  it('replay is deterministic: identical events → identical final traces', () => {
    const events = buildReinforcementStream(50, 'skill-beta');
    const first = replayEvents(events);
    const second = replayEvents(events);
    expect(first.length).toBe(second.length);
    const firstFinal = first[first.length - 1]!;
    const secondFinal = second[second.length - 1]!;
    expect(firstFinal.traces.length).toBe(secondFinal.traces.length);
    for (let i = 0; i < firstFinal.traces.length; i++) {
      expect(firstFinal.traces[i]!.activation).toBeCloseTo(
        secondFinal.traces[i]!.activation,
        12,
      );
    }
  });

  it('eligibility decays to near-zero when no further events arrive', () => {
    const events = buildReinforcementStream(10, 'skill-gamma');
    const reader = buildReaderFromEvents(events);

    // Project 1 year into the future: every trace should be pruned (< 1e-12).
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const futureTs = events[events.length - 1]!.ts + oneYearMs;
    const decayed = reader.getAllTracesAt(futureTs);
    for (const t of decayed) {
      expect(Math.abs(t.activation)).toBeLessThan(1e-10);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-MA2 — Full actor-critic tick produces measurable signal within 3 ticks
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-MA2 — actor-critic wire produces actor-signal change within 3 ticks', () => {
  it('observation → reinforcement → eligibility → ΔF → TD → actor → selector nudge', async () => {
    // 1. Set up the ACE loop with flag ON (explicit override).
    const loop = new AceLoop({
      enabledOverride: true,
      tdOptions: { tractabilityClass: 'tractable', gamma: 0.95 },
    });

    // 2. Feed a correction event via MA-1 store → extract readings.
    const events = build5ChannelBurst('skill-alpha', 1_700_000_000_000);
    const reader = buildReaderFromEvents(events);
    const eligByChannel = Object.fromEntries(
      REINFORCEMENT_CHANNELS.map((ch) => [
        ch,
        {
          eligibility: reader.getTraceFor('skill-alpha', ch) ?? 0,
          reinforcement: ch === 'outcome_observed' ? 1 : 0,
        },
      ]),
    );
    const readings = readingsFromMap(
      eligByChannel as Parameters<typeof readingsFromMap>[0],
    );

    // 3. Tick the loop — first with a zero-ΔF baseline, then with a non-trivial
    //    ΔF change.  Check that a signal emerges within 3 ticks.
    let signalMag = 0;
    for (let t = 0; t < 3; t++) {
      const result = loop.tick({
        readings,
        negFCurr: t === 0 ? 0 : 0.5, // M7 free-energy reduction
      });
      expect(result).not.toBeNull();
      signalMag = Math.max(signalMag, Math.abs(result!.signal.delta));
    }
    expect(signalMag).toBeGreaterThan(0);

    // 4. Round-trip through selector: the aceSignal should nudge the composite
    //    score.
    const logDir = mkdtempSync(join(tmpdir(), 'ref-ma2-'));
    const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
    const selector = new ActivationSelector({ writer });

    const candidates = [
      { id: 'skill-alpha', content: 'structured json output', importance: 0.4 },
      { id: 'skill-beta', content: 'unrelated', importance: 0.2 },
    ];

    // Without the signal:
    const withoutSignal = await selector.select('emit json', candidates);
    // With a crafted ActorSignal carrying a non-zero delta + matching channel
    // eligibility.
    const signalInput = await selector.select('emit json', candidates, {
      aceSignal: {
        delta: 0.5,
        weight: 1.0,
        perChannelEligibility: { outcome_observed: 0.8 },
        tick: 1,
      },
    });

    const scoreAlphaNoSignal = withoutSignal.find((d) => d.id === 'skill-alpha')!.score;
    const scoreAlphaWithSignal = signalInput.find((d) => d.id === 'skill-alpha')!.score;
    // The alpha score should be nudged up by the positive delta.
    expect(scoreAlphaWithSignal).toBeGreaterThan(scoreAlphaNoSignal);
  });

  it('flag off: loop.tick returns null and no signal emits', () => {
    const loop = new AceLoop({ enabledOverride: false });
    const result = loop.tick({ readings: [], negFCurr: 0.5 });
    expect(result).toBeNull();
  });

  it('γ = 0 reduces δ to r̄ − [−F(t−1)] (CF-MA2-03)', () => {
    const readings = [
      { channel: 'outcome_observed' as const, eligibility: 0.5, reinforcement: 1 },
    ];
    const td = computeTDError(readings, 0.3, 0.9, {
      gamma: 0,
      tractabilityClass: 'tractable',
    });
    const expectedRaw = 1 + 0 * 0.9 - 0.3; // r̄ + γ·ΔF_curr − ΔF_prev with γ=0
    expect(td.rawDelta).toBeCloseTo(expectedRaw, 10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// IT-W1-ME4 — Teach warning on coin-flip skill; parasocial-guard passes
// ═══════════════════════════════════════════════════════════════════════════
describe('IT-W1-ME4 — teach entry against coin-flip skill warns + carries expected_effect', () => {
  it('coin-flip skill → shouldWarn=true; warning text passes parasocial-guard', () => {
    const rawProse = { kind: 'prose' as const };
    const effect = classifyExpectedEffect(rawProse);
    expect(effect.level).toBe('low');
    expect(effect.tractabilityClass).toBe('coin-flip');

    const result = composeTeachWarning(effect.level, effect.tractabilityClass);
    expect(result.shouldWarn).toBe(true);
    // The text is pre-validated at module load; double-check here.
    const guard = validateOffering(result.text);
    expect(guard.ok).toBe(true);

    // Rendered block includes the expected_effect line.
    const block = formatTeachWarningBlock(result);
    expect(block).toContain('Expected effect: low');
    expect(block).toMatch(/WARN/);
  });

  it('unknown skill → warns with WARN_UNKNOWN language', () => {
    const effect = classifyExpectedEffect(undefined);
    expect(effect.level).toBe('low');
    const res = composeTeachWarning(effect.level, effect.tractabilityClass);
    expect(res.shouldWarn).toBe(true);
    expect(validateOffering(res.text).ok).toBe(true);
  });

  it('tractable skill → shouldWarn=false; note still passes guard', () => {
    const rawJson = { kind: 'json-schema' as const, schema: '{}' };
    const effect = classifyExpectedEffect(rawJson);
    expect(effect.level).toBe('high');
    const res = composeTeachWarning(effect.level, effect.tractabilityClass);
    expect(res.shouldWarn).toBe(false);
    expect(validateOffering(res.text).ok).toBe(true);
  });

  it('expected_effect tracks ME-1 tractability weight composition', () => {
    // tractable → weight 1.0 → level high
    const tractable = classifyExpectedEffect({ kind: 'json-schema', schema: '{}' });
    expect(tractable.confidence).toBe(1.0);
    // coin-flip → weight 0.5 → level low
    const coinFlip = classifyExpectedEffect({ kind: 'prose' });
    expect(coinFlip.confidence).toBe(0.5);
    // unknown → weight 0.5 → level low
    const unknown = classifyExpectedEffect(null);
    expect(unknown.confidence).toBe(0.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// End-to-end — ME-5 → ME-1 → MA-6 → MA-1 → MA-2 → ME-4 composition
// ═══════════════════════════════════════════════════════════════════════════
describe('Refinement through-line — all six components compose', () => {
  it('canonical pipeline runs end to end without throwing', async () => {
    // 1. ME-5 — migrated skills on disk (50 so the prose slots at i=24, 49 exist)
    const skills = buildMigratedSkillFixture(50);
    const root = materialiseSkillsToDisk(skills);

    // 2. ME-1 — audit reports classified_ratio > 0.9
    const report = await runAudit({
      extraDirs: [root],
      cwd: '/nonexistent-cwd-so-defaults-are-empty',
      featureEnabled: true,
    });
    expect(report.classifiedRatio).toBeGreaterThan(0.9);

    // 3. MA-6 — emit correction on a coin-flip skill from the fixture
    const coinFlipSkill = skills.find((s) => s.declaredKind === 'prose')!;
    expect(coinFlipSkill).toBeDefined();
    const logDir = mkdtempSync(join(tmpdir(), 'ref-through-'));
    const logPath = join(logDir, 'reinforcement.jsonl');
    const burst = build5ChannelBurst(coinFlipSkill.id, 1_700_000_000_000);
    for (const e of burst) {
      await writeReinforcementEvent(e, logPath);
    }

    // 4. MA-1 — replay; expect 5 traces on 5 channels
    const reader = buildReaderFromEvents(
      await readReinforcementEvents(logPath),
    );
    expect(reader.size).toBe(5);

    // 5. MA-2 — tick ACE loop with coin-flip tractability
    const cls = getTractabilityClass(coinFlipSkill.rawOutputStructure);
    expect(cls).toBe('coin-flip');
    const weight = tractabilityWeight(coinFlipSkill.rawOutputStructure);
    expect(weight).toBe(0.5);

    const readings = REINFORCEMENT_CHANNELS.map((ch) => ({
      channel: ch,
      eligibility: reader.getTraceFor(coinFlipSkill.id, ch) ?? 0,
      reinforcement: 0,
    }));
    const td = computeTDError(readings, 0, 0.2, {
      tractabilityClass: 'coin-flip',
      gamma: 0.95,
    });
    // Coin-flip weight floor is 0.3, not 0.5, per ace/settings.ts.
    expect(td.weight).toBe(0.3);
    // Analytic check against the fixture helper.
    expect(td.rawDelta).toBeCloseTo(
      analyticTD(td.rBar, 0, 0.2, 0.95),
      10,
    );

    // 6. ME-4 — compose a teach warning on the same coin-flip skill.
    const effect = classifyExpectedEffect(coinFlipSkill.rawOutputStructure);
    expect(effect.level).toBe('low');
    const warning = composeTeachWarning(effect.level, effect.tractabilityClass);
    expect(warning.shouldWarn).toBe(true);
    expect(validateOffering(warning.text).ok).toBe(true);
  });

  it('tractable-skill composition yields no warning and full-weight TD', async () => {
    const skills = buildMigratedSkillFixture(10);
    const tractableSkill = skills.find((s) => s.declaredKind !== 'prose')!;
    expect(tractableSkill).toBeDefined();

    const cls = getTractabilityClass(tractableSkill.rawOutputStructure);
    expect(cls).toBe('tractable');

    const td = computeTDError(
      [{ channel: 'outcome_observed', eligibility: 0.8, reinforcement: 1 }],
      0.1,
      0.3,
      { tractabilityClass: 'tractable', gamma: 0.95 },
    );
    expect(td.weight).toBe(1.0);

    const effect = classifyExpectedEffect(tractableSkill.rawOutputStructure);
    expect(effect.level).toBe('high');
    const warning = composeTeachWarning(effect.level, effect.tractabilityClass);
    expect(warning.shouldWarn).toBe(false);
  });

  it('session fixture generator produces deterministic 50-session stream', () => {
    const skills = buildSkillFixture(12);
    const a = buildSessionFixture(skills, 50);
    const b = buildSessionFixture(skills, 50);
    expect(a.length).toBe(50);
    expect(b.length).toBe(50);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]!.query).toBe(b[i]!.query);
      expect(a[i]!.ts).toBe(b[i]!.ts);
      expect(a[i]!.candidates.map((c) => c.id)).toEqual(
        b[i]!.candidates.map((c) => c.id),
      );
    }
  });

  it('makeReinforcementEvent builds canonical events for every channel', () => {
    const ts = 1_700_000_000_000;
    for (const ch of REINFORCEMENT_CHANNELS) {
      const e = makeReinforcementEvent(ch, 0.5, ts, 'skill-x');
      expect(e.channel).toBe(ch);
      expect(e.value.magnitude).toBe(0.5);
      expect(e.actor).toBe('skill-x');
    }
  });
});
