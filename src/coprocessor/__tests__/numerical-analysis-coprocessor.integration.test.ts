/**
 * Live end-to-end proof for CF4b: the FIRST shipped skill that declares a
 * `coprocessor:` frontmatter block, driven through the REAL activation
 * pipeline against the live Python MCP server.
 *
 * The headline case reads the actual shipped
 * `examples/skills/math/numerical-analysis/SKILL.md` from disk and feeds it
 * through `createCoprocessorStage` → `extractCoprocessorRaw` →
 * `parseCoprocessorSpec` → `activateCoprocessor` → the live server, asserting
 * the declared chips (`algebrus`, `statos`) are actually reachable + enabled.
 * The remaining cases exercise the declared chips' ops against closed-form
 * oracles, asserting numeric correctness and tool identity. Device is asserted
 * as MEMBERSHIP (`['gpu','cpu']`), never pinned — on a CUDA box `gemm` routes
 * to the GPU while `det`/`solve`/`describe` stay on the CPU oracle.
 *
 * GATED: only runs when `COPROCESSOR_LIVE_TESTS=1`. Default `npm test`, the
 * `integration` vitest project in pre-tag-gate, and CI all leave the env var
 * unset, so this suite is `describe.skip`'d there (CI has no Python `mcp`
 * server). Locally-verified-only.
 *
 * To run locally:
 *   COPROCESSOR_LIVE_TESTS=1 \
 *   COPROCESSOR_PYTHON=/path/to/venv/bin/python \
 *   npx vitest run --project integration \
 *     src/coprocessor/__tests__/numerical-analysis-coprocessor.integration.test.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCoprocessorStage, type CoprocessorHookResult } from '../applicator-hook.js';
import { getSharedClient, shutdownSharedClient } from '../activation.js';
import { createEmptyContext } from '../../application/skill-pipeline.js';
import type { CoprocessorClient } from '../client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = resolve(
  __dirname,
  '../../../examples/skills/math/numerical-analysis/SKILL.md',
);

const LIVE = process.env.COPROCESSOR_LIVE_TESTS === '1';
const describeLive = LIVE ? describe : describe.skip;

describeLive('numerical-analysis coprocessor consumer → live server (CF4b)', () => {
  let client: CoprocessorClient;

  beforeAll(async () => {
    // Shared client so the stage's activateCoprocessor() and the direct oracle
    // calls below talk to the same live server process.
    client = await getSharedClient();
  }, 40_000);

  afterAll(async () => {
    await shutdownSharedClient();
  });

  it('activates the shipped SKILL.md frontmatter against the live server', async () => {
    const content = readFileSync(SKILL_PATH, 'utf8');
    const results: CoprocessorHookResult[] = [];
    const stage = createCoprocessorStage({
      readSkillContent: () => content, // the REAL shipped frontmatter
      onResult: (r) => results.push(r),
    });
    const context = createEmptyContext({ loaded: ['numerical-analysis'] });
    await stage.process(context);

    expect(results).toHaveLength(1);
    expect(results[0].requested).toEqual(['algebrus', 'statos']);
    expect(results[0].error).toBeUndefined();
    expect(results[0].available).toContain('algebrus');
    expect(results[0].available).toContain('statos');
    expect(results[0].missing).toEqual([]);
  }, 30_000);

  it('algebrus.det matches the closed-form oracle', async () => {
    // det(diag(2, 3)) = 6
    const r = await client.det({ a: [[2, 0], [0, 3]] });
    expect(r.value).toBeCloseTo(6, 6);
    expect(r.meta.tool).toBe('algebrus.det');
    expect(['gpu', 'cpu']).toContain(r.meta.device);
  }, 20_000);

  it('algebrus.gemm matches the matmul oracle (may route to GPU)', async () => {
    // [[1,2],[3,4]] @ [[5,6],[7,8]] = [[19,22],[43,50]]
    const r = await client.gemm({ a: [[1, 2], [3, 4]], b: [[5, 6], [7, 8]] });
    expect(r.value).toEqual([[19, 22], [43, 50]]);
    expect(r.meta.tool).toBe('algebrus.gemm');
    expect(['gpu', 'cpu']).toContain(r.meta.device);
  }, 20_000);

  it('algebrus.solve matches the back-substitution oracle', async () => {
    // diag(2, 3) x = [4, 9]  =>  x = [2, 3]
    const r = await client.solve({ a: [[2, 0], [0, 3]], b: [4, 9] });
    expect(r.value[0]).toBeCloseTo(2, 6);
    expect(r.value[1]).toBeCloseTo(3, 6);
    expect(r.meta.tool).toBe('algebrus.solve');
  }, 20_000);

  it('algebrus.eigen returns complex {re,im} eigenpairs — real case (CF4d)', async () => {
    // eig(diag(2, 3)) => eigenvalues {2, 3}, all imaginary parts ~0.
    // Pre-CF4d this threw ("Object of type complex is not JSON serializable").
    const r = await client.eigen({ a: [[2, 0], [0, 3]] });
    expect(r.meta.tool).toBe('algebrus.eigen');
    expect(['gpu', 'cpu']).toContain(r.meta.device);
    const vals = [...r.value.eigenvalues].sort((a, b) => a.re - b.re);
    expect(vals[0].re).toBeCloseTo(2, 6);
    expect(vals[1].re).toBeCloseTo(3, 6);
    for (const ev of r.value.eigenvalues) expect(ev.im).toBeCloseTo(0, 9);
    // eigenvectors arrive as {re,im} pairs too (stable wire contract)
    expect(r.value.eigenvectors).toHaveLength(2);
    expect(r.value.eigenvectors[0][0]).toHaveProperty('re');
    expect(r.value.eigenvectors[0][0]).toHaveProperty('im');
  }, 20_000);

  it('algebrus.eigen carries genuinely complex eigenvalues — rotation case (CF4d)', async () => {
    // eig([[0,-1],[1,0]]) => eigenvalues ±i  (re ~0, im = -1 and +1)
    const r = await client.eigen({ a: [[0, -1], [1, 0]] });
    const vals = [...r.value.eigenvalues].sort((a, b) => a.im - b.im);
    expect(vals[0].im).toBeCloseTo(-1, 6);
    expect(vals[1].im).toBeCloseTo(1, 6);
    for (const ev of vals) expect(ev.re).toBeCloseTo(0, 9);
  }, 20_000);

  it('statos.describe matches the numpy-stats oracle', async () => {
    // population std of 1..5 = sqrt(2)
    const r = await client.describe({ data: [1, 2, 3, 4, 5] });
    expect(r.value.mean).toBeCloseTo(3, 10);
    expect(r.value.std).toBeCloseTo(Math.SQRT2, 8);
    expect(r.value.min).toBe(1);
    expect(r.value.max).toBe(5);
    expect(r.meta.tool).toBe('statos.describe');
  }, 20_000);

  it('statos.regression recovers a perfect line', async () => {
    // y = 2x + 1 sampled exactly => r^2 = 1, coefficients {1, 2}
    const r = await client.regression({
      x: [0, 1, 2, 3, 4],
      y: [1, 3, 5, 7, 9],
      degree: 1,
    });
    expect(r.value.r_squared).toBeCloseTo(1, 6);
    // The two degree-1 coefficients are {1, 2}; assert order-independently
    // (np.polyfit returns descending-power order, so don't assume which is which).
    const sorted = [...r.value.coefficients].sort((a, b) => a - b);
    expect(sorted).toHaveLength(2);
    expect(sorted[0]).toBeCloseTo(1, 4);
    expect(sorted[1]).toBeCloseTo(2, 4);
    expect(r.meta.tool).toBe('statos.regression');
  }, 20_000);
});
