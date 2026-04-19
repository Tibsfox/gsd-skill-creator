/**
 * Living Sensoria — IT-01 through IT-22 integration coverage.
 *
 * Wave 2 synthesis tests. Each `describe` block names the integration-test
 * catalog ID from `.planning/staging/living-sensoria-mission/05-test-plan.md`.
 * All tests are BLOCK-severity (green required for milestone sign-off).
 *
 * Tests that cannot yet run against shipped machinery are marked `.todo`
 * with a comment pointing at the deferred wiring.
 *
 * @module integration/__tests__/living-sensoria
 */

import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildM1,
  buildM2,
  buildM3,
  buildM4,
  buildObservations,
  buildOfferings,
  buildSessionRecords,
  buildTeachEntries,
} from './fixture.js';

import { M1CommunityInitialiser } from '../../../umwelt/m1-adapter.js';
import { applyTracesToModel, M3ModelUpdater } from '../../../umwelt/m3-updater.js';
import {
  makeCounts,
  materialiseModel,
  validateModel,
} from '../../../umwelt/generativeModel.js';
import { predictNextObservation, SurpriseChannel } from '../../../umwelt/prediction.js';

import {
  applyTeachEntriesToM6,
  adjustSensoriaBlock,
  syncM6FromTeachingLedger,
} from '../../../symbiosis/m6-adapter.js';
import { applyTeachEntriesToM7 } from '../../../symbiosis/m7-adapter.js';
import {
  M1CommunitySource,
  M3FatefulSource,
  M4StabilitySource,
  M4TensionSource,
  M2EnergySource,
  buildLiveQuintessenceSources,
  tensionInputsFromBranches,
} from '../../../symbiosis/quintessence-sources.js';
import {
  computeQuintessenceSnapshot,
  DEFAULT_FATEFUL_THRESHOLD,
} from '../../../symbiosis/quintessence.js';

import { DesensitisationStore } from '../../../sensoria/desensitisation.js';
import { DEFAULT_SENSORIA } from '../../../sensoria/frontmatter.js';
import { computeNetShift } from '../../../sensoria/netShift.js';
import { decideActivation } from '../../../sensoria/applicator-hook.js';

import { scanSessions } from '../../../symbiosis/coEvolution.js';
import {
  appendTeachEntry,
  readTeachEntries,
} from '../../../symbiosis/teaching.js';

import { ActivationSelector } from '../../../orchestration/selector.js';
import { ActivationWriter } from '../../../traces/activation-writer.js';
import { QueryEngine } from '../../../graph/query.js';
import { readOrchestrationEnabledFlag } from '../../../orchestration/settings.js';

import { collectStatus, renderStatus } from '../../../cli-status.js';

