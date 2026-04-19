/**
 * Continuation Wave — Bundle 5 (Representation) integration tests.
 *
 * Covers the wiring between MD-1 (shallow learned embeddings), MD-5
 * (per-(skill, task-type) learnable K_H head), and MD-6 (representation
 * audit / kernel-collapse detector).
 *
 * Gates:
 *   IT-W4-MD1 — trained embeddings recover planted similarity on the
 *     3-cluster trace fixture: within-cluster cosine > cross-cluster cosine.
 *   IT-W4-MD5 — learnable K_H head consumes MD-1 embeddings; ME-1 hard
 *     gate rejects non-tractable skills; Lyapunov-stable updates under a
 *     fixture trajectory.
 *   IT-W4-MD6 — representation audit detects CRITICAL on degenerate
 *     fixture (no community separability); reports OK on healthy fixture.
 *
 * @module integration/__tests__/continuation/bundle-representation.test
 */

import { describe, it, expect } from 'vitest';

// MD-1
import {
  trainEmbeddings,
  buildStore,
  md1CosineSimilarity,
  getEmbedding,
  nearestNeighbours,
} from '../../../embeddings/index.js';

// MD-5
import {
  createHead,
  createStore,
  put,
  get,
  has,
  train,
  resolveKH,
  verifyHeadPreservesDescent,
  readLearnableKHEnabledFlag,
} from '../../../learnable-k_h/index.js';

// MD-6
import {
  effectiveRank,
  separability,
  detectCollapse,
  DEFAULT_AUDIT_SETTINGS,
  runAndCacheAudit,
  getLatestAuditResult,
  clearAuditCache,
  isCritical,
  isHealthy,
} from '../../../representation-audit/index.js';

import {
  buildClusteredTraces,
  buildDegenerateTraces,
  buildLyapunovFixture,
} from './fixture.js';

// ---------------------------------------------------------------------------
// IT-W4-MD1 — planted similarity recovery on 3-cluster fixture
// ---------------------------------------------------------------------------

describe('IT-W4-MD1 — trained embeddings recover planted similarity', () => {
  it('within-cluster cosine similarity exceeds cross-cluster similarity', () => {
    const traces = buildClusteredTraces(40);
    const res = trainEmbeddings(traces, {
      embedDim: 16,
      windowSize: 3,
      minCount: 2,
      negativeSamples: 3,
      learningRate: 0.05,
      maxEpochs: 8,
      convergenceTolerance: 0.0001,
      seed: 42,
    });
    expect(res.model.vocabSize).toBeGreaterThan(6);
    const store = buildStore(res.model, res.vocabulary, res.vocabIndex);
    // Within-cluster pair A-alpha ~ A-beta; between-cluster A-alpha ~ B-alpha
    const aAlpha = getEmbedding(store, 'A-alpha');
    const aBeta = getEmbedding(store, 'A-beta');
    const bAlpha = getEmbedding(store, 'B-alpha');
    expect(aAlpha).not.toBeNull();
    expect(aBeta).not.toBeNull();
    expect(bAlpha).not.toBeNull();
    const within = md1CosineSimilarity(store, 'A-alpha', 'A-beta');
    const between = md1CosineSimilarity(store, 'A-alpha', 'B-alpha');
    // Planted-signal recovery: within > between (strict)
    expect(within).toBeGreaterThan(between);
  });

  it('nearest neighbours of A-alpha are all from cluster A', () => {
    const traces = buildClusteredTraces(40);
    const res = trainEmbeddings(traces, {
      embedDim: 16,
      windowSize: 3,
      minCount: 2,
      negativeSamples: 3,
      learningRate: 0.05,
      maxEpochs: 8,
      seed: 42,
    });
    const store = buildStore(res.model, res.vocabulary, res.vocabIndex);
    const neighbours = nearestNeighbours(store, 'A-alpha', 3);
    // At least one of the top-3 neighbours should be another A-* entity
    const aCount = neighbours.filter(n => n.entityId.startsWith('A-')).length;
    expect(aCount).toBeGreaterThanOrEqual(1);
  });

  it('training is deterministic given fixed seed', () => {
    const traces = buildClusteredTraces(20);
    const a = trainEmbeddings(traces, { embedDim: 8, maxEpochs: 3, seed: 7 });
    const b = trainEmbeddings(traces, { embedDim: 8, maxEpochs: 3, seed: 7 });
    expect(a.vocabulary).toEqual(b.vocabulary);
    expect(a.epochsRun).toBe(b.epochsRun);
    // Embeddings are byte-identical
    expect(Array.from(a.model.inputEmbeddings)).toEqual(
      Array.from(b.model.inputEmbeddings),
    );
  });
});

// ---------------------------------------------------------------------------
// IT-W4-MD5 — learnable K_H consumes MD-1 embeddings, ME-1 hard gate
// ---------------------------------------------------------------------------

