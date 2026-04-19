/**
 * Refinement Wave — shared test fixtures.
 *
 * Synthetic-data builders for Phase 657 integration tests covering the six
 * refinement-wave components (ME-5, ME-1, MA-6, MA-1, MA-2, ME-4).
 *
 * Design notes:
 *   - Reuses the existing Living Sensoria `buildObservations` / `buildM1`
 *     helpers so the M1/M3/M4/M5 surface is identical across both test
 *     suites.
 *   - Everything is pure in-memory; disk IO lives in the test files, not here.
 *   - Skill definitions carry an explicit `output_structure` so ME-5/ME-1
 *     classification is deterministic.  Some skills intentionally omit the
 *     field to exercise the `unknown` path.
 *
 * @module integration/__tests__/refinement/fixture
 */

import {
  buildObservations,
  buildM1,
  buildM3,
  buildM4,
} from '../living-sensoria/fixture.js';
import type { ReinforcementEvent, ReinforcementChannel } from '../../../types/reinforcement.js';

// ---------------------------------------------------------------------------
// Re-export shared living-sensoria builders for convenience.
// ---------------------------------------------------------------------------
export { buildObservations, buildM1, buildM3, buildM4 };

// ---------------------------------------------------------------------------
// Skill fixture shape
// ---------------------------------------------------------------------------

/**
 * A synthetic skill as it appears on disk after ME-5 migration.  The raw
 * `output_structure` is the frontmatter value used by ME-1 / ME-4.
 */
export interface SyntheticSkill {
  /** Skill id (content-addressed name). */
  id: string;
  /** Human-readable name; equal to `id` unless a rename is exercised. */
  name: string;
  /** SKILL.md body (after frontmatter). */
  body: string;
  /**
   * Raw frontmatter `output_structure` value as a YAML-parsed object, string,
   * or `undefined` for "field absent" (exercises the `unknown` path).
   */
  rawOutputStructure: unknown;
  /** Optional declared kind for convenience assertions. */
  declaredKind?: 'json-schema' | 'markdown-template' | 'prose' | 'unknown';
}

// ---------------------------------------------------------------------------
// 50-skill fixture with a known tractability distribution.
// ---------------------------------------------------------------------------

/**
 * Build a 50-skill fixture where:
 *   - 40 skills declare a concrete `output_structure` (20 json-schema,
 *     10 markdown-template, 10 prose) → classifies as tractable/coin-flip.
 *   - 10 skills omit the field entirely → classifies as `unknown`.
 *
 * Expected audit outcome on this fixture:
 *   total = 50, classified = 40 (80%), unknown = 10 (20%).
 *
 * This satisfies IT-W1-ME1 in the relaxed "mixed corpus" form.  For the
 * strict ≥ 95% gate we provide `buildMigratedSkillFixture` below.
 */
export function buildSkillFixture(n: number = 50): SyntheticSkill[] {
  const out: SyntheticSkill[] = [];
  for (let i = 0; i < n; i++) {
    const mod = i % 5;
    if (mod === 0 || mod === 1) {
      // json-schema (2/5 of the corpus)
      out.push({
        id: `skill-json-${i}`,
        name: `skill-json-${i}`,
        body:
          `This skill returns structured JSON matching the schema below.\n` +
          `It produces a JSON object with fields { status, payload }.`,
        rawOutputStructure: {
          kind: 'json-schema',
          schema: '{"type":"object","properties":{"status":{"type":"string"}}}',
        },
        declaredKind: 'json-schema',
      });
    } else if (mod === 2) {
      // markdown-template (1/5 of the corpus)
      out.push({
        id: `skill-md-${i}`,
        name: `skill-md-${i}`,
        body:
          `Emits a markdown document with the following template.\n` +
          `## Summary\n## Details\n## Notes`,
        rawOutputStructure: {
          kind: 'markdown-template',
          template: '## Summary\n## Details\n## Notes',
        },
        declaredKind: 'markdown-template',
      });
    } else if (mod === 3) {
      // prose (1/5 of the corpus)
      out.push({
        id: `skill-prose-${i}`,
        name: `skill-prose-${i}`,
        body:
          `Generates a free-form narrative. Explain the reasoning behind ` +
          `each step in natural prose without JSON or templates.`,
        rawOutputStructure: { kind: 'prose' },
        declaredKind: 'prose',
      });
    } else {
      // unknown (1/5 of the corpus — no output_structure declared)
      out.push({
        id: `skill-unknown-${i}`,
        name: `skill-unknown-${i}`,
        body:
          `No structure declared. Could be prose, could be JSON — the tractability ` +
          `audit should flag this for review.`,
        rawOutputStructure: undefined,
        declaredKind: 'unknown',
      });
    }
  }
  return out;
}

