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

  describe('full pipeline integration', () => {
    async function buildFullPipeline(t: LineageTracker): Promise<void> {
      // Stage 1: Capture -- 3 observations from 3 sessions
      await t.record({
        artifactId: 'obs:sess1:Read:h1',
        artifactType: 'observation',
        stage: 'capture',
        inputs: [],
        outputs: ['pat:Read:h1'],
        metadata: { sessionId: 'sess1', toolName: 'Read', inputHash: 'h1' },
        timestamp: '2026-02-13T00:01:00Z',
      });
      await t.record({
        artifactId: 'obs:sess2:Read:h1',
        artifactType: 'observation',
        stage: 'capture',
        inputs: [],
        outputs: ['pat:Read:h1'],
        metadata: { sessionId: 'sess2', toolName: 'Read', inputHash: 'h1' },
        timestamp: '2026-02-13T00:02:00Z',
      });
      await t.record({
        artifactId: 'obs:sess3:Read:h1',
        artifactType: 'observation',
        stage: 'capture',
        inputs: [],
        outputs: ['pat:Read:h1'],
        metadata: { sessionId: 'sess3', toolName: 'Read', inputHash: 'h1' },
        timestamp: '2026-02-13T00:03:00Z',
      });

      // Stage 2: Analysis -- pattern from 3 observations
      await t.record({
        artifactId: 'pat:Read:h1',
        artifactType: 'pattern',
        stage: 'analysis',
        inputs: ['obs:sess1:Read:h1', 'obs:sess2:Read:h1', 'obs:sess3:Read:h1'],
        outputs: ['cand:Read:h1'],
        metadata: { varianceScore: 0.0, determinism: 1.0, observationCount: 3 },
        timestamp: '2026-02-13T00:04:00Z',
      });

      // Stage 3: Detection -- candidate from pattern
      await t.record({
        artifactId: 'cand:Read:h1',
        artifactType: 'candidate',
        stage: 'detection',
        inputs: ['pat:Read:h1'],
        outputs: ['script:Read:h1'],
        metadata: { compositeScore: 0.88, frequency: 3, estimatedTokenSavings: 150 },
        timestamp: '2026-02-13T00:05:00Z',
      });

      // Stage 4: Generation -- script from candidate
      await t.record({
        artifactId: 'script:Read:h1',
        artifactType: 'script',
        stage: 'generation',
        inputs: ['cand:Read:h1'],
        outputs: ['gate:Read:h1:t1'],
        metadata: { scriptType: 'bash', isValid: true, tool: 'Read' },
        timestamp: '2026-02-13T00:06:00Z',
      });

      // Stage 5: Gatekeeping -- decision on script
      await t.record({
        artifactId: 'gate:Read:h1:t1',
        artifactType: 'decision',
        stage: 'gatekeeping',
        inputs: ['script:Read:h1'],
        outputs: ['exec:Read:h1:t1'],
        metadata: { approved: true, reasoning: ['Determinism 1.000 >= 0.95: passed'], determinism: 1.0, confidence: 0.88 },
        timestamp: '2026-02-13T00:07:00Z',
      });

      // Stage 6: Feedback -- execution result
      await t.record({
        artifactId: 'exec:Read:h1:t1',
        artifactType: 'execution',
        stage: 'feedback',
        inputs: ['gate:Read:h1:t1'],
        outputs: [],
        metadata: { matched: true, consecutiveMismatches: 0, operationId: 'Read:h1' },
        timestamp: '2026-02-13T00:08:00Z',
      });
    }

    it('getChain from candidate shows full upstream and downstream', async () => {
      await buildFullPipeline(tracker);
      const result = await tracker.getChain('cand:Read:h1');
      expect(result.artifact.artifactId).toBe('cand:Read:h1');
      expect(result.upstream.length).toBe(4); // pattern + 3 observations
      expect(result.downstream.length).toBe(3); // script + decision + execution
      const upIds = result.upstream.map(e => e.artifactId);
      expect(upIds).toContain('pat:Read:h1');
      expect(upIds).toContain('obs:sess1:Read:h1');
      expect(upIds).toContain('obs:sess2:Read:h1');
      expect(upIds).toContain('obs:sess3:Read:h1');
      const downIds = result.downstream.map(e => e.artifactId);
      expect(downIds).toContain('script:Read:h1');
      expect(downIds).toContain('gate:Read:h1:t1');
      expect(downIds).toContain('exec:Read:h1:t1');
    });

    it('getChain from observation traces all the way to execution', async () => {
      await buildFullPipeline(tracker);
      const result = await tracker.getChain('obs:sess1:Read:h1');
      expect(result.upstream.length).toBe(0);
      expect(result.downstream.length).toBe(5); // pattern + candidate + script + decision + execution
    });

    it('getChain from execution traces all the way back to observations', async () => {
      await buildFullPipeline(tracker);
      const result = await tracker.getChain('exec:Read:h1:t1');
      expect(result.upstream.length).toBe(7); // decision + script + candidate + pattern + 3 observations
      expect(result.downstream.length).toBe(0);
    });

    it('querying a script shows originating observations', async () => {
      await buildFullPipeline(tracker);
      const result = await tracker.getUpstream('script:Read:h1');
      expect(result.filter(e => e.artifactType === 'candidate').length).toBe(1);
      expect(result.filter(e => e.artifactType === 'pattern').length).toBe(1);
      expect(result.filter(e => e.artifactType === 'observation').length).toBe(3);
    });

    it('querying an observation shows all downstream products', async () => {
      await buildFullPipeline(tracker);
      const result = await tracker.getDownstream('obs:sess1:Read:h1');
      expect(result.length).toBe(5);
      expect(result.map(e => e.artifactType)).toContain('pattern');
      expect(result.map(e => e.artifactType)).toContain('candidate');
      expect(result.map(e => e.artifactType)).toContain('script');
      expect(result.map(e => e.artifactType)).toContain('decision');
      expect(result.map(e => e.artifactType)).toContain('execution');
    });

    it('getByArtifactType() returns only entries of the specified type', async () => {
      await buildFullPipeline(tracker);
      const observations = await tracker.getByArtifactType('observation');
      expect(observations.length).toBe(3);
      expect(observations.every(e => e.artifactType === 'observation')).toBe(true);

      const decisions = await tracker.getByArtifactType('decision');
      expect(decisions.length).toBe(1);
      expect(decisions[0].artifactId).toBe('gate:Read:h1:t1');
    });

    it('getByArtifactType() returns empty array for type with no entries', async () => {
      await tracker.record(makeEntry({
        artifactId: 'obs:s1:Read:h1',
        artifactType: 'observation',
        stage: 'capture',
      }));
      const result = await tracker.getByArtifactType('execution');
      expect(result.length).toBe(0);
    });
  });

  describe('cycle safety', () => {
    it('handles cycles without infinite recursion', async () => {
      await tracker.record(makeEntry({
        artifactId: 'a',
        artifactType: 'observation',
        stage: 'capture',
        inputs: ['b'],
        outputs: ['b'],
      }));
      await tracker.record(makeEntry({
        artifactId: 'b',
        artifactType: 'pattern',
        stage: 'analysis',
        inputs: ['a'],
        outputs: ['a'],
      }));

      const upstream = await tracker.getUpstream('a');
      expect(upstream.length).toBeLessThanOrEqual(1);
      expect(upstream.map(e => e.artifactId)).toContain('b');

      const downstream = await tracker.getDownstream('a');
      expect(downstream.length).toBeLessThanOrEqual(1);
    });

    it('handles self-referencing entries without infinite recursion', async () => {
      await tracker.record(makeEntry({
        artifactId: 'self',
        artifactType: 'observation',
        stage: 'capture',
        inputs: ['self'],
        outputs: ['self'],
      }));

      const upstream = await tracker.getUpstream('self');
      const downstream = await tracker.getDownstream('self');
      // Should not hang -- bounded result
      expect(upstream.length).toBeLessThanOrEqual(1);
      expect(downstream.length).toBeLessThanOrEqual(1);
    });
  });

  describe('barrel exports', () => {
    it('exports LineageTracker and lineage types from observation barrel', async () => {
      const barrel = await import('./index.js');
      expect(barrel.LineageTracker).toBeDefined();
      expect(typeof barrel.LineageTracker).toBe('function');
    });
  });
});
