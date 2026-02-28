/**
 * MCP Performance Benchmarks -- verifying MCP overhead stays under 50ms.
 *
 * Measures the staging pipeline overhead for tool invocations, hash computation,
 * concurrent validation, and agent bridge round-trips. All operations are
 * in-memory with no I/O, so the 50ms budget is generous.
 *
 * Requirement: TEST-06
 *
 * @module mcp/integration-perf.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StagingPipeline } from './security/index.js';
import { computeToolHash } from './security/index.js';
import { createScoutServer, createExecClient } from './agent-bridge/index.js';
import type { Tool } from '../../core/types/mcp.js';

// ============================================================================
// Helpers
// ============================================================================

function sampleTools(count: number = 2): Tool[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `tool-${i}`,
    description: `Test tool number ${i}`,
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' },
        count: { type: 'number' },
      },
    },
  }));
}

// ============================================================================
// TEST-06: Performance Benchmarks
// ============================================================================

describe('TEST-06: MCP Performance Benchmarks', () => {
  let pipeline: StagingPipeline;

  beforeEach(() => {
    pipeline = new StagingPipeline({
      rateLimiter: { maxPerServer: 1000, maxPerTool: 500, windowMs: 60000 },
    });
  });

  it('staging pipeline validates 100 invocations in <50ms average', async () => {
    await pipeline.registerServer('perf-server', sampleTools());
    await pipeline.setTrustState('perf-server', 'trusted', 'promote');

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const result = await pipeline.validateAndExecute({
        caller: `caller-${i}`,
        serverId: 'perf-server',
        toolName: 'tool-0',
        params: { input: `message-${i}`, count: i },
        source: 'external',
      });
      expect(result.allowed).toBe(true);
    }

    const totalMs = performance.now() - start;
    const avgMs = totalMs / iterations;

    // Average must be under 50ms (in practice should be <1ms)
    expect(avgMs).toBeLessThan(50);
  });

  it('parameter validation with complex params stays under 50ms', async () => {
    await pipeline.registerServer('param-perf', sampleTools());
    await pipeline.setTrustState('param-perf', 'trusted', 'promote');

    const complexParams = {
      input: 'a'.repeat(1000),
      nested: { deep: { value: 'test' } },
      array: Array.from({ length: 50 }, (_, i) => `item-${i}`),
      count: 42,
    };

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await pipeline.validateAndExecute({
        caller: 'perf-test',
        serverId: 'param-perf',
        toolName: 'tool-1',
        params: complexParams,
        source: 'external',
      });
    }

    const totalMs = performance.now() - start;
    const avgMs = totalMs / iterations;
    expect(avgMs).toBeLessThan(50);
  });

  it('concurrent validation across 5 servers all complete under 50ms each', async () => {
    // Register 5 servers
    for (let s = 0; s < 5; s++) {
      await pipeline.registerServer(`concurrent-${s}`, sampleTools());
      await pipeline.setTrustState(`concurrent-${s}`, 'trusted', 'promote');
    }

    // Fire 10 concurrent validations (2 per server)
    const promises: Array<{ promise: Promise<void>; start: number }> = [];

    for (let i = 0; i < 10; i++) {
      const serverId = `concurrent-${i % 5}`;
      const start = performance.now();
      const promise = pipeline
        .validateAndExecute({
          caller: `caller-${i}`,
          serverId,
          toolName: 'tool-0',
          params: { input: `msg-${i}` },
          source: 'external',
        })
        .then((result) => {
          const elapsed = performance.now() - start;
          expect(result.allowed).toBe(true);
          expect(elapsed).toBeLessThan(50);
        });
      promises.push({ promise, start });
    }

    await Promise.all(promises.map((p) => p.promise));
  });

  it('hash computation for 20 tools completes under 50ms', () => {
    const tools = sampleTools(20);

    const start = performance.now();
    const hash = computeToolHash('hash-perf-server', tools);
    const elapsed = performance.now() - start;

    expect(hash.hash).toBeDefined();
    expect(hash.toolCount).toBe(20);
    expect(elapsed).toBeLessThan(50);
  });

  it('agent bridge round-trip overhead under 50ms', async () => {
    const scoutServer = createScoutServer();
    const exec = await createExecClient(scoutServer);

    const iterations = 20;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const result = await exec.execResearch(`topic-${i}`);
      expect(result.isError).toBeFalsy();
    }

    const totalMs = performance.now() - start;
    const avgMs = totalMs / iterations;

    // Average overhead per round-trip should be under 50ms
    expect(avgMs).toBeLessThan(50);

    await exec.disconnect();
  });
});
