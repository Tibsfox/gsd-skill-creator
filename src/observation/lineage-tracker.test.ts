import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import { PatternStore } from '../storage/pattern-store.js';
import type { LineageEntry } from '../types/observation.js';
import { LineageTracker } from './lineage-tracker.js';

function makeEntry(overrides: Partial<LineageEntry> = {}): LineageEntry {
  return {
    artifactId: overrides.artifactId ?? 'obs:sess1:Read:abc123',
    artifactType: overrides.artifactType ?? 'observation',
    stage: overrides.stage ?? 'capture',
    inputs: overrides.inputs ?? [],
    outputs: overrides.outputs ?? ['pat:Read:abc123'],
    metadata: overrides.metadata ?? {},
    timestamp: overrides.timestamp ?? '2026-02-13T00:00:00Z',
  };
}

describe('LineageTracker', () => {
  let tmpDir: string;
  let store: PatternStore;
  let tracker: LineageTracker;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(os.tmpdir(), 'lineage-tracker-test-'));
    store = new PatternStore(tmpDir);
    tracker = new LineageTracker(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('record() stores a lineage entry to PatternStore lineage category', async () => {
    const entry = makeEntry({
      artifactId: 'obs:sess1:Read:abc123',
      artifactType: 'observation',
      stage: 'capture',
    });

    await tracker.record(entry);

    const stored = await store.read('lineage');
    expect(stored.length).toBe(1);
    expect(stored[0].data.artifactId).toBe('obs:sess1:Read:abc123');
    expect(stored[0].data.artifactType).toBe('observation');
    expect(stored[0].data.stage).toBe('capture');
  });

  it('record() stores multiple entries for different stages', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:sess1:Read:abc123',
      stage: 'capture',
      outputs: ['pat:Read:abc123'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:abc123',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:sess1:Read:abc123'],
      outputs: ['cand:Read:abc123'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'cand:Read:abc123',
      artifactType: 'candidate',
      stage: 'detection',
      inputs: ['pat:Read:abc123'],
      outputs: ['script:Read:abc123'],
    }));

    const stored = await store.read('lineage');
    expect(stored.length).toBe(3);
  });

  it('getUpstream() returns entries whose outputs contain the given artifactId', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:sess1:Read:abc123',
      artifactType: 'observation',
      stage: 'capture',
      outputs: ['pat:Read:abc123'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:abc123',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:sess1:Read:abc123'],
      outputs: ['cand:Read:abc123'],
    }));

    const result = await tracker.getUpstream('pat:Read:abc123');
    expect(result.length).toBe(1);
    expect(result[0].artifactId).toBe('obs:sess1:Read:abc123');
  });

  it('getDownstream() returns entries whose inputs contain the given artifactId', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:sess1:Read:abc123',
      artifactType: 'observation',
      stage: 'capture',
      outputs: ['pat:Read:abc123'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:abc123',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:sess1:Read:abc123'],
      outputs: ['cand:Read:abc123'],
    }));

    const result = await tracker.getDownstream('obs:sess1:Read:abc123');
    expect(result.length).toBe(1);
    expect(result[0].artifactId).toBe('pat:Read:abc123');
  });

  it('getUpstream() traces recursively through multiple stages', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:s1:Read:h1',
      artifactType: 'observation',
      stage: 'capture',
      inputs: [],
      outputs: ['pat:Read:h1'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:h1',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:s1:Read:h1'],
      outputs: ['cand:Read:h1'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'cand:Read:h1',
      artifactType: 'candidate',
      stage: 'detection',
      inputs: ['pat:Read:h1'],
      outputs: ['script:Read:h1'],
    }));

    const result = await tracker.getUpstream('cand:Read:h1');
    expect(result.length).toBe(2);
    expect(result.map(e => e.artifactId)).toContain('pat:Read:h1');
    expect(result.map(e => e.artifactId)).toContain('obs:s1:Read:h1');
  });

  it('getDownstream() traces recursively through multiple stages', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:s1:Read:h1',
      artifactType: 'observation',
      stage: 'capture',
      inputs: [],
      outputs: ['pat:Read:h1'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:h1',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:s1:Read:h1'],
      outputs: ['cand:Read:h1'],
    }));
    await tracker.record(makeEntry({
      artifactId: 'cand:Read:h1',
      artifactType: 'candidate',
      stage: 'detection',
      inputs: ['pat:Read:h1'],
      outputs: ['script:Read:h1'],
    }));

    const result = await tracker.getDownstream('obs:s1:Read:h1');
    expect(result.length).toBe(2);
    expect(result.map(e => e.artifactId)).toContain('pat:Read:h1');
    expect(result.map(e => e.artifactId)).toContain('cand:Read:h1');
  });

  it('getChain() returns the full lineage for an artifact', async () => {
    await tracker.record(makeEntry({ artifactId: 'obs:s1:Read:h1', artifactType: 'observation', stage: 'capture', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'pat:Read:h1', artifactType: 'pattern', stage: 'analysis', inputs: ['obs:s1:Read:h1'], outputs: ['cand:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'cand:Read:h1', artifactType: 'candidate', stage: 'detection', inputs: ['pat:Read:h1'], outputs: ['script:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'script:Read:h1', artifactType: 'script', stage: 'generation', inputs: ['cand:Read:h1'], outputs: ['gate:Read:h1:t1'] }));
    await tracker.record(makeEntry({ artifactId: 'gate:Read:h1:t1', artifactType: 'decision', stage: 'gatekeeping', inputs: ['script:Read:h1'], outputs: ['exec:Read:h1:t1'] }));

    const result = await tracker.getChain('cand:Read:h1');
    expect(result.artifact.artifactId).toBe('cand:Read:h1');
    expect(result.upstream.length).toBe(2);
    expect(result.downstream.length).toBe(2);
  });

  it('getChain() at the root (observation) has empty upstream', async () => {
    await tracker.record(makeEntry({ artifactId: 'obs:s1:Read:h1', artifactType: 'observation', stage: 'capture', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'pat:Read:h1', artifactType: 'pattern', stage: 'analysis', inputs: ['obs:s1:Read:h1'], outputs: ['cand:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'cand:Read:h1', artifactType: 'candidate', stage: 'detection', inputs: ['pat:Read:h1'], outputs: ['script:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'script:Read:h1', artifactType: 'script', stage: 'generation', inputs: ['cand:Read:h1'], outputs: ['gate:Read:h1:t1'] }));
    await tracker.record(makeEntry({ artifactId: 'gate:Read:h1:t1', artifactType: 'decision', stage: 'gatekeeping', inputs: ['script:Read:h1'], outputs: ['exec:Read:h1:t1'] }));

    const result = await tracker.getChain('obs:s1:Read:h1');
    expect(result.upstream.length).toBe(0);
    expect(result.downstream.length).toBe(4);
  });

  it('getChain() at the leaf (decision) has empty downstream', async () => {
    await tracker.record(makeEntry({ artifactId: 'obs:s1:Read:h1', artifactType: 'observation', stage: 'capture', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'pat:Read:h1', artifactType: 'pattern', stage: 'analysis', inputs: ['obs:s1:Read:h1'], outputs: ['cand:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'cand:Read:h1', artifactType: 'candidate', stage: 'detection', inputs: ['pat:Read:h1'], outputs: ['script:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'script:Read:h1', artifactType: 'script', stage: 'generation', inputs: ['cand:Read:h1'], outputs: ['gate:Read:h1:t1'] }));
    await tracker.record(makeEntry({ artifactId: 'gate:Read:h1:t1', artifactType: 'decision', stage: 'gatekeeping', inputs: ['script:Read:h1'], outputs: [] }));

    const result = await tracker.getChain('gate:Read:h1:t1');
    expect(result.upstream.length).toBe(4);
    expect(result.downstream.length).toBe(0);
  });

  it('record() preserves metadata from pipeline stages', async () => {
    await tracker.record({
      artifactId: 'gate:Read:h1:t1',
      artifactType: 'decision',
      stage: 'gatekeeping',
      inputs: ['script:Read:h1'],
      outputs: [],
      metadata: {
        approved: true,
        determinism: 0.98,
        confidence: 0.87,
        reasoning: ['Determinism 0.980 >= 0.95: passed'],
      },
      timestamp: '2026-02-13T00:00:00Z',
    });

    const stored = await store.read('lineage');
    expect(stored.length).toBe(1);
    const meta = stored[0].data.metadata as Record<string, unknown>;
    expect(meta.approved).toBe(true);
    expect(meta.determinism).toBe(0.98);
    expect(Array.isArray(meta.reasoning)).toBe(true);
    expect((meta.reasoning as string[]).length).toBe(1);
  });

  it('getUpstream() returns empty array for artifact with no upstream', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:s1:Read:h1',
      artifactType: 'observation',
      stage: 'capture',
      inputs: [],
      outputs: ['pat:Read:h1'],
    }));

    const result = await tracker.getUpstream('obs:s1:Read:h1');
    expect(result.length).toBe(0);
  });

  it('getDownstream() returns empty array for artifact with no downstream', async () => {
    await tracker.record(makeEntry({
      artifactId: 'obs:s1:Read:h1',
      artifactType: 'observation',
      stage: 'capture',
      inputs: [],
      outputs: [],
    }));

    const result = await tracker.getDownstream('obs:s1:Read:h1');
    expect(result.length).toBe(0);
  });

  it('handles multiple observations feeding into one pattern', async () => {
    await tracker.record(makeEntry({ artifactId: 'obs:s1:Read:h1', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'obs:s2:Read:h1', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({ artifactId: 'obs:s3:Read:h1', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker.record(makeEntry({
      artifactId: 'pat:Read:h1',
      artifactType: 'pattern',
      stage: 'analysis',
      inputs: ['obs:s1:Read:h1', 'obs:s2:Read:h1', 'obs:s3:Read:h1'],
      outputs: [],
    }));

    const result = await tracker.getUpstream('pat:Read:h1');
    expect(result.length).toBe(3);
  });

  it('persists lineage across tracker instances (reads from store)', async () => {
    const tracker1 = new LineageTracker(store);
    await tracker1.record(makeEntry({ artifactId: 'obs:s1:Read:h1', inputs: [], outputs: ['pat:Read:h1'] }));
    await tracker1.record(makeEntry({ artifactId: 'pat:Read:h1', artifactType: 'pattern', stage: 'analysis', inputs: ['obs:s1:Read:h1'], outputs: ['cand:Read:h1'] }));
    await tracker1.record(makeEntry({ artifactId: 'cand:Read:h1', artifactType: 'candidate', stage: 'detection', inputs: ['pat:Read:h1'], outputs: [] }));

    const tracker2 = new LineageTracker(store);
    const result = await tracker2.getChain('pat:Read:h1');
    expect(result.upstream.length).toBe(1);
    expect(result.downstream.length).toBe(1);
  });
});