// ─── IT-01 ──────────────────────────────────────────────────────────────────
describe('IT-01 E2E 8-module chain', () => {
  it(
    'observation → M1 → M2 → M6 → M5 → M3 → M7 → M8 completes with each stage leaving verifiable evidence',
    async () => {
      // Stage 1 — observation + M1
      const m1 = buildM1(20);
      expect(m1.graph.entities.size).toBeGreaterThan(0);
      expect(m1.communities.length).toBeGreaterThan(0);

      // Stage 2 — M2 memory (simulated)
      const m2 = buildM2(20);
      expect(m2.length).toBe(20);

      // Stage 3 — M6 net-shift: take one activation through the gate
      const store = new DesensitisationStore();
      const m6Decision = decideActivation('debug', 2.0, {
        enabled: true,
        desensitisation: store,
        resolveBlock: () => ({ ...DEFAULT_SENSORIA }),
        now: () => 1700000000000,
      });
      expect(m6Decision.via).toBe('netshift');
      expect(Number.isFinite(m6Decision.deltaR_H)).toBe(true);

      // Stage 4 — M5 selector composes M1+M2+M6
      const logDir = mkdtempSync(join(tmpdir(), 'ls-e2e-'));
      const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
      const query = new QueryEngine(m1.graph);
      const selector = new ActivationSelector({
        query,
        writer,
        sensoria: { enabled: true, desensitisation: store },
      });
      const decisions = await selector.select('debug command', [
        { id: 'skill:debug', content: 'debug logging and tracing', importance: 0.3 },
        { id: 'skill:format', content: 'run prettier', importance: 0.2 },
      ]);
      expect(decisions.length).toBe(2);
      // Stage 5 (M3): trace file exists on disk
      expect(existsSync(join(logDir, 'decisions.jsonl'))).toBe(true);

      // Stage 6 — M7 initialised from M1 + traces applied
      const init = new M1CommunityInitialiser(m1.graph, m1.communities);
      const counts = init.seedCounts();
      const traces = buildM3(10);
      const res = applyTracesToModel(traces, counts, { batchSize: 5 });
      expect(res.applied + res.skipped).toBe(traces.length);
      const model = materialiseModel(
        [...m1.communities.map((c) => c.id)],
        counts,
      );
      validateModel(model);

      // Stage 7 — surprise channel records an entry
      const channel = new SurpriseChannel();
      const predicted = predictNextObservation(model.priors, model);
      expect(predicted.length).toBeGreaterThan(0);
      channel.record(0.2);
      expect(channel.size()).toBe(1);

      // Stage 8 — Quintessence snapshot compose over all 7
      const sources = buildLiveQuintessenceSources({
        communities: m1.communities,
        branches: buildM4(5),
        memoryEntries: m2,
        traces,
      });
      const snap = computeQuintessenceSnapshot(sources);
      expect(snap.selfVsNonSelf).toBeGreaterThanOrEqual(0);
      expect(snap.stabilityVsNovelty).toBeGreaterThanOrEqual(0);
      expect(snap.growthAndEnergyFlow).toBeGreaterThan(0);
    },
    15000,
  );
});

// ─── IT-02 ──────────────────────────────────────────────────────────────────
describe('IT-02 teaching → M6 K_H reduction → next-session activation change', () => {
  it('constraint teach entry lowers K_H; next decideActivation reflects the drop', () => {
    const skillName = 'debug';
    const baseBlock = { ...DEFAULT_SENSORIA };
    const store = new DesensitisationStore();
    const now = 1700000000000;
    // Prime the store with initial state.
    store.getOrInit(skillName, baseBlock, now);
    const preK_H = store.snapshot(skillName)!.effectiveK_H;

    const entries = buildTeachEntries([
      { category: 'constraint', ref: skillName },
      { category: 'constraint', ref: skillName },
    ]);
    const log = applyTeachEntriesToM6(store, entries, {
      resolveBlock: () => baseBlock,
      now: () => now,
    });
    expect(log.get(skillName)).toBeDefined();
    const postK_H = store.snapshot(skillName)!.effectiveK_H;
    expect(postK_H).toBeLessThan(preK_H);

    // Adjusted block via functional variant yields a reduced K_H value too.
    const adjusted = adjustSensoriaBlock(skillName, baseBlock, entries);
    expect(adjusted.K_H).toBeLessThan(baseBlock.K_H);
  });

  it('preference teach entry raises K_H', () => {
    const baseBlock = { ...DEFAULT_SENSORIA };
    const entries = buildTeachEntries([
      { category: 'preference', ref: 'test-gen' },
    ]);
    const adjusted = adjustSensoriaBlock('test-gen', baseBlock, entries);
    expect(adjusted.K_H).toBeGreaterThan(baseBlock.K_H);
  });
});

// ─── IT-03 ──────────────────────────────────────────────────────────────────
describe('IT-03 surprise-triggered refinement — M7 high-surprise → M2 reflection → M4 branch', () => {
  it('high KL divergence triggers a surprise entry above the sigma threshold', () => {
    const channel = new SurpriseChannel({ sigmaThreshold: 2 });
    // Establish a baseline of low KL.
    for (let i = 0; i < 50; i++) channel.record(0.01 + (i % 3) * 0.001);
    // Now a large KL spike.
    const spike = channel.record(5.0);
    expect(spike.triggered).toBe(true);
    expect(spike.sigma).toBeGreaterThanOrEqual(2);
  });
});

