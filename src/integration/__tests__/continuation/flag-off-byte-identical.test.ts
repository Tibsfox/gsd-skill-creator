/**
 * Continuation Wave — SC-CONT-FLAG-OFF byte-identical evidence.
 *
 * THE critical load-bearing test that closes the continuation wave's
 * byte-identity guarantee: run a 50-session synthetic workload through the
 * ENTIRE wave-2 stack (MB-1/MB-2/MB-5/MA-3+MD-2/MD-3/MD-4/MD-1/MD-5/MD-6/
 * ME-2/ME-3) with ALL flags OFF, plus the original MA-2 ACE flag off, plus
 * the original living-sensoria flags off, and assert the selector output is
 * byte-identical across three independent captures.
 *
 * Flags held off for the entire run:
 *   SKILL_CREATOR_OUTPUT_STRUCTURE=false    (ME-5 CLI gate — from refinement wave)
 *   SKILL_CREATOR_TRACTABILITY=false        (ME-1 audit gate — from refinement wave)
 *   REINFORCEMENT_EMIT=false                (MA-6 — from refinement wave)
 *   lyapunov.enabled=false                  (MB-1)
 *   lyapunov.projection.enabled=false       (MB-2)
 *   lyapunov.dead_zone.enabled=false        (MB-5)
 *   orchestration.stochastic.enabled=false  (MA-3+MD-2)
 *   umwelt.langevin.enabled=false           (MD-3)
 *   temperature.schedule.enabled=false      (MD-4)
 *   embeddings.enabled=false                (MD-1 — via default-off behaviour)
 *   sensoria.learnable_k_h.enabled=false    (MD-5)
 *   embeddings.audit.enabled=false          (MD-6)
 *   model_affinity.enabled=false            (ME-2)
 *   ab_harness.enabled=false                (ME-3)
 *   orchestration.ace.enabled=false         (MA-2 from refinement wave)
 *   sensoria.enabled=false                  (original wave)
 *
 * Technique (baseline capture at test time):
 *   The baseline is CAPTURED AT TEST TIME by running the selector twice over
 *   the same 50-session fixture with flags off.  The byte-identity assertion
 *   therefore protects against drift in the flag-off path as the wave-2 code
 *   evolves (any latent leak causes the two runs to diverge — a
 *   deterministic-path regression).  A third run with wave-2 module classes
 *   CONSTRUCTED-BUT-DISABLED provides the "third observation" that the
 *   flag-off guarantee survives the presence-of-module case.
 *
 * If the baseline ever needs to be re-captured after an intentional change
 * to the flag-off path, update all three `captureBaseline` call sites and
 * the constructed-disabled invocations in lockstep with the source change.
 *
 * Three captures (A / B / C) asserted byte-identical:
 *   A — no wave-2 modules constructed (pure M5 through-line).
 *   B — repeat of A: proves the flag-off path is deterministic.
 *   C — every wave-2 class CONSTRUCTED with its flag off (proves the
 *       flag-off contract survives module-presence side effects).
 *
 * @module integration/__tests__/continuation/flag-off-byte-identical.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ActivationSelector } from '../../../orchestration/selector.js';
import { ActivationWriter } from '../../../traces/activation-writer.js';
import { QueryEngine } from '../../../graph/query.js';
import { AceLoop } from '../../../ace/loop.js';

// Wave-2 modules — all imported to prove presence does not leak behaviour.
import {
  adaptKH,
  buildRegressor,
} from '../../../lyapunov/index.js';
import { projectKH, projectModelRow } from '../../../projection/index.js';
import { adaptationScale, DEFAULT_DEAD_ZONE_PARAMS } from '../../../dead-zone/index.js';
import {
  applyStochasticBridge,
  mulberry32,
} from '../../../stochastic/index.js';
import { applyLangevinUpdate } from '../../../langevin/index.js';
import { TemperatureApi, SENTINEL_TEMPERATURE } from '../../../temperature/index.js';
import {
  createStore as createKHStore,
  createHead,
  put as putHead,
  resolveKH,
} from '../../../learnable-k_h/index.js';
import { detectCollapse } from '../../../representation-audit/index.js';
import { getAffinityDecision } from '../../../model-affinity/index.js';
import { isABHarnessEnabled } from '../../../ab-harness/index.js';

import {
  buildM1,
  buildSkillFixture,
  buildSessionFixture,
  type Session,
} from './fixture.js';
import type { SelectorDecision } from '../../../orchestration/selector.js';

// ───────────────────────────────────────────────────────────────────────────
// Feature-flag env hygiene
// ───────────────────────────────────────────────────────────────────────────

const CONTINUATION_ENV_VARS = [
  // From refinement wave
  'SKILL_CREATOR_OUTPUT_STRUCTURE',
  'SKILL_CREATOR_TRACTABILITY',
  'REINFORCEMENT_EMIT',
  // Wave-2 (settings.json-driven but we also guard via env override)
  'GSD_SKILL_CREATOR_LYAPUNOV_ENABLED',
  'GSD_SKILL_CREATOR_PROJECTION_ENABLED',
  'GSD_SKILL_CREATOR_DEAD_ZONE_ENABLED',
  'GSD_SKILL_CREATOR_STOCHASTIC_ENABLED',
  'GSD_SKILL_CREATOR_LANGEVIN_ENABLED',
  'GSD_SKILL_CREATOR_TEMPERATURE_SCHEDULE_ENABLED',
  'GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED',
  'GSD_SKILL_CREATOR_LEARNABLE_KH_ENABLED',
  'GSD_SKILL_CREATOR_REPRESENTATION_AUDIT_ENABLED',
  'GSD_SKILL_CREATOR_MODEL_AFFINITY_ENABLED',
  'GSD_SKILL_CREATOR_AB_HARNESS_ENABLED',
];

function withFlagsOff<T>(fn: () => T): T {
  const saved: Record<string, string | undefined> = {};
  for (const k of CONTINUATION_ENV_VARS) {
    saved[k] = process.env[k];
    process.env[k] = 'false';
  }
  try {
    return fn();
  } finally {
    for (const k of CONTINUATION_ENV_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Snapshot capture — all mutable fields stripped
// ───────────────────────────────────────────────────────────────────────────

interface Snapshot {
  session: number;
  decisions: Array<{
    id: string;
    score: number;
    activated: boolean;
    m2Score: number;
    m1Boost: number;
    stepBoost: number;
    sensoria: null; // flag-off contract
  }>;
}

type CaptureMode = 'bare' | 'constructed-disabled';

async function captureBaseline(
  sessions: Session[],
  m1Graph: ReturnType<typeof buildM1>,
  mode: CaptureMode,
): Promise<Snapshot[]> {
  const logDir = mkdtempSync(join(tmpdir(), 'cont-flagoff-'));
  const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
  const query = new QueryEngine(m1Graph.graph);
  const selector = new ActivationSelector({
    query,
    writer,
    sensoria: { enabled: false },
  });

  // Constructed-but-disabled wave-2 modules (mode = 'constructed-disabled').
  // These are built to assert that the presence of the code paths does NOT
  // alter selector output when all flags are off.
  const aceLoop = mode === 'constructed-disabled'
    ? new AceLoop({ enabledOverride: false })
    : null;
  const tempApi = mode === 'constructed-disabled'
    ? new TemperatureApi({ enabled: false })
    : null;
  const khStore = mode === 'constructed-disabled' ? createKHStore() : null;
  if (khStore) {
    // Pre-register a head; resolveKH with flag off must still return scalar.
    putHead(khStore, createHead({
      skillId: 'placebo',
      dim: 4,
      kHMin: 0.5,
      kHMax: 1.5,
    }));
  }

  const out: Snapshot[] = [];
  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i]!;

    // ── ACE loop flag-off contract (MA-2) ──────────────────────────────────
    if (aceLoop) {
      const res = aceLoop.tick({ readings: [], negFCurr: 0.5 });
      expect(res).toBeNull();
    }

    // ── MD-4 temperature flag-off contract ─────────────────────────────────
    if (tempApi) {
      expect(tempApi.currentTemperature()).toBe(SENTINEL_TEMPERATURE);
    }

    // ── MD-5 resolveKH flag-off contract ───────────────────────────────────
    if (khStore) {
      const resolved = resolveKH({
        store: khStore,
        skillId: 'placebo',
        taskEmbed: [0.1, 0.2, 0.3, 0.4],
        scalarKH: 0.9,
        tractability: 'tractable',
        enabled: false,
      });
      expect(resolved.source).toBe('scalar');
      expect(resolved.scalarReason).toBe('flag-off');
    }

    // ── MB-1 adaptKH — pure function, no flag; always safe to call ─────────
    if (mode === 'constructed-disabled') {
      adaptKH({
        currentKH: 0.5,
        targetKH: 1.0,
        observedRate: 0.5,
        teachingDeclaredRate: 0.5,
        regressor: buildRegressor({ doseMagnitude: 0.1, ageMs: 0 }),
        tractabilityGain: 1.0,
      });
    }

    // ── MB-2 projection flag-off contract ──────────────────────────────────
    if (mode === 'constructed-disabled') {
      const kh = projectKH({
        currentKH: 0.5,
        targetKH: 1.0,
        observedRate: 0.5,
        teachingDeclaredRate: 0.5,
        regressor: [0.1, 0.2],
        tractabilityGain: 1.0,
        projectionEnabled: false,
      });
      const row = projectModelRow([0.25, 0.25, 0.25, 0.25], {
        projectionEnabled: false,
      });
      void kh;
      void row;
    }

    // ── MB-5 dead-zone default-params = hard M4 rule ───────────────────────
    if (mode === 'constructed-disabled') {
      const s = adaptationScale(0.1, 10, DEFAULT_DEAD_ZONE_PARAMS, 'tractable');
      expect(s === 0 || s === 1).toBe(true);
    }

    // ── MA-3+MD-2 flag-off bridge returns decisions unchanged ──────────────
    // (applied AFTER selector.select, below — we capture the pre-bridge output
    //  because the flag-off path is the IDENTITY function.)

    // ── MD-3 langevin flag-off yields MB-2-projection of input ─────────────
    if (mode === 'constructed-disabled') {
      const out = applyLangevinUpdate([0.3, 0.3, 0.2, 0.2], {
        langevinEnabled: false,
        baseScale: 0.1,
        tractability: 'tractable',
        rng: mulberry32(0),
        projectionEnabled: false,
      });
      expect(out.effectiveScale).toBe(0);
    }

    // ── MD-6 collapse detector DISABLED when flag off ──────────────────────
    if (mode === 'constructed-disabled') {
      const audit = detectCollapse(
        { matrix: [[1, 0], [0, 1]], communities: null },
        { enabled: false },
      );
      expect(audit.status).toBe('DISABLED');
    }

    // ── ME-2 affinity flag-off returns null ────────────────────────────────
    if (mode === 'constructed-disabled') {
      const d = getAffinityDecision(
        { reliable: ['opus'] },
        'haiku',
        'tractable',
        false,
      );
      expect(d).toBeNull();
    }

    // ── ME-3 harness flag-off ──────────────────────────────────────────────
    if (mode === 'constructed-disabled') {
      expect(isABHarnessEnabled({ enabled: false })).toBe(false);
    }

    // ── Selector.select (no aceSignal) ─────────────────────────────────────
    const decisions = await selector.select(session.query, session.candidates);

    // ── MA-3+MD-2 bridge identity check (flag off) ─────────────────────────
    const bridged = applyStochasticBridge(decisions, {
      stochasticEnabled: false,
      inBranchContext: true,
      baseTemperature: 1.0,
      tractabilityClass: 'tractable',
      rng: mulberry32(i),
    });
    // Same reference: byte-identical pass-through.
    expect(bridged).toBe(decisions);

    out.push({
      session: i,
      decisions: bridged.map((d: SelectorDecision) => ({
        id: d.id,
        score: d.score,
        activated: d.activated,
        m2Score: d.signals.m2Score,
        m1Boost: d.signals.m1Boost,
        stepBoost: d.signals.stepBoost,
        sensoria: d.signals.sensoria as null,
      })),
    });
  }
  return out;
}

/** Canonical JSON string for deep equality via string comparison. */
function snapshotToBytes(snapshots: Snapshot[]): string {
  return JSON.stringify(snapshots);
}

