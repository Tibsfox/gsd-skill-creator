import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { PatternAnalyzer } from './pattern-analyzer.js';
import type { SequenceRecord, ClusterId } from './sequence-recorder.js';

function makeRecord(overrides: Partial<SequenceRecord> = {}): SequenceRecord {
  return {
    sequenceId: overrides.sequenceId ?? 'arc-test',
    step: overrides.step ?? 1,
    operationType: overrides.operationType ?? 'BUILD',
    agent: overrides.agent ?? 'test-agent',
    clusterSource: overrides.clusterSource ?? 'bridge-zone',
    clusterTarget: overrides.clusterTarget ?? 'bridge-zone',
    transitionDistance: overrides.transitionDistance ?? 0,
    failureRisks: overrides.failureRisks ?? [],
    riskConfidence: overrides.riskConfidence ?? 0,
    timestamp: overrides.timestamp ?? Date.now(),
    feedbackRef: overrides.feedbackRef ?? 'ref',
  };
}

describe('PatternAnalyzer', () => {
  let tmpDir: string;
  let store: PatternStore;
  let analyzer: PatternAnalyzer;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'pattern-analyzer-test-'));
    store = new PatternStore(tmpDir);
    analyzer = new PatternAnalyzer(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('detects length-2 subsequence patterns', async () => {
    // Two arcs both doing SCOUT -> PROPOSE
    for (const agent of ['sam', 'cedar']) {
      await store.append('workflows', makeRecord({
        sequenceId: `arc-${agent}`, step: 1, operationType: 'SCOUT', agent,
      }) as unknown as Record<string, unknown>);
      await store.append('workflows', makeRecord({
        sequenceId: `arc-${agent}`, step: 2, operationType: 'PROPOSE', agent,
      }) as unknown as Record<string, unknown>);
    }

    const patterns = await analyzer.detectPatterns(2);
    expect(patterns.length).toBeGreaterThanOrEqual(1);

    const scoutPropose = patterns.find(
      p => p.operations[0] === 'SCOUT' && p.operations[1] === 'PROPOSE'
    );
    expect(scoutPropose).toBeDefined();
    expect(scoutPropose!.count).toBe(2);
    expect(scoutPropose!.confidence).toBeGreaterThan(0);
    expect(scoutPropose!.agents).toContain('sam');
    expect(scoutPropose!.agents).toContain('cedar');
  });

  it('detects length-3 subsequence patterns', async () => {
    // Two arcs both doing PROPOSE -> VALIDATE -> CERTIFY
    for (const agent of ['lex', 'hemlock']) {
      await store.append('workflows', makeRecord({
        sequenceId: `arc-${agent}`, step: 1, operationType: 'PROPOSE', agent,
      }) as unknown as Record<string, unknown>);
      await store.append('workflows', makeRecord({
        sequenceId: `arc-${agent}`, step: 2, operationType: 'VALIDATE', agent,
      }) as unknown as Record<string, unknown>);
      await store.append('workflows', makeRecord({
        sequenceId: `arc-${agent}`, step: 3, operationType: 'CERTIFY', agent,
      }) as unknown as Record<string, unknown>);
    }

    const patterns = await analyzer.detectPatterns(2);
    const vModel = patterns.find(
      p => p.operations.length === 3
        && p.operations[0] === 'PROPOSE'
        && p.operations[1] === 'VALIDATE'
        && p.operations[2] === 'CERTIFY'
    );
    expect(vModel).toBeDefined();
    expect(vModel!.count).toBe(2);
  });

  it('recommends cluster reassignment for defaulted agents', async () => {
    // Agent defaults to bridge-zone but mostly does VALIDATE/CERTIFY (rigor-spine work)
    const ops: SequenceRecord['operationType'][] = [
      'VALIDATE', 'CERTIFY', 'VALIDATE', 'PROPOSE', 'VALIDATE',
    ];
    for (let i = 0; i < ops.length; i++) {
      await store.append('workflows', makeRecord({
        sequenceId: 'arc-newbie', step: i + 1, operationType: ops[i],
        agent: 'newbie', clusterSource: 'bridge-zone',
      }) as unknown as Record<string, unknown>);
    }

    const reassignments = await analyzer.recommendReassignments(3);
    expect(reassignments.length).toBe(1);
    expect(reassignments[0].agent).toBe('newbie');
    expect(reassignments[0].recommendedCluster).toBe('rigor-spine');
    expect(reassignments[0].confidence).toBeGreaterThan(0.5);
  });

  it('does not reassign agents with too few tasks', async () => {
    await store.append('workflows', makeRecord({
      sequenceId: 'arc-brief', step: 1, operationType: 'VALIDATE',
      agent: 'brief', clusterSource: 'bridge-zone',
    }) as unknown as Record<string, unknown>);

    const reassignments = await analyzer.recommendReassignments(3);
    expect(reassignments.length).toBe(0);
  });

  it('computes hub capacity with zero handoffs for intra-cluster traffic', async () => {
    // All intra-cluster (source === target)
    await store.append('workflows', makeRecord({
      clusterSource: 'rigor-spine', clusterTarget: 'rigor-spine',
    }) as unknown as Record<string, unknown>);
    await store.append('workflows', makeRecord({
      clusterSource: 'rigor-spine', clusterTarget: 'rigor-spine',
    }) as unknown as Record<string, unknown>);

    const report = await analyzer.hubCapacity();
    expect(report.totalHandoffs).toBe(0);
    expect(report.clusterHealth['rigor-spine']).toBe('healthy');
  });

  it('identifies bottleneck cluster pairs', async () => {
    // Heavy cross-cluster traffic through bridge-zone
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      await store.append('workflows', makeRecord({
        clusterSource: 'creative-nexus' as ClusterId,
        clusterTarget: 'bridge-zone' as ClusterId,
        transitionDistance: 0.410,
        timestamp: now + i * 1000,
      }) as unknown as Record<string, unknown>);
    }
    // Small amount of other traffic
    await store.append('workflows', makeRecord({
      clusterSource: 'bridge-zone' as ClusterId,
      clusterTarget: 'rigor-spine' as ClusterId,
      transitionDistance: 0.570,
      timestamp: now + 11000,
    }) as unknown as Record<string, unknown>);

    const report = await analyzer.hubCapacity();
    expect(report.totalHandoffs).toBe(11);
    expect(report.bottleneckPairs).toContain('creative-nexus->bridge-zone');
  });

  it('returns empty results for empty store', async () => {
    const patterns = await analyzer.detectPatterns();
    const reassignments = await analyzer.recommendReassignments();
    const capacity = await analyzer.hubCapacity();

    expect(patterns).toEqual([]);
    expect(reassignments).toEqual([]);
    expect(capacity.totalHandoffs).toBe(0);
  });
});