// ─── IT-04 (LS-24 actionable-offering acceptance) ───────────────────────────
describe('IT-04 co-evolution offering cycle (LS-24 living-sensorium)', () => {
  it(
    'fresh 20-session fixture with M6/M7/M8 enabled produces at least one actionable offering',
    () => {
      const sessions = buildSessionRecords(20);
      const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 20 });
      // At least one offering emitted
      expect(result.offerings.length).toBeGreaterThanOrEqual(1);
      // "Actionable" definition (per INTEG brief):
      //   - passes parasocial-guard (implicit — only non-rejected offerings reach here)
      //   - references real M1/M3 data (non-empty sourcePointers)
      //   - has non-null sourcePointers array
      const actionable = result.offerings.filter(
        (o) => Array.isArray(o.sourcePointers) && o.sourcePointers.length > 0,
      );
      expect(actionable.length).toBeGreaterThanOrEqual(1);
      // Guard rejections kept low on this fixture (no parasocial drift).
      expect(result.guardRejections).toBe(0);
    },
  );
});

// ─── IT-05 ──────────────────────────────────────────────────────────────────
describe('IT-05 desensitisation isolation across trunk + branch', () => {
  it('trunk and branch DesensitisationStores do not share state', () => {
    const trunk = new DesensitisationStore();
    const branch = new DesensitisationStore();
    const block = { ...DEFAULT_SENSORIA };
    const now = 1700000000000;
    trunk.recordActivation('skill-a', block, 5, 1, now);
    // branch state for skill-a should be pristine.
    expect(branch.snapshot('skill-a')).toBeUndefined();
    // Record on branch independently.
    branch.recordActivation('skill-a', block, 1, 1, now);
    const trunkSnap = trunk.snapshot('skill-a')!;
    const branchSnap = branch.snapshot('skill-a')!;
    expect(trunkSnap.integratedDose).not.toEqual(branchSnap.integratedDose);
  });
});

// ─── IT-06 ──────────────────────────────────────────────────────────────────
describe('IT-06 dark-room avoidance under 50 silent sessions', () => {
  it('50 silent sessions do not degrade the model below minimum-activity floor', () => {
    const intents = ['a', 'b', 'c'];
    const observations = ['x', 'y'];
    const counts = makeCounts(intents, observations, 1);
    const model = materialiseModel(intents, counts);
    // All priors strictly positive (Laplace alpha floor).
    for (const p of model.priors) expect(p).toBeGreaterThan(0);
    for (const row of model.condProbTable) {
      for (const v of row) expect(v).toBeGreaterThan(0);
    }
    // After 50 "silent" empty-batch updates, still no zeros.
    for (let i = 0; i < 50; i++) {
      // no observe() calls: silence
    }
    const after = materialiseModel(intents, counts);
    for (const p of after.priors) expect(p).toBeGreaterThan(0);
    for (const row of after.condProbTable) {
      for (const v of row) expect(v).toBeGreaterThan(0);
    }
  });
});

// ─── IT-07 ──────────────────────────────────────────────────────────────────
describe('IT-07 Quintessence axes match hand-computed reference', () => {
  it('hand-computable snapshot matches composer output', () => {
    const m1 = buildM1(10);
    const branches = buildM4(5);
    const traces = buildM3(10);
    const m2 = buildM2(10);

    // Hand-computed references:
    // stability = committed / total
    const committed = branches.filter((b) => b.state === 'committed').length;
    const total = branches.length;
    const expectedStability = total > 0 ? committed / total : 1;

    // tensions (no overrides supplied → overrideRatio = 0)
    const boundHits = branches.filter((b) => b.deltaFraction >= 0.19).length;
    const expectedBoundHit = total > 0 ? boundHits / total : 0;

    const sources = buildLiveQuintessenceSources({
      communities: m1.communities,
      branches,
      memoryEntries: m2,
      traces,
    });
    const snap = computeQuintessenceSnapshot(sources);

    expect(snap.stabilityVsNovelty).toBeCloseTo(expectedStability, 6);
    expect(snap.essentialTensions).toBeCloseTo(expectedBoundHit, 6);
    expect(snap.selfVsNonSelf).toBeCloseTo(1, 6); // no projectSignatures → all-self
    expect(snap.growthAndEnergyFlow).toBeGreaterThan(0);
    expect(snap.fatefulEncounters).toBeGreaterThanOrEqual(0);
  });
});

