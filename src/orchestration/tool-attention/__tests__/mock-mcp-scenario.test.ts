/**
 * HB-01 — End-to-end mock-MCP scenario.
 *
 * N=20 tools at varied complexity (10 simple, 6 mid, 4 large) reproduces the
 * planning-bridge MCP shape: a heterogeneous corpus where most queries only
 * touch a small subset. The pipeline should rank, gate, and lazily load such
 * that only the relevant 6-12 schemas are emitted.
 */

import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import { runToolAttentionPipeline } from '../index.js';
import { hashingEmbedding } from '../iso-score.js';
import type { CompactToolEntry, ToolEmbeddingSidecar } from '../types.js';

interface MockTool {
  compact: CompactToolEntry;
  sidecar: ToolEmbeddingSidecar;
  schema: Record<string, unknown>;
}

function mockMcp(): MockTool[] {
  const out: MockTool[] = [];
  for (let i = 0; i < 10; i++) {
    out.push(makeTool(`crud_${i}`, 'simple flat record CRUD operation', 80));
  }
  for (let i = 0; i < 6; i++) {
    out.push(makeTool(`workflow_${i}`, 'mid-complexity action with enum filters', 200));
  }
  for (let i = 0; i < 4; i++) {
    out.push(makeTool(`graph_${i}`, 'large nested-object graph traversal contract', 800));
  }
  return out;
}

function makeTool(name: string, desc: string, fullTokens: number): MockTool {
  return {
    compact: {
      name,
      shortDescription: desc,
      compactTokens: 8,
      fullSchemaTokens: fullTokens,
    },
    sidecar: { name, embedding: hashingEmbedding(name + ' ' + desc, 64) },
    schema: { name, _placeholder: true },
  };
}

describe('HB-01 mock-MCP scenario — N=20 varied complexity', () => {
  it('only fetches full schemas for the gated top-k', () => {
    const env = withFlag(true);
    try {
      const tools = mockMcp();
      const compactCorpus = tools.map((t) => t.compact);
      const sidecars = tools.map((t) => t.sidecar);
      const byName = new Map(tools.map((t) => [t.compact.name, t.schema]));
      const out = runToolAttentionPipeline({
        sidecars, compactCorpus,
        intentEmbedding: hashingEmbedding('simple flat record CRUD', 64),
        phase: 'executing',
        resolveFullSchema: (n) => byName.get(n) ?? null,
        contextWindowTokens: 100000,
        settingsPath: env.configPath,
      });
      const load = out.load as { compactPool: unknown[]; fullSchemas: unknown[] };
      expect(load.compactPool.length).toBe(20);
      expect(load.fullSchemas.length).toBeLessThanOrEqual(8);
      expect(load.fullSchemas.length).toBeGreaterThan(0);
    } finally { env.cleanup(); }
  });
});
