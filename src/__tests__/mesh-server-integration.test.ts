import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MockMeshServer } from './helpers/mock-mesh-server.js';
import { BenchmarkRegressionChecker } from './helpers/benchmark-regression.js';
import type { MultiModelBenchmark } from '../eval/types.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe('MockMeshServer integration', () => {
  let server: MockMeshServer;

  beforeAll(async () => {
    server = new MockMeshServer();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('handles full chat completion flow', async () => {
    const res = await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mock-model',
        messages: [{ role: 'user', content: 'hello' }],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as Record<string, unknown>;
    expect(data).toHaveProperty('choices');
    expect(data).toHaveProperty('usage');

    // Verify request was recorded
    const requests = server.getRequests('/v1/chat/completions');
    expect(requests.length).toBeGreaterThanOrEqual(1);
    const last = requests[requests.length - 1]!;
    expect((last.body as Record<string, unknown>).model).toBe('mock-model');
  });

  it('model discovery via /v1/models and /api/tags', async () => {
    const [modelsRes, tagsRes] = await Promise.all([
      fetch(`${server.baseUrl}/v1/models`),
      fetch(`${server.baseUrl}/api/tags`),
    ]);

    const models = await modelsRes.json() as { data: Array<{ id: string }> };
    const tags = await tagsRes.json() as { models: Array<{ name: string }> };

    expect(models.data.length).toBeGreaterThan(0);
    expect(tags.models.length).toBeGreaterThan(0);
  });

  it('error simulation and recovery', async () => {
    server.setError('/v1/chat/completions', 503, '{"error":"overloaded"}');

    const errorRes = await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      body: '{}',
    });
    expect(errorRes.status).toBe(503);

    server.clearError('/v1/chat/completions');

    const okRes = await fetch(`${server.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      body: '{}',
    });
    expect(okRes.status).toBe(200);
  });

  it('concurrent requests handled correctly', async () => {
    server.clearRequests();
    const requests = Array.from({ length: 5 }, (_, i) =>
      fetch(`${server.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: `model-${i}` }),
      }),
    );

    const responses = await Promise.all(requests);
    expect(responses.every((r) => r.status === 200)).toBe(true);

    const recorded = server.getRequests('/v1/chat/completions');
    expect(recorded).toHaveLength(5);
  });

  it('custom response override', async () => {
    server.setResponse('/v1/models', {
      data: [
        { id: 'llama3.2:1b', context_length: 4096 },
        { id: 'llama3.2:8b', context_length: 32768 },
      ],
    });

    const res = await fetch(`${server.baseUrl}/v1/models`);
    const data = await res.json() as { data: Array<{ id: string }> };
    expect(data.data).toHaveLength(2);
  });
});

describe('Benchmark regression with fixtures', () => {
  const checker = new BenchmarkRegressionChecker();
  const fixturesDir = path.join(import.meta.dirname, 'fixtures', 'baseline-benchmarks');

  it('loads and validates small model baseline', async () => {
    const raw = await fs.readFile(path.join(fixturesDir, 'baseline-small-model.json'), 'utf-8');
    const baseline = JSON.parse(raw) as MultiModelBenchmark;
    expect(baseline.skillName).toBe('baseline-skill');
    expect(baseline.models[0]!.passRate).toBe(0.60);
  });

  it('loads and validates cloud model baseline', async () => {
    const raw = await fs.readFile(path.join(fixturesDir, 'baseline-cloud-model.json'), 'utf-8');
    const baseline = JSON.parse(raw) as MultiModelBenchmark;
    expect(baseline.skillName).toBe('baseline-skill');
    expect(baseline.models[0]!.passRate).toBe(0.95);
  });

  it('detects regression against cloud baseline', async () => {
    const raw = await fs.readFile(path.join(fixturesDir, 'baseline-cloud-model.json'), 'utf-8');
    const baseline = JSON.parse(raw) as MultiModelBenchmark;

    const current: MultiModelBenchmark = {
      ...baseline,
      models: [{ ...baseline.models[0]!, passRate: 0.80 }], // dropped from 0.95 to 0.80
    };

    const result = checker.check(current, baseline, 5);
    expect(result.passed).toBe(false);
    expect(result.regressions[0]!.model).toBe('cloud-tier');
  });
});