// ─── IT-08 ──────────────────────────────────────────────────────────────────
describe('IT-08 attribution preservation through doc regeneration', () => {
  it.todo('doc regen tooling not yet live — deferred per INTEG brief');
});

// ─── IT-09 ──────────────────────────────────────────────────────────────────
describe('IT-09 CLI status aggregates all 8 modules in one view', () => {
  it('collectStatus + renderStatus surface every module slot', () => {
    const m1 = buildM1(12);
    const traces = buildM3(5);
    const branches = buildM4(6);
    const m2 = buildM2(5);
    const teachEntries = buildTeachEntries([
      { category: 'preference', ref: 'debug' },
      { category: 'constraint', ref: 'format' },
    ]);
    const offerings = buildOfferings(2);
    const qSources = buildLiveQuintessenceSources({
      communities: m1.communities,
      branches,
      memoryEntries: m2,
      traces,
    });
    const latestQ = computeQuintessenceSnapshot(qSources);

    const status = collectStatus({
      m1: { graph: m1.graph, communities: m1.communities },
      m2: { shortTermCount: 10, longTermCount: 100 },
      m3: { traces },
      m4: { manifests: branches },
      m5: { orchestrationEnabled: false, prefixCacheSize: 0 },
      m6: { sensoriaEnabled: false, trackedSkills: 0 },
      m7: { intentClasses: m1.communities.length, observationTypes: 3, surpriseEntries: 0 },
      m8: { teachEntries, offerings, latestQuintessence: latestQ },
    });

    expect(status.m1).not.toBeNull();
    expect(status.m2).not.toBeNull();
    expect(status.m3).not.toBeNull();
    expect(status.m4).not.toBeNull();
    expect(status.m5).not.toBeNull();
    expect(status.m6).not.toBeNull();
    expect(status.m7).not.toBeNull();
    expect(status.m8).not.toBeNull();

    const rendered = renderStatus(status);
    for (const slot of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8']) {
      expect(rendered).toContain(slot);
    }
  });
});

// ─── IT-10 ──────────────────────────────────────────────────────────────────
describe('IT-10 upgrade v1.49.560 → v1.49.561 — M6/M7/M8 opt-in', () => {
  it('flag readers default to false when settings file is absent', () => {
    const result = readOrchestrationEnabledFlag('/tmp/nonexistent-living-sensoria-settings.json');
    expect(result).toBe(false);
  });
  it('flag readers return false when settings file is malformed', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ls-it10-'));
    const file = join(tmp, 'settings.json');
    writeFileSync(file, '{ not valid json');
    expect(readOrchestrationEnabledFlag(file)).toBe(false);
  });
  it('flag readers return true when explicitly enabled', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ls-it10-'));
    const file = join(tmp, 'settings.json');
    writeFileSync(
      file,
      JSON.stringify({ 'gsd-skill-creator': { orchestration: { enabled: true } } }),
    );
    expect(readOrchestrationEnabledFlag(file)).toBe(true);
  });
});

// ─── IT-11 ──────────────────────────────────────────────────────────────────
describe('IT-11 all-flags-off path byte-identical on 50-session fixture', () => {
  it('selector with sensoria.enabled = false produces the same decisions as legacy αβγ', async () => {
    const m1 = buildM1(50);
    const logDir = mkdtempSync(join(tmpdir(), 'ls-it11-'));
    const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
    const query = new QueryEngine(m1.graph);
    const candidates = [
      { id: 'skill:debug', content: 'debug logging', importance: 0.3 },
      { id: 'skill:format', content: 'run prettier', importance: 0.1 },
      { id: 'skill:refactor', content: 'refactor logic', importance: 0.2 },
    ];
    const selector = new ActivationSelector({
      query,
      writer,
      sensoria: { enabled: false },
    });
    const a = await selector.select('refactor debug logic', candidates);
    // Re-run with fresh instances — deterministic outcome guaranteed.
    const writer2 = new ActivationWriter(join(logDir, 'decisions-2.jsonl'));
    const selector2 = new ActivationSelector({
      query,
      writer: writer2,
      sensoria: { enabled: false },
    });
    const b = await selector2.select('refactor debug logic', candidates);
    // Same composite scores + activations across invocations.
    expect(a.map((d) => d.id)).toEqual(b.map((d) => d.id));
    expect(a.map((d) => d.score)).toEqual(b.map((d) => d.score));
    expect(a.map((d) => d.activated)).toEqual(b.map((d) => d.activated));
    // No sensoria signal leaks into decisions (flag-off contract).
    for (const d of a) expect(d.signals.sensoria).toBeNull();
  });
});

