import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../storage/pattern-store.js';
import { LineageTracker } from '../../observation/lineage-tracker.js';
import type { LineageViewData, LineageGraphEntry } from '../../types/dashboard.js';
import { LineageViewCollector } from './lineage-view.js';

/**
 * Record a full promotion chain through the pipeline:
 * observation -> pattern -> candidate -> script -> decision
 */
async function recordPromotionChain(
  tracker: LineageTracker,
  operationId: string,
  toolName: string,
): Promise<void> {
  const obsId = `obs-${operationId}`;
  const patternId = `pattern-${operationId}`;
  const candidateId = `candidate-${operationId}`;
  const scriptId = `script-${operationId}`;
  const decisionId = `decision-${operationId}`;

  await tracker.record({
    artifactId: obsId,
    artifactType: 'observation',
    stage: 'capture',
    inputs: [],
    outputs: [patternId],
    metadata: { toolName, sessionCount: 3 },
    timestamp: '2026-02-13T01:00:00Z',
  });

  await tracker.record({
    artifactId: patternId,
    artifactType: 'pattern',
    stage: 'analysis',
    inputs: [obsId],
    outputs: [candidateId],
    metadata: { toolName, varianceScore: 0 },
    timestamp: '2026-02-13T01:01:00Z',
  });

  await tracker.record({
    artifactId: candidateId,
    artifactType: 'candidate',
    stage: 'detection',
    inputs: [patternId],
    outputs: [scriptId],
    metadata: { toolName, compositeScore: 0.85 },
    timestamp: '2026-02-13T01:02:00Z',
  });

  await tracker.record({
    artifactId: scriptId,
    artifactType: 'script',
    stage: 'generation',
    inputs: [candidateId],
    outputs: [decisionId],
    metadata: { toolName, scriptType: 'bash' },
    timestamp: '2026-02-13T01:03:00Z',
  });

  await tracker.record({
    artifactId: decisionId,
    artifactType: 'decision',
    stage: 'gatekeeping',
    inputs: [scriptId],
    outputs: [],
    metadata: { toolName, approved: true },
    timestamp: '2026-02-13T01:04:00Z',
  });
}

/**
 * Store an approved decision in PatternStore so the collector knows
 * which operations are promoted.
 */
async function storeApprovedDecision(
  store: PatternStore,
  operationId: string,
  toolName: string,
): Promise<void> {
  await store.append('decisions', {
    approved: true,
    candidateToolName: toolName,
    candidateInputHash: operationId,
    timestamp: '2026-02-13T01:04:00Z',
  });
}

describe('LineageViewCollector', () => {
  let tmpDir: string;
  let store: PatternStore;
  let tracker: LineageTracker;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'lineage-view-test-'));
    store = new PatternStore(tmpDir);
    tracker = new LineageTracker(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty graphs when no promoted artifacts exist', async () => {
    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    expect(result.graphs).toHaveLength(0);
    expect(result.totalPromoted).toBe(0);
    expect(new Date(result.collectedAt).getTime()).not.toBeNaN();
  });

  it('returns lineage graph for a single promoted artifact', async () => {
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    expect(result.graphs).toHaveLength(1);
    expect(result.graphs[0].promotedArtifactId).toContain('decision-Read:abc123');
    expect(result.graphs[0].toolName).toBe('Read');
    expect(result.graphs[0].chain.length).toBeGreaterThanOrEqual(3);
    expect(result.graphs[0].depth).toBe(result.graphs[0].chain.length);
  });

  it('lineage chain is ordered chronologically (earliest first)', async () => {
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    const chain = result.graphs[0].chain;

    // Verify chronological order
    for (let i = 0; i < chain.length - 1; i++) {
      expect(new Date(chain[i].timestamp).getTime()).toBeLessThanOrEqual(
        new Date(chain[i + 1].timestamp).getTime(),
      );
    }

    // First node should be observation, last should be decision
    expect(chain[0].artifactType).toBe('observation');
    expect(chain[chain.length - 1].artifactType).toBe('decision');
  });

  it('each lineage node contains artifactId, artifactType, stage, timestamp, and metadata', async () => {
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    for (const node of result.graphs[0].chain) {
      expect(typeof node.artifactId).toBe('string');
      expect(node.artifactId.length).toBeGreaterThan(0);
      expect(['observation', 'pattern', 'candidate', 'script', 'decision']).toContain(node.artifactType);
      expect(typeof node.stage).toBe('string');
      expect(node.stage.length).toBeGreaterThan(0);
      expect(new Date(node.timestamp).getTime()).not.toBeNaN();
      expect(typeof node.metadata).toBe('object');
    }
  });

  it('returns multiple graphs for multiple promoted artifacts', async () => {
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    await recordPromotionChain(tracker, 'Bash:xyz789', 'Bash');
    await storeApprovedDecision(store, 'Bash:xyz789', 'Bash');

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    expect(result.graphs).toHaveLength(2);
    expect(result.totalPromoted).toBe(2);

    const toolNames = result.graphs.map(g => g.toolName).sort();
    expect(toolNames).toEqual(['Bash', 'Read']);
  });

  it('only includes promoted artifacts (skips rejected decisions)', async () => {
    // Approved
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    // Rejected decision (no lineage chain needed, just store the rejection)
    await store.append('decisions', {
      approved: false,
      candidateToolName: 'Bash',
      candidateInputHash: 'rejected',
      timestamp: '2026-02-13T02:00:00Z',
    });

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    expect(result.graphs).toHaveLength(1);
    expect(result.graphs[0].toolName).toBe('Read');
  });

  it('getArtifactChain() returns chain for a specific artifact ID', async () => {
    await recordPromotionChain(tracker, 'Read:abc123', 'Read');
    await storeApprovedDecision(store, 'Read:abc123', 'Read');

    await recordPromotionChain(tracker, 'Bash:xyz789', 'Bash');
    await storeApprovedDecision(store, 'Bash:xyz789', 'Bash');

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.getArtifactChain('decision-Read:abc123');

    expect(result).not.toBeNull();
    expect(result!.chain.length).toBeGreaterThanOrEqual(3);
    expect(result!.toolName).toBe('Read');
  });

  it('handles promoted artifacts with no lineage data gracefully', async () => {
    // Store a decision without any lineage chain
    await store.append('decisions', {
      approved: true,
      candidateToolName: 'Read',
      candidateInputHash: 'nolineage',
      timestamp: '2026-02-13T03:00:00Z',
    });

    const collector = new LineageViewCollector(tracker, store);
    const result = await collector.collect();

    // Should not crash; either no graphs or graph with empty chain
    if (result.graphs.length > 0) {
      expect(result.graphs[0].chain).toHaveLength(0);
    } else {
      expect(result.graphs).toHaveLength(0);
    }
  });
});
