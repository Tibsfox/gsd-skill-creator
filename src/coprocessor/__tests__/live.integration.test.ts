/**
 * Live end-to-end integration test for the coprocessor.
 *
 * Spawns the actual Python MCP server at `coprocessors/math/` and exercises
 * a handful of tool calls against it. GATED: only runs when the environment
 * variable `COPROCESSOR_LIVE_TESTS=1` is set, so default `npm test` stays
 * lean and CI doesn't fail on machines without the Python + mcp package
 * prerequisites.
 *
 * To run locally:
 *   COPROCESSOR_LIVE_TESTS=1 npx vitest run src/coprocessor/__tests__/live.integration.test.ts
 *
 * Requirements: a Python interpreter on PATH with the `mcp` package
 * importable and the repo-root `coprocessors/math/` tree available.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CoprocessorClient } from '../client.js';

const LIVE = process.env.COPROCESSOR_LIVE_TESTS === '1';
const describeLive = LIVE ? describe : describe.skip;

describeLive('CoprocessorClient (live Python server)', () => {
  let client: CoprocessorClient;

  beforeAll(async () => {
    client = new CoprocessorClient({
      pythonPath: process.env.COPROCESSOR_PYTHON ?? 'python3',
      connectTimeoutMs: 30_000,
    });
    await client.connect();
  }, 40_000);

  afterAll(async () => {
    if (client) await client.disconnect();
  });

  it('reports capabilities for all 5 chips', async () => {
    const caps = await client.capabilities();
    expect(caps.value.chips).toBeDefined();
    for (const chip of ['algebrus', 'fourier', 'vectora', 'statos', 'symbex'] as const) {
      expect(caps.value.chips[chip]).toBeDefined();
      expect(typeof caps.value.chips[chip].enabled).toBe('boolean');
    }
    expect(['fp32', 'fp64']).toContain(caps.value.default_precision);
    expect(caps.value.vram_budget_mb).toBeGreaterThan(0);
  }, 20_000);

  it('reports a VRAM budget', async () => {
    const report = await client.vram();
    expect(report.value.budget_mb).toBeGreaterThan(0);
    expect(report.value.used_mb).toBeGreaterThanOrEqual(0);
    expect(report.value.free_mb).toBeGreaterThanOrEqual(0);
    expect(report.value.used_mb + report.value.free_mb).toBeLessThanOrEqual(report.value.budget_mb + 1);
  }, 20_000);

  it('computes algebrus.det of a known 2x2 matrix (CPU-fallback safe)', async () => {
    // det([[1, 2], [3, 4]]) = -2
    const result = await client.det({ a: [[1, 2], [3, 4]] });
    expect(result.value).toBeCloseTo(-2, 6);
    expect(result.meta.tool).toBe('algebrus.det');
    expect(['gpu', 'cpu']).toContain(result.meta.device);
  }, 20_000);

  it('describes a constant vector correctly', async () => {
    const result = await client.describe({ data: [5, 5, 5, 5, 5] });
    expect(result.value.mean).toBeCloseTo(5, 10);
    expect(result.value.stddev).toBeCloseTo(0, 10);
    expect(result.value.min).toBe(5);
    expect(result.value.max).toBe(5);
  }, 20_000);

  it('round-trips fft / ifft within tolerance', async () => {
    const signal = [1, 0, -1, 0, 1, 0, -1, 0];
    const forward = await client.fft({ data: signal });
    const back = await client.ifft({ data_real: forward.value.real, data_imag: forward.value.imag });
    for (let i = 0; i < signal.length; i++) {
      expect(back.value.real[i]).toBeCloseTo(signal[i], 6);
    }
  }, 20_000);
});
