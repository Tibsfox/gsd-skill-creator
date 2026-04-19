/**
 * Continuation Wave — shared test fixtures.
 *
 * Synthetic-data builders for Phase 674 integration tests covering the 11
 * wave-2 components shipped in phases 661-671:
 *
 *   MB-1 (Lyapunov), MB-2 (projection), MB-5 (dead-zone),
 *   MA-3+MD-2 (stochastic), MD-3 (Langevin), MD-4 (temperature),
 *   MD-1 (embeddings), MD-5 (learnable K_H), MD-6 (representation-audit),
 *   ME-2 (model-affinity), ME-3 (A/B harness).
 *
 * Design:
 *   - Extends the refinement-wave and living-sensoria fixtures. All base
 *     builders (`buildObservations`, `buildM1`, `buildSkillFixture`,
 *     `buildSessionFixture`, `buildReinforcementStream`, etc.) are re-exported
 *     from those modules.
 *   - Adds wave-2 specific builders:
 *       - `buildContinuationSkillFixture` — skills with mixed output_structure
 *         + tractability + model_affinity for ME-2/ME-3 wiring.
 *       - `buildM3TraceFixture` — trace volume sufficient to train MD-1
 *         embeddings on a 3-cluster planted-signal structure.
 *       - `buildClusteredTraces` — 3-cluster fixture for MD-1 similarity
 *         recovery tests.
 *       - `buildDegenerateTraces` — collapsed fixture for MD-6 CRITICAL.
 *       - `buildLyapunovFixture` — samples for MB-1/MD-5 Lyapunov gating.
 *       - `buildQuintessenceSnapshot` — MD-4 schedule input.
 *       - `buildMultiChannelStream` — 5-channel reinforcement bursts.
 *       - `planMockScorer` / `noisyMockScorer` — ME-3 A/B harness drivers.
 *
 * Everything is in-memory / pure; disk IO lives in the test files.
 *
 * @module integration/__tests__/continuation/fixture
 */

import {
  buildObservations,
  buildM1,
  buildM2,
  buildM3,
  buildM4,
} from '../living-sensoria/fixture.js';
import {
  buildSkillFixture,
  buildMigratedSkillFixture,
  renderSkillMd,
  buildReinforcementStream,
  build5ChannelBurst,
  makeReinforcementEvent,
  buildSessionFixture,
  analyticTD,
  analyticRBar,
  type SyntheticSkill,
  type Session,
} from '../refinement/fixture.js';
import type { DecisionTrace } from '../../../types/memory.js';
import type { QuintessenceSnapshot } from '../../../types/symbiosis.js';
import type { ReinforcementEvent } from '../../../types/reinforcement.js';
import type { LyapunovFixtureSample } from '../../../learnable-k_h/trainer.js';

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export {
  buildObservations,
  buildM1,
  buildM2,
  buildM3,
  buildM4,
  buildSkillFixture,
  buildMigratedSkillFixture,
  renderSkillMd,
  buildReinforcementStream,
  build5ChannelBurst,
  makeReinforcementEvent,
  buildSessionFixture,
  analyticTD,
  analyticRBar,
};
export type { SyntheticSkill, Session };

// ---------------------------------------------------------------------------
// Continuation-specific skill fixture: output_structure + tractability +
// model_affinity.  Used by Bundle 6 (ME-2/ME-3) tests.
// ---------------------------------------------------------------------------

export type ModelFamily = 'haiku' | 'sonnet' | 'opus' | 'unknown';

export interface ContinuationSkill extends SyntheticSkill {
  /**
   * Raw YAML-parsed `model_affinity` value.  `undefined` when the skill
   * declares no affinity (CF-ME2-03 neutral path).
   */
  rawModelAffinity: unknown;
}

/**
 * Build a 30-skill continuation fixture exercising every (tractability ×
 * affinity) corner:
 *
 *   - tractable + reliable-list declared (tests ME-2 happy path)
 *   - tractable + unreliable-list declared (tests escalation suggestion)
 *   - coin-flip + reliable-list declared (tests CF-ME2-02 gate)
 *   - unknown + no affinity (neutral penalty path)
 *
 * Every skill declares a concrete output_structure so tractability is
 * deterministic (no `unknown`-path drift in integration tests).
 */