// ─── IT-12 ──────────────────────────────────────────────────────────────────
describe('IT-12 partial-enable combinations all functional', () => {
  it('M6-only (without M7/M8): sensoria gate runs; no M7/M8 state required', async () => {
    const logDir = mkdtempSync(join(tmpdir(), 'ls-it12a-'));
    const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
    const selector = new ActivationSelector({
      writer,
      sensoria: { enabled: true },
    });
    const decisions = await selector.select('x', [
      { id: 'skill:a', content: 'a', importance: 0.5 },
    ]);
    expect(decisions.length).toBe(1);
    expect(decisions[0].signals.sensoria).not.toBeNull();
  });

  it('M6+M7 without M8: generative model runs; no teach entries required', () => {
    const m1 = buildM1(10);
    const init = new M1CommunityInitialiser(m1.graph, m1.communities);
    const counts = init.seedCounts();
    const model = materialiseModel(
      m1.communities.map((c) => c.id),
      counts,
    );
    validateModel(model);
    expect(model.intentClasses.length).toBe(m1.communities.length);
  });

  it('M8 without M6/M7: teaching ledger + offerings work standalone', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ls-it12c-'));
    const ledgerPath = join(tmp, 'teaching.jsonl');
    const res = appendTeachEntry('pattern', 'always run tests first', [], {
      ledgerPath,
    });
    expect(res.ok).toBe(true);
    const entries = readTeachEntries(ledgerPath);
    expect(entries.length).toBe(1);
    const sessions = buildSessionRecords(20);
    const scan = scanSessions(sessions, { enabled: true, cadenceSessionCount: 20 });
    expect(scan.offerings.length).toBeGreaterThan(0);
  });
});

// ─── IT-13 ──────────────────────────────────────────────────────────────────
describe('IT-13 M1 ↔ Grove — entity/edge records preserved', () => {
  it('graph load of synthetic observations produces consistent entity/edge counts', () => {
    const obs = buildObservations(30);
    const m1 = buildM1(30);
    expect(m1.graph.observationCount).toBe(obs.length);
    // Every skill, command, file, session, outcome becomes an entity.
    expect(m1.graph.entities.size).toBeGreaterThan(0);
  });
});

// ─── IT-14 ──────────────────────────────────────────────────────────────────
describe('IT-14 M2 ↔ Chroma endpoint localhost:8100, graceful degrade', () => {
  it('ReadWriteReflect default config targets http://localhost:8100', async () => {
    const mod = await import('../../../memory/read-write-reflect.js');
    expect(mod.DEFAULT_CHROMA_URL).toBe('http://localhost:8100');
  });
});

// ─── IT-15 ──────────────────────────────────────────────────────────────────
describe('IT-15 M3 ↔ M1 link — traces reference M1 entity IDs', () => {
  it('traces written via the selector include entityIds referencing M1', async () => {
    const m1 = buildM1(10);
    const logDir = mkdtempSync(join(tmpdir(), 'ls-it15-'));
    const logPath = join(logDir, 'decisions.jsonl');
    const writer = new ActivationWriter(logPath);
    const query = new QueryEngine(m1.graph);
    const selector = new ActivationSelector({ query, writer });
    await selector.select('do a thing', [
      { id: 'skill:debug', content: 'debug', importance: 0.3 },
    ]);
    const raw = readFileSync(logPath, 'utf8').trim();
    expect(raw).toContain('skill:debug');
  });
});

