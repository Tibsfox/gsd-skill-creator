import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../../storage/pattern-store.js';
import type { PipelineStatusView } from '../../types/dashboard.js';
import { PipelineStatusCollector } from './pipeline-status.js';

describe('PipelineStatusCollector', () => {
  let tmpDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'pipeline-status-test-'));
    store = new PatternStore(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns all six pipeline stages with zero counts when store is empty', async () => {
    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    expect(result.stages).toHaveLength(6);

    const keys = result.stages.map(s => s.key);
    expect(keys).toEqual(['observations', 'patterns', 'candidates', 'scripts', 'promoted', 'demoted']);

    for (const stage of result.stages) {
      expect(stage.count).toBe(0);
    }

    expect(result.totalArtifacts).toBe(0);
    expect(new Date(result.collectedAt).getTime()).not.toBeNaN();
  });

  it('counts observations from executions category', async () => {
    // Store 3 execution batch entries
    for (let i = 0; i < 3; i++) {
      await store.append('executions', {
        sessionId: `sess-${i}`,
        pairs: [{ toolName: 'Read', input: { file_path: '/a.ts' }, output: 'content', outputHash: 'hash-a', status: 'complete', timestamp: '2026-02-13T00:00:00Z', context: { sessionId: `sess-${i}` } }],
        completeCount: 1,
        partialCount: 0,
        capturedAt: Date.now(),
      });
    }

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const observations = result.stages.find(s => s.key === 'observations');
    expect(observations?.count).toBe(3);
  });

  it('counts patterns from executions category using unique operation keys', async () => {
    // Batch 1: Read /src/a.ts
    await store.append('executions', {
      sessionId: 'sess-1',
      pairs: [
        { toolName: 'Read', input: { file_path: '/src/a.ts' }, output: 'content-a', outputHash: 'hash-a', status: 'complete', timestamp: '2026-02-13T00:00:00Z', context: { sessionId: 'sess-1' } },
      ],
      completeCount: 1,
      partialCount: 0,
      capturedAt: Date.now(),
    });

    // Batch 2: Read /src/a.ts (same) + Bash npm test (new)
    await store.append('executions', {
      sessionId: 'sess-2',
      pairs: [
        { toolName: 'Read', input: { file_path: '/src/a.ts' }, output: 'content-a', outputHash: 'hash-a', status: 'complete', timestamp: '2026-02-13T00:01:00Z', context: { sessionId: 'sess-2' } },
        { toolName: 'Bash', input: { command: 'npm test' }, output: 'ok', outputHash: 'hash-b', status: 'complete', timestamp: '2026-02-13T00:01:01Z', context: { sessionId: 'sess-2' } },
      ],
      completeCount: 2,
      partialCount: 0,
      capturedAt: Date.now(),
    });

    // Batch 3: Bash npm test (same)
    await store.append('executions', {
      sessionId: 'sess-3',
      pairs: [
        { toolName: 'Bash', input: { command: 'npm test' }, output: 'ok', outputHash: 'hash-b', status: 'complete', timestamp: '2026-02-13T00:02:00Z', context: { sessionId: 'sess-3' } },
      ],
      completeCount: 1,
      partialCount: 0,
      capturedAt: Date.now(),
    });

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const patterns = result.stages.find(s => s.key === 'patterns');
    expect(patterns?.count).toBe(2); // Two unique operation keys
  });

  it('counts candidates from decisions category (all evaluations)', async () => {
    // 2 approved decisions
    await store.append('decisions', { approved: true, candidateToolName: 'Read', candidateInputHash: 'abc', timestamp: '2026-02-13T00:00:00Z' });
    await store.append('decisions', { approved: true, candidateToolName: 'Bash', candidateInputHash: 'def', timestamp: '2026-02-13T00:01:00Z' });
    // 1 rejected decision
    await store.append('decisions', { approved: false, candidateToolName: 'Write', candidateInputHash: 'ghi', timestamp: '2026-02-13T00:02:00Z' });

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const candidates = result.stages.find(s => s.key === 'candidates');
    expect(candidates?.count).toBe(3); // All evaluated = candidates
  });

  it('counts promoted from decisions category with approved=true', async () => {
    // 3 decisions: 2 approved, 1 rejected
    await store.append('decisions', { approved: true, candidateToolName: 'Read', candidateInputHash: 'abc', timestamp: '2026-02-13T00:00:00Z' });
    await store.append('decisions', { approved: true, candidateToolName: 'Bash', candidateInputHash: 'def', timestamp: '2026-02-13T00:01:00Z' });
    await store.append('decisions', { approved: false, candidateToolName: 'Write', candidateInputHash: 'ghi', timestamp: '2026-02-13T00:02:00Z' });

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const candidates = result.stages.find(s => s.key === 'candidates');
    expect(candidates?.count).toBe(3);

    const promoted = result.stages.find(s => s.key === 'promoted');
    expect(promoted?.count).toBe(2);
  });

  it('counts demoted from feedback category by tracking demotion events', async () => {
    // Read:abc reaches demotion threshold (consecutiveMismatches >= 3)
    await store.append('feedback', { operationId: 'Read:abc', matched: false, consecutiveMismatches: 1, actualHash: 'h1', expectedHash: 'h2', timestamp: '2026-02-13T00:00:00Z' });
    await store.append('feedback', { operationId: 'Read:abc', matched: false, consecutiveMismatches: 2, actualHash: 'h3', expectedHash: 'h2', timestamp: '2026-02-13T00:01:00Z' });
    await store.append('feedback', { operationId: 'Read:abc', matched: false, consecutiveMismatches: 3, actualHash: 'h4', expectedHash: 'h2', timestamp: '2026-02-13T00:02:00Z' });

    // Bash:xyz has all matching events (no demotion)
    await store.append('feedback', { operationId: 'Bash:xyz', matched: true, consecutiveMismatches: 0, actualHash: 'h5', expectedHash: 'h5', timestamp: '2026-02-13T00:00:00Z' });
    await store.append('feedback', { operationId: 'Bash:xyz', matched: true, consecutiveMismatches: 0, actualHash: 'h5', expectedHash: 'h5', timestamp: '2026-02-13T00:01:00Z' });

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const demoted = result.stages.find(s => s.key === 'demoted');
    expect(demoted?.count).toBe(1); // Only Read:abc reached threshold
  });

  it('totalArtifacts sums all stage counts', async () => {
    // Store some entries to get non-zero counts
    await store.append('executions', {
      sessionId: 'sess-1',
      pairs: [{ toolName: 'Read', input: { file_path: '/a.ts' }, output: 'content', outputHash: 'hash-a', status: 'complete', timestamp: '2026-02-13T00:00:00Z', context: { sessionId: 'sess-1' } }],
      completeCount: 1,
      partialCount: 0,
      capturedAt: Date.now(),
    });
    await store.append('decisions', { approved: true, candidateToolName: 'Read', candidateInputHash: 'abc', timestamp: '2026-02-13T00:00:00Z' });

    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const sum = result.stages.reduce((acc, s) => acc + s.count, 0);
    expect(result.totalArtifacts).toBe(sum);
  });

  it('collectedAt contains valid ISO timestamp', async () => {
    const collector = new PipelineStatusCollector(store);
    const result = await collector.collect();

    const date = new Date(result.collectedAt);
    expect(date.getTime()).not.toBeNaN();
    expect(result.collectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