export function buildContinuationSkillFixture(
  n: number = 30,
): ContinuationSkill[] {
  const out: ContinuationSkill[] = [];
  for (let i = 0; i < n; i++) {
    const mod = i % 6;
    if (mod === 0) {
      // Tractable + reliable[haiku, sonnet]
      out.push({
        id: `skill-json-ha-${i}`,
        name: `skill-json-ha-${i}`,
        body: `Returns JSON { status, payload }.`,
        rawOutputStructure: { kind: 'json-schema', schema: '{"type":"object"}' },
        declaredKind: 'json-schema',
        rawModelAffinity: { reliable: ['haiku', 'sonnet'] },
      });
    } else if (mod === 1) {
      // Tractable + reliable[opus], unreliable[haiku]
      out.push({
        id: `skill-json-op-${i}`,
        name: `skill-json-op-${i}`,
        body: `Returns JSON with capability-heavy fields.`,
        rawOutputStructure: { kind: 'json-schema', schema: '{"type":"object"}' },
        declaredKind: 'json-schema',
        rawModelAffinity: { reliable: ['opus'], unreliable: ['haiku'] },
      });
    } else if (mod === 2) {
      // Tractable (markdown-template) + reliable[sonnet]
      out.push({
        id: `skill-md-${i}`,
        name: `skill-md-${i}`,
        body: `Emits markdown ## Summary / ## Details.`,
        rawOutputStructure: {
          kind: 'markdown-template',
          template: '## Summary\n## Details',
        },
        declaredKind: 'markdown-template',
        rawModelAffinity: { reliable: ['sonnet'] },
      });
    } else if (mod === 3) {
      // Coin-flip (prose) + reliable[sonnet, opus]
      // CF-ME2-02: escalation should NOT fire on coin-flip skills
      out.push({
        id: `skill-prose-${i}`,
        name: `skill-prose-${i}`,
        body: `Generates narrative prose.`,
        rawOutputStructure: { kind: 'prose' },
        declaredKind: 'prose',
        rawModelAffinity: { reliable: ['sonnet', 'opus'] },
      });
    } else if (mod === 4) {
      // Tractable, no affinity declared (CF-ME2-03 neutral)
      out.push({
        id: `skill-json-noa-${i}`,
        name: `skill-json-noa-${i}`,
        body: `Returns JSON, no model preference declared.`,
        rawOutputStructure: { kind: 'json-schema', schema: '{"type":"object"}' },
        declaredKind: 'json-schema',
        rawModelAffinity: undefined,
      });
    } else {
      // Coin-flip, no affinity declared
      out.push({
        id: `skill-prose-noa-${i}`,
        name: `skill-prose-noa-${i}`,
        body: `Prose output with no model preference.`,
        rawOutputStructure: { kind: 'prose' },
        declaredKind: 'prose',
        rawModelAffinity: undefined,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// MD-1 clustered-trace fixtures (planted similarity)
// ---------------------------------------------------------------------------

/**
 * Build a DecisionTrace stream with a 3-cluster planted structure.
 *
 * Three disjoint entity groups (A-*, B-*, C-*); each trace's `entityIds`
 * draws from exactly one group.  After MD-1 training the embeddings for
 * entities in the same group should have cosine similarity higher than
 * cross-group pairs (IT-W4-MD1 acceptance).
 *
 * The timestamps are clustered so that co-occurrence window mining keeps
 * same-group pairs dominant (the intra-cluster ts cadence is 1 s, the
 * inter-cluster gap is 10 min).
 */
export function buildClusteredTraces(
  perCluster: number = 40,
): DecisionTrace[] {
  const groups: Record<string, string[]> = {
    A: ['A-alpha', 'A-beta', 'A-gamma', 'A-delta'],
    B: ['B-alpha', 'B-beta', 'B-gamma', 'B-delta'],
    C: ['C-alpha', 'C-beta', 'C-gamma', 'C-delta'],
  };
  const out: DecisionTrace[] = [];
  let id = 0;
  let ts = 1_700_000_000_000;
  const intra = 1_000; // 1 s between traces inside a cluster
  const gap = 10 * 60 * 1000; // 10 min gap between clusters
  for (const [name, ents] of Object.entries(groups)) {
    for (let i = 0; i < perCluster; i++) {
      // Use a rotating pair of entities from the group so the co-occurrence
      // extractor sees every intra-cluster combination.
      const a = ents[i % ents.length]!;
      const b = ents[(i + 1) % ents.length]!;
      out.push({
        id: `trace-${name}-${id++}`,
        ts,
        actor: 'm5-selector',
        intent: `cluster-${name}-intent-${i}`,
        reasoning: `activity in cluster ${name}`,
        constraints: [],
        alternatives: [],
        outcome: 'success',
        refs: { entityIds: [a, b] },
      });
      ts += intra;
    }
    ts += gap;
  }
  return out;
}

/**
 * Build a degenerate trace stream where every trace carries the same two
 * entities — forcing the MD-1 trainer into a collapsed 1-dimensional
 * representation.  Used by the MD-6 CRITICAL detector test.
 */
export function buildDegenerateTraces(n: number = 120): DecisionTrace[] {
  const out: DecisionTrace[] = [];
  let ts = 1_700_000_000_000;
  for (let i = 0; i < n; i++) {
    out.push({
      id: `trace-deg-${i}`,
      ts,
      actor: 'm5-selector',
      intent: `degenerate-intent-${i}`,
      reasoning: 'all traces share the same two entities',
      constraints: [],
      alternatives: [],
      outcome: 'success',
      refs: { entityIds: ['deg-left', 'deg-right'] },
    });
    ts += 1_000;
  }
  return out;
}

/**
 * Build a dense, high-volume M3 trace stream suitable for MD-1 training.
 * This is a simple thin wrapper around `buildClusteredTraces` kept for
 * callers that don't care about the planted structure.
 */
export function buildM3TraceFixture(perCluster: number = 40): DecisionTrace[] {
  return buildClusteredTraces(perCluster);
}

// ---------------------------------------------------------------------------
// Lyapunov trajectory fixtures (MB-1, MD-5)
// ---------------------------------------------------------------------------

/**
 * Build a `LyapunovFixtureSample[]` trajectory where each sample carries a
 * `taskEmbed` of length `dim` and a regressor that exercises the MB-1
 * adaptation law.  The values decay so V̇ ≤ 0 naturally holds.
 */
export function buildLyapunovFixture(
  steps: number = 10,
  dim: number = 8,
): LyapunovFixtureSample[] {
  const out: LyapunovFixtureSample[] = [];
  for (let i = 0; i < steps; i++) {
    const embed: number[] = [];
    for (let d = 0; d < dim; d++) {
      // small deterministic embedding that varies per step
      embed.push(0.1 * Math.cos((i + d) * 0.3));
    }
    const decay = Math.exp(-i * 0.1);
    out.push({
      taskEmbed: embed,
      observedRate: 0.5 * decay,
      teachingDeclaredRate: 0.5,
      targetKH: 1.0,
      regressor: [0.1 * decay, Math.exp(-i * 0.05)],
      gainG: 0.01,
      gainGamma: 1.0,
      tractGain: 1.0,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// MD-4 Quintessence input
// ---------------------------------------------------------------------------

/**
 * Build a `QuintessenceSnapshot` with caller-specified axes.  All axes
 * default to neutral (0.5 for bounded, 0 for counts).
 */
export function buildQuintessenceSnapshot(
  overrides: Partial<QuintessenceSnapshot> = {},
): QuintessenceSnapshot {
  return {
    ts: 1_700_000_000_000,
    selfVsNonSelf: 0.5,
    essentialTensions: 0.5,
    growthAndEnergyFlow: 500,
    stabilityVsNovelty: 0.5,
    fatefulEncounters: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Multi-channel reinforcement streams (for MA-3+MD-2 / MA-1 composition)
// ---------------------------------------------------------------------------

/**
 * Build a multi-channel stream with `bursts` bursts of `build5ChannelBurst`,
 * separated by `spacing` ms.  Exercises all five reinforcement channels.
 */
export function buildMultiChannelStream(
  bursts: number = 4,
  spacing: number = 60_000,
  skillId: string = 'skill-alpha',
): ReinforcementEvent[] {
  const out: ReinforcementEvent[] = [];
  let ts = 1_700_000_000_000;
  for (let i = 0; i < bursts; i++) {
    out.push(...build5ChannelBurst(skillId, ts));
    ts += spacing;
  }
  return out;
}

// ---------------------------------------------------------------------------
// ME-3 A/B harness mock scorers
// ---------------------------------------------------------------------------

/**
 * Mock scorer for `runAB` that returns scores with a planted B-advantage.
 * Variant B scores mean + bHigh, variant A scores mean (both with small
 * deterministic noise).  Produces "commit-B" verdicts when the planted
 * delta exceeds the tractability-scaled noise floor.
 */
export function planMockScorer(
  mean: number = 50,
  bHigh: number = 15,
  seed: number = 17,
): (body: string, idx: number, variant: 'A' | 'B') => Promise<string> {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return async (_body, _idx, variant) => {
    const noise = next() * 2 - 1; // ±1
    const score = variant === 'B' ? mean + bHigh + noise : mean + noise;
    return String(score);
  };
}

/**
 * Mock scorer that emits pure noise — both variants sampled from the same
 * distribution.  Produces "coin-flip" or "keep-A" verdicts.
 */
export function noisyMockScorer(
  mean: number = 50,
  amplitude: number = 3,
  seed: number = 31,
): (body: string, idx: number, variant: 'A' | 'B') => Promise<string> {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
  return async () => {
    const noise = (next() * 2 - 1) * amplitude;
    return String(mean + noise);
  };
}