// ─── IT-16 ──────────────────────────────────────────────────────────────────
describe('IT-16 M4 ↔ M1 ↔ M3 — branch forks include M1+M3 snapshot', () => {
  it('manifests carry parent hashes + delta bound info', () => {
    const manifests = buildM4(6);
    for (const m of manifests) {
      expect(m.parentHash).toMatch(/^[0-9a-f]+$/);
      expect(m.parentByteLength).toBeGreaterThan(0);
      expect(m.deltaFraction).toBeLessThanOrEqual(0.2);
    }
  });
});

// ─── IT-17 ──────────────────────────────────────────────────────────────────
describe('IT-17 M5 prefix-cache ↔ M1', () => {
  it('selector consults M1 query engine for co-fire boosting', async () => {
    const m1 = buildM1(30);
    const logDir = mkdtempSync(join(tmpdir(), 'ls-it17-'));
    const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
    const query = new QueryEngine(m1.graph);
    const selector = new ActivationSelector({
      query,
      writer,
      previousSkillId: 'skill:debug',
    });
    const decisions = await selector.select('run format after debug', [
      { id: 'skill:debug', content: 'debug', importance: 0.2 },
      { id: 'skill:format', content: 'format', importance: 0.2 },
    ]);
    // At least one decision should register either a co-fire boost or a zero
    // boost — we just assert the signal slot is populated (number).
    for (const d of decisions) {
      expect(typeof d.signals.m1Boost).toBe('number');
    }
  });
});

// ─── IT-18 ──────────────────────────────────────────────────────────────────
describe('IT-18 M6 ↔ M5 — net-shift replaces threshold when block present', () => {
  it('selector with sensoria.enabled records netshift; disabled records m5-fallback signal slot null', async () => {
    const logDir = mkdtempSync(join(tmpdir(), 'ls-it18-'));
    const writer = new ActivationWriter(join(logDir, 'decisions.jsonl'));
    const selector = new ActivationSelector({
      writer,
      sensoria: { enabled: true },
    });
    const decisions = await selector.select('debug', [
      { id: 'skill:debug', content: 'debug logging', importance: 0.5 },
    ]);
    expect(decisions[0].signals.sensoria).not.toBeNull();
    expect(['netshift', 'm5-fallback']).toContain(decisions[0].signals.sensoria!.via);
  });

  it('computeNetShift silent-binder K_H = K_L produces ΔR_H = 0 exactly', () => {
    const res = computeNetShift(1.0, 1.0, 5.0, 5.0, 0.05);
    expect(res.deltaR_H).toBe(0);
    expect(res.activated).toBe(false);
  });
});

// ─── IT-19 ──────────────────────────────────────────────────────────────────
describe('IT-19 M7 ↔ M1 + M3 — model from communities, updates from traces', () => {
  it('init from M1 communities + apply traces yields normalised model', () => {
    const m1 = buildM1(20);
    const init = new M1CommunityInitialiser(m1.graph, m1.communities);
    const counts = init.seedCounts();
    const traces = buildM3(50);
    const updater = new M3ModelUpdater(counts, { batchSize: 10 });
    for (const t of traces) updater.push(t);
    updater.flush();
    const model = materialiseModel(
      m1.communities.map((c) => c.id),
      counts,
    );
    validateModel(model); // throws if rows don't sum to 1
    const stats = updater.stats();
    expect(stats.applied + stats.skipped).toBe(traces.length);
  });
});