/**
 * Fully-migrated 50-skill fixture: every skill declares `output_structure`,
 * no `unknown` entries.  48 of 50 are tractable (json-schema or
 * markdown-template) and 2 are prose (coin-flip).  Classified ratio = 100%;
 * tractable ratio = 96% — this exceeds the IT-W1-ME5 ≥ 95% gate.
 */
export function buildMigratedSkillFixture(n: number = 50): SyntheticSkill[] {
  const out: SyntheticSkill[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 25 === 24) {
      // 2 prose entries (i = 24, 49)
      out.push({
        id: `skill-prose-${i}`,
        name: `skill-prose-${i}`,
        body: `Free-form narrative output.`,
        rawOutputStructure: { kind: 'prose' },
        declaredKind: 'prose',
      });
    } else if (i % 2 === 0) {
      out.push({
        id: `skill-json-${i}`,
        name: `skill-json-${i}`,
        body: `Returns JSON with fields { status, payload }.`,
        rawOutputStructure: {
          kind: 'json-schema',
          schema: '{"type":"object"}',
        },
        declaredKind: 'json-schema',
      });
    } else {
      out.push({
        id: `skill-md-${i}`,
        name: `skill-md-${i}`,
        body: `Markdown template output with ## Summary / ## Details.`,
        rawOutputStructure: {
          kind: 'markdown-template',
          template: '## Summary\n## Details',
        },
        declaredKind: 'markdown-template',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// On-disk SKILL.md renderer (for ME-5 / ME-1 audit tests)
// ---------------------------------------------------------------------------

/**
 * Render a `SyntheticSkill` back to a SKILL.md-style string (frontmatter +
 * body) so the tractability audit can walk a tempdir as if it were a real
 * skills directory.
 */
export function renderSkillMd(skill: SyntheticSkill): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`name: ${skill.name}`);
  lines.push(`description: ${skill.name} synthetic fixture.`);
  const os = skill.rawOutputStructure;
  if (os && typeof os === 'object' && 'kind' in os) {
    const typed = os as { kind: string; schema?: string; template?: string };
    lines.push(`output_structure:`);
    lines.push(`  kind: ${typed.kind}`);
    if (typed.schema !== undefined) {
      // single-line quoted so our parseSimpleYaml reads it cleanly
      lines.push(`  schema: ${JSON.stringify(typed.schema)}`);
    }
    if (typed.template !== undefined) {
      lines.push(`  template: ${JSON.stringify(typed.template)}`);
    }
  }
  lines.push('---');
  lines.push('');
  lines.push(skill.body);
  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Reinforcement event fixtures
// ---------------------------------------------------------------------------

/**
 * Construct a minimal, typed `ReinforcementEvent` for any channel.
 *
 * Mirrors the `evt()` helper from src/ace/__tests__/integration.test.ts so
 * tests across the stack use the same shape.
 */
export function makeReinforcementEvent(
  channel: ReinforcementChannel,
  magnitude: number,
  ts: number,
  skillId: string,
): ReinforcementEvent {
  const dir =
    magnitude > 0
      ? ('positive' as const)
      : magnitude < 0
        ? ('negative' as const)
        : ('neutral' as const);
  const value = { magnitude, direction: dir };
  const common = { id: `e-${channel}-${ts}-${skillId}`, ts, actor: skillId, value };
  switch (channel) {
    case 'explicit_correction':
      return { ...common, channel, metadata: { skillId, category: 'correction' } };
    case 'outcome_observed':
      return {
        ...common,
        channel,
        metadata: { outcomeKind: magnitude > 0 ? 'test-pass' : 'test-fail', subjectId: skillId },
      };
    case 'branch_resolved':
      return {
        ...common,
        channel,
        metadata: {
          branchId: `branch-${ts}`,
          resolution: magnitude > 0 ? 'committed' : 'aborted',
        },
      };
    case 'surprise_triggered':
      return {
        ...common,
        channel,
        metadata: {
          sigma: 3,
          klDivergence: 1.2,
          threshold: 2,
        },
      };
    case 'quintessence_updated':
      return {
        ...common,
        channel,
        metadata: {
          axes: {
            selfVsNonSelf: 0,
            essentialTensions: 0,
            growthAndEnergyFlow: 0,
            stabilityVsNovelty: 0,
            fatefulEncounters: 0,
          },
        },
      };
    default: {
      const _x: never = channel;
      void _x;
      throw new Error('unreachable');
    }
  }
}

/**
 * Build a 100-step reinforcement fixture stream — one event per step, cycling
 * through all five channels so every decay kernel gets exercised.
 *
 * Ts are spaced 1 minute apart so the per-channel decay factors stay in a
 * regime where they are well above 1e-12 (no pruning artefacts).
 */
export function buildReinforcementStream(
  n: number = 100,
  skillId: string = 'skill-alpha',
  startTs: number = 1_700_000_000_000,
): ReinforcementEvent[] {
  const channels: ReinforcementChannel[] = [
    'explicit_correction',
    'outcome_observed',
    'branch_resolved',
    'surprise_triggered',
    'quintessence_updated',
  ];
  const magnitudes = [-1, 1, 1, -1, 0.25];
  const out: ReinforcementEvent[] = [];
  for (let i = 0; i < n; i++) {
    const ch = channels[i % channels.length]!;
    const mag = magnitudes[i % magnitudes.length]!;
    out.push(makeReinforcementEvent(ch, mag, startTs + i * 60_000, skillId));
  }
  return out;
}

/**
 * Build a minimal, deterministic 5-channel burst — one event per channel at
 * the same timestamp — for the "all 5 channels emit cleanly" coverage test.
 */
export function build5ChannelBurst(
  skillId: string = 'skill-alpha',
  ts: number = 1_700_000_000_000,
): ReinforcementEvent[] {
  return [
    makeReinforcementEvent('explicit_correction', -1, ts, skillId),
    makeReinforcementEvent('outcome_observed', 1, ts + 1, skillId),
    makeReinforcementEvent('branch_resolved', 1, ts + 2, skillId),
    makeReinforcementEvent('surprise_triggered', -1, ts + 3, skillId),
    makeReinforcementEvent('quintessence_updated', 0.25, ts + 4, skillId),
  ];
}

// ---------------------------------------------------------------------------
// Candidate / ACE tick helpers
// ---------------------------------------------------------------------------

/**
 * A "session" fixture: a query string plus a small candidate pool derived
 * from a SyntheticSkill set.  Used by the SC-REF-FLAG-OFF byte-identity test
 * to drive 50 selector calls deterministically.
 */
export interface Session {
  query: string;
  candidates: Array<{ id: string; content: string; importance: number }>;
  ts: number;
}

/**
 * Derive 50 deterministic sessions from a SyntheticSkill fixture.  Each
 * session picks 3 candidates from the skills array in a rotating window so
 * every skill participates in multiple sessions.
 */
export function buildSessionFixture(
  skills: SyntheticSkill[],
  n: number = 50,
): Session[] {
  const queries = [
    'debug and trace',
    'refactor component',
    'emit structured output',
    'explain reasoning',
    'run test suite',
    'format source',
  ];
  const sessions: Session[] = [];
  const len = skills.length;
  const poolSize = Math.min(3, len);
  for (let i = 0; i < n; i++) {
    const q = queries[i % queries.length]!;
    const cands: Session['candidates'] = [];
    for (let k = 0; k < poolSize; k++) {
      const sk = skills[(i + k) % len]!;
      cands.push({
        id: sk.id,
        content: sk.body.slice(0, 80),
        importance: ((i * 7 + k * 3) % 10) / 20 + 0.1, // deterministic in [0.1, 0.6)
      });
    }
    sessions.push({
      query: q,
      candidates: cands,
      ts: 1_700_000_000_000 + i * 60_000,
    });
  }
  return sessions;
}

// ---------------------------------------------------------------------------
// TD-reference helpers
// ---------------------------------------------------------------------------

/**
 * Analytic TD reference: compute `δ = r̄ + γ · ΔF_curr − ΔF_prev` directly.
 * Used by IT-W1-MA1 to assert MA-2's `computeTDError` result matches the
 * hand-computed value to ≤ 1e-6.
 */
export function analyticTD(
  rBar: number,
  negFPrev: number,
  negFCurr: number,
  gamma: number = 0.95,
): number {
  return rBar + gamma * negFCurr - negFPrev;
}

/**
 * Hand-computed eligibility-weighted reinforcement average:
 *   r̄ = Σ(e_c · r_c) / Σ|e_c|
 * Mirrors `averageReinforcementAcrossChannels` from src/ace/td-error.ts so
 * IT-W1-MA1 can cross-check without importing the production function.
 */
export function analyticRBar(
  readings: Array<{ eligibility: number; reinforcement: number }>,
): number {
  if (readings.length === 0) return 0;
  let num = 0;
  let denom = 0;
  for (const r of readings) {
    num += r.eligibility * r.reinforcement;
    denom += Math.abs(r.eligibility);
  }
  if (denom > 0) return num / denom;
  let sum = 0;
  for (const r of readings) sum += r.reinforcement;
  return sum / readings.length;
}