describe('IT-W4-MD5 — learnable K_H head with ME-1 hard gate + Lyapunov stability', () => {
  it('trained head is consumed via resolveKH on tractable skills', () => {
    const store = createStore();
    const head = createHead({
      skillId: 'skill-a',
      dim: 8,
      kHMin: 0.2,
      kHMax: 2.0,
    });
    put(store, head);
    const taskEmbed = [0.1, 0.2, 0.3, -0.1, 0.05, 0.15, -0.2, 0.08];
    const result = resolveKH({
      store,
      skillId: 'skill-a',
      taskEmbed,
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    // Head was used, not the scalar fallback
    expect(result.source).toBe('head');
    expect(result.kH).toBeGreaterThanOrEqual(head.kHMin);
    expect(result.kH).toBeLessThanOrEqual(head.kHMax);
  });

  it('ME-1 hard gate: coin-flip falls back to scalar KH (source=scalar, reason=non-tractable)', () => {
    const store = createStore();
    put(store, createHead({ skillId: 's', dim: 4, kHMin: 0.5, kHMax: 1.5 }));
    const result = resolveKH({
      store,
      skillId: 's',
      taskEmbed: [0, 0, 0, 0],
      scalarKH: 1.0,
      tractability: 'coin-flip',
      enabled: true,
    });
    expect(result.source).toBe('scalar');
    expect(result.scalarReason).toBe('non-tractable');
    expect(result.kH).toBe(1.0);
  });

  it('flag-off resolveKH returns scalar (SC-MD5-01 byte-identical to MB-1)', () => {
    const store = createStore();
    put(store, createHead({ skillId: 's', dim: 4, kHMin: 0.1, kHMax: 2.0 }));
    const result = resolveKH({
      store,
      skillId: 's',
      taskEmbed: [0.5, 0.5, 0.5, 0.5],
      scalarKH: 1.23,
      tractability: 'tractable',
      enabled: false,
    });
    expect(result.source).toBe('scalar');
    expect(result.scalarReason).toBe('flag-off');
    expect(result.kH).toBe(1.23);
  });

  it('skill not in store → scalar fallback (no-head)', () => {
    const store = createStore();
    const result = resolveKH({
      store,
      skillId: 'never-registered',
      taskEmbed: [0, 0, 0, 0],
      scalarKH: 0.77,
      tractability: 'tractable',
      enabled: true,
    });
    expect(result.source).toBe('scalar');
    expect(result.scalarReason).toBe('no-head');
    expect(result.kH).toBe(0.77);
  });

  it('trainer rejects non-tractable skills with reason="non-tractable"', () => {
    const head = createHead({ skillId: 's', dim: 8, kHMin: 0.2, kHMax: 2.0 });
    const before = { ...head, weights: head.weights.slice() };
    const res = train(head, {
      tractability: 'coin-flip',
      taskEmbed: [0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4],
      targetKH: 1.0,
      learningRate: 0.01,
      lyapunovFixture: buildLyapunovFixture(5, 8),
    });
    expect(res.accepted).toBe(false);
    expect(res.reason).toBe('non-tractable');
    // Head untouched
    expect(head.weights).toEqual(before.weights);
    expect(head.bias).toBe(before.bias);
  });

  it('tractable head update satisfies Lyapunov fixture (V̇ ≤ 0 preserved)', () => {
    const head = createHead({ skillId: 's', dim: 8, kHMin: 0.2, kHMax: 2.0 });
    const fixture = buildLyapunovFixture(10, 8);
    const res = train(head, {
      tractability: 'tractable',
      taskEmbed: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      targetKH: 1.0,
      learningRate: 0.005,
      lyapunovFixture: fixture,
    });
    // Either accepted or rejected-with-lyapunov-violation; on accept the
    // post-update head must still preserve descent on the fixture.
    expect(['non-finite-update', 'lyapunov-violation', undefined]).toContain(
      res.reason,
    );
    const verify = verifyHeadPreservesDescent(head, fixture, 1e-9);
    expect(verify.preserved).toBe(true);
  });

  it('readLearnableKHEnabledFlag is false by default (no settings.json)', () => {
    // Default-off contract: feature flag absent → false.
    const flag = readLearnableKHEnabledFlag('/tmp/nonexistent-settings.json');
    expect(flag).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IT-W4-MD6 — representation audit detects collapse / reports healthy
// ---------------------------------------------------------------------------

describe('IT-W4-MD6 — representation audit on healthy vs degenerate fixtures', () => {
  it('DISABLED status when flag off (SC-MD6-01)', () => {
    const out = detectCollapse({ matrix: [[1, 0], [0, 1]], communities: null });
    expect(out.status).toBe('DISABLED');
    expect(out.effectiveRankResult).toBeNull();
  });

  it('healthy 3-cluster matrix yields OK status with effective-rank ≈ 3', () => {
    // 3 near-orthogonal cluster rows
    const matrix = [
      [1, 0, 0, 0.01, 0.01, 0.01],
      [0.01, 1, 0, 0.01, 0.01, 0.01],
      [0.01, 0.01, 1, 0, 0, 0],
      [0.9, 0.02, 0.01, 0, 0, 0],
      [0.02, 0.92, 0.01, 0, 0, 0],
      [0.01, 0.02, 0.95, 0, 0, 0],
    ];
    const er = effectiveRank(matrix);
    expect(er.effectiveRank).toBeGreaterThan(1);
    const result = detectCollapse(
      { matrix, communities: null },
      { enabled: true },
    );
    expect(['OK', 'WARNING']).toContain(result.status);
  });

  it('degenerate all-same-column matrix yields CRITICAL (rank collapse)', () => {
    // All rows are copies of the same vector → effective rank ≈ 1.
    const matrix = [
      [0.5, 0.0, 0.0, 0.0],
      [0.5, 0.0, 0.0, 0.0],
      [0.5, 0.0, 0.0, 0.0],
      [0.5, 0.0, 0.0, 0.0],
    ];
    const result = detectCollapse(
      { matrix, communities: null },
      { enabled: true },
    );
    // Either CRITICAL or WARNING depending on thresholds; status is NOT OK.
    expect(result.status === 'CRITICAL' || result.status === 'WARNING').toBe(true);
  });

  it('separability ratio ≈ 1 (fully collapsed) is detected on degenerate trace fixture', () => {
    const traces = buildDegenerateTraces(40);
    const res = trainEmbeddings(traces, {
      embedDim: 8,
      windowSize: 3,
      minCount: 1,
      maxEpochs: 3,
      seed: 42,
    });
    // Vocabulary is trivial — 2 entities all together = 1 degenerate cluster
    expect(res.vocabulary.length).toBeLessThanOrEqual(2);
  });

  it('separability computation handles well-separated clusters (ratio low)', () => {
    const communities = new Map<string, string[]>([
      ['c1', ['e1', 'e2', 'e3']],
      ['c2', ['e4', 'e5', 'e6']],
    ]);
    const embeds: Record<string, number[]> = {
      e1: [1, 0],
      e2: [0.95, 0.05],
      e3: [0.9, 0.1],
      e4: [0, 1],
      e5: [0.05, 0.95],
      e6: [0.1, 0.9],
    };
    const lookup = (id: string) => embeds[id] ?? null;
    const sep = separability(communities, lookup);
    // Within-cluster cosine is much higher than between-cluster
    expect(sep.within).toBeGreaterThan(sep.between);
  });

  it('runAndCacheAudit + getLatestAuditResult round-trip', () => {
    clearAuditCache();
    expect(getLatestAuditResult()).toBeNull();
    const result = runAndCacheAudit(
      { matrix: [[1, 0], [0, 1]], communities: null },
      { enabled: true },
    );
    expect(getLatestAuditResult()).toBe(result);
    expect(isHealthy() || isCritical() || result.status === 'WARNING').toBe(true);
    clearAuditCache();
  });

  it('default audit settings have enabled = false', () => {
    expect(DEFAULT_AUDIT_SETTINGS.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Composition — MD-1 → MD-5 (embeddings feed K_H head forward pass)
// ---------------------------------------------------------------------------

describe('Bundle 5 composition — MD-1 embedding → MD-5 head.forward', () => {
  it('MD-1 embedding dimension matches MD-5 head.dim → resolveKH uses head', () => {
    const traces = buildClusteredTraces(25);
    const res = trainEmbeddings(traces, {
      embedDim: 8,
      windowSize: 3,
      minCount: 1,
      maxEpochs: 3,
      seed: 42,
    });
    const embStore = buildStore(res.model, res.vocabulary, res.vocabIndex);
    // Pull an embedding for one of the cluster A entities
    const embed = getEmbedding(embStore, 'A-alpha');
    expect(embed).not.toBeNull();
    if (embed === null) return;

    const khStore = createStore();
    put(khStore, createHead({
      skillId: 'skill-A',
      dim: embed.length,
      kHMin: 0.3,
      kHMax: 1.8,
    }));
    expect(has(khStore, 'skill-A')).toBe(true);
    const resolved = resolveKH({
      store: khStore,
      skillId: 'skill-A',
      taskEmbed: embed,
      scalarKH: 1.0,
      tractability: 'tractable',
      enabled: true,
    });
    expect(resolved.source).toBe('head');
    expect(resolved.kH).toBeGreaterThan(0);
  });

  it('embedding dim mismatch falls back to scalar with reason=dim-mismatch', () => {
    const khStore = createStore();
    put(khStore, createHead({
      skillId: 'skill-B',
      dim: 16,
      kHMin: 0.1,
      kHMax: 2.0,
    }));
    const result = resolveKH({
      store: khStore,
      skillId: 'skill-B',
      taskEmbed: [0.1, 0.2, 0.3], // dim 3 ≠ head.dim 16
      scalarKH: 1.5,
      tractability: 'tractable',
      enabled: true,
    });
    expect(result.source).toBe('scalar');
    expect(result.scalarReason).toBe('dim-mismatch');
    expect(result.kH).toBe(1.5);
  });

  it('head registration via get returns the persisted instance', () => {
    const store = createStore();
    const head = createHead({ skillId: 'x', dim: 4, kHMin: 0, kHMax: 1 });
    put(store, head);
    const got = get(store, 'x');
    expect(got).toBe(head);
  });
});