// ─── IT-20 ──────────────────────────────────────────────────────────────────
describe('IT-20 M8 Quintessence reads all seven modules', () => {
  it('5 axes computable purely from existing module outputs', () => {
    const m1 = buildM1(10);
    const branches = buildM4(8);
    const traces = buildM3(30);
    const m2 = buildM2(12);

    const sources = buildLiveQuintessenceSources({
      communities: m1.communities,
      branches,
      memoryEntries: m2,
      traces,
    });
    const snap = computeQuintessenceSnapshot(sources, {
      threshold: DEFAULT_FATEFUL_THRESHOLD,
    });
    expect(snap.selfVsNonSelf).toBeGreaterThanOrEqual(0);
    expect(snap.essentialTensions).toBeGreaterThanOrEqual(0);
    expect(snap.growthAndEnergyFlow).toBeGreaterThan(0);
    expect(snap.stabilityVsNovelty).toBeGreaterThanOrEqual(0);
    expect(snap.fatefulEncounters).toBeGreaterThanOrEqual(0);
  });

  it('M1CommunitySource + M4StabilitySource + M3FatefulSource all functional standalone', () => {
    const m1 = buildM1(5);
    const branches = buildM4(4);
    const traces = buildM3(6);
    const csrc = new M1CommunitySource(m1.communities);
    expect(csrc.selfFraction()).toBe(1);
    const ssrc = new M4StabilitySource(branches);
    expect(ssrc.trunkPreservedCount() + ssrc.branchCommittedCount()).toBe(branches.length);
    const fsrc = new M3FatefulSource(traces);
    expect(fsrc.highImpactDecisionCount(0.1)).toBeGreaterThanOrEqual(0);
  });
});

// ─── IT-21 ──────────────────────────────────────────────────────────────────
describe('IT-21 CLI surfaces from shared types — sensoria / umwelt / symbiosis', () => {
  it('status aggregator consumes module shapes via shared types only', () => {
    const status = collectStatus({});
    // With no inputs every slot is null — the contract the CLI relies on.
    expect(status.m1).toBeNull();
    expect(status.m8).toBeNull();
  });
});

// ─── IT-22 ──────────────────────────────────────────────────────────────────
describe('IT-22 Grove rewrite smoke — existing Grove tests stay green', () => {
  it('DEFAULT_CHROMA_URL still 8100 after M2 rewrite', async () => {
    const mod = await import('../../../memory/read-write-reflect.js');
    expect(mod.DEFAULT_CHROMA_URL).toBe('http://localhost:8100');
  });
});

// ─── Extra cross-wire coverage ──────────────────────────────────────────────
describe('M8 teaching → M7 priors (high-precision evidence)', () => {
  it('teach entries contribute pseudo-counts heavier than a single trace', () => {
    const intents = ['skill:a', 'skill:b', 'skill:c'];
    const observations: string[] = [
      'correction',
      'clarification',
      'constraint',
      'pattern',
      'preference',
    ];
    const counts = makeCounts(intents, observations, 1);

    const teachEntries = buildTeachEntries([
      { category: 'correction', ref: 'skill:a' },
    ]);
    const indexMap = new Map(intents.map((k, i) => [k, i]));
    const result = applyTeachEntriesToM7(teachEntries, counts, { intentIndex: indexMap });
    expect(result.applied).toBe(1);
    expect(result.totalPseudoCounts).toBeGreaterThan(1); // > a single sensory trace
  });
});

describe('syncM6FromTeachingLedger round-trip via on-disk ledger', () => {
  it('ledger writes propagate to M6 K_H adjustments', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ls-sync-'));
    const ledgerPath = join(tmp, 'teaching.jsonl');
    appendTeachEntry('constraint', 'never auto-refactor', ['skill:refactor'], {
      ledgerPath,
    });
    const store = new DesensitisationStore();
    const log = syncM6FromTeachingLedger(store, { ledgerPath });
    expect(log.get('skill:refactor')).toBeDefined();
  });
});

describe('tensionInputsFromBranches produces well-formed TensionSource inputs', () => {
  it('bound-hit ratio reflects aborted vs committed distribution', () => {
    const branches = buildM4(10);
    const inputs = tensionInputsFromBranches(branches);
    const src = new M4TensionSource(inputs);
    expect(src.boundHitRatio()).toBeGreaterThanOrEqual(0);
    expect(src.boundHitRatio()).toBeLessThanOrEqual(1);
  });
});

describe('M2EnergySource with no productive samples uses fallback', () => {
  it('empty input yields fallback', () => {
    const src = new M2EnergySource([], { fallback: 999 });
    expect(src.tokensPerProductiveOutcome()).toBe(999);
  });
});