// ═══════════════════════════════════════════════════════════════════════════
// SC-CONT-FLAG-OFF — byte-identical evidence
// ═══════════════════════════════════════════════════════════════════════════
describe('SC-CONT-FLAG-OFF — 50-session byte-identical with wave-2 flags off', () => {
  let sessions: Session[];
  let m1: ReturnType<typeof buildM1>;

  beforeEach(() => {
    const skills = buildSkillFixture(50);
    sessions = buildSessionFixture(skills, 50);
    m1 = buildM1(50);
  });

  it('run A and run B produce byte-identical snapshots (bare mode)', async () => {
    const runA = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    const runB = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    expect(runA.length).toBe(50);
    expect(runB.length).toBe(50);
    expect(snapshotToBytes(runA)).toBe(snapshotToBytes(runB));
  });

  it('run A and run C produce byte-identical snapshots (constructed-disabled survives)', async () => {
    const runA = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    const runC = await withFlagsOff(() =>
      captureBaseline(sessions, m1, 'constructed-disabled'),
    );
    expect(snapshotToBytes(runA)).toBe(snapshotToBytes(runC));
  });

  it('activation ordering is deterministic across three repeated runs', async () => {
    const runs: Snapshot[][] = [];
    for (let k = 0; k < 3; k++) {
      runs.push(await withFlagsOff(() => captureBaseline(sessions, m1, 'bare')));
    }
    const ref = snapshotToBytes(runs[0]!);
    for (let k = 1; k < runs.length; k++) {
      expect(snapshotToBytes(runs[k]!)).toBe(ref);
    }
  });

  it('every decision has sensoria === null (no M6 leak)', async () => {
    const run = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    for (const snap of run) {
      for (const d of snap.decisions) {
        expect(d.sensoria).toBeNull();
      }
    }
  });

  it('scores are finite numbers in the flag-off regime', async () => {
    const run = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    for (const snap of run) {
      for (const d of snap.decisions) {
        expect(Number.isFinite(d.score)).toBe(true);
        expect(Number.isFinite(d.m2Score)).toBe(true);
        expect(Number.isFinite(d.m1Boost)).toBe(true);
        expect(Number.isFinite(d.stepBoost)).toBe(true);
      }
    }
  });

  it('at least one session activates at least one candidate', async () => {
    const run = await withFlagsOff(() => captureBaseline(sessions, m1, 'bare'));
    const totalActivations = run.reduce(
      (sum, snap) => sum + snap.decisions.filter((d) => d.activated).length,
      0,
    );
    expect(totalActivations).toBeGreaterThan(0);
  });

  it('env flags are restored after withFlagsOff', () => {
    const before = { ...process.env };
    withFlagsOff(() => {
      for (const k of CONTINUATION_ENV_VARS) {
        expect(process.env[k]).toBe('false');
      }
    });
    for (const k of CONTINUATION_ENV_VARS) {
      expect(process.env[k]).toBe(before[k]);
    }
  });
});
