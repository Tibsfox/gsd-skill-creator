/**
 * GPU end-to-end proof for GAP-4 ("GPU Pipeline Not Built E2E").
 *
 * Drives the REAL skill-activation pipeline — a skill that declares a
 * `coprocessor:` frontmatter block flows through `createCoprocessorStage` →
 * `activateCoprocessor` → the live MCP server → a cuRAND Monte-Carlo dispatch
 * on the GPU — and asserts the result actually came back from the GPU
 * (`meta.device === 'gpu'`). This is the closure evidence for GAP-4: prior to
 * v1.49.919 the typed client drifted from the server's flat wire shape, so
 * `activateCoprocessor` threw on `caps.value.chips` and the default-on hook
 * silently no-opped — the GPU was never reached via skill activation.
 *
 * GATED: only runs when `COPROCESSOR_GPU_E2E=1` AND the live server is
 * reachable. The Monte-Carlo GPU assertion additionally requires a CUDA GPU;
 * if the server reports no GPU it skips that case (rather than fail) so the
 * gate can be set on a non-GPU box without a red suite. Locally-verified-only:
 * CI has no GPU and does not provision the Python `mcp` server (mirrors the
 * Memory Arena cuda-path convention).
 *
 * To run locally (RTX 4060 Ti):
 *   COPROCESSOR_GPU_E2E=1 \
 *   COPROCESSOR_PYTHON=/path/to/venv/bin/python \
 *   npx vitest run src/coprocessor/__tests__/gpu-e2e.integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createCoprocessorStage, type CoprocessorHookResult } from '../applicator-hook.js';
import { getSharedClient, shutdownSharedClient } from '../activation.js';
import { createEmptyContext } from '../../application/skill-pipeline.js';
import type { CoprocessorClient } from '../client.js';

const GPU_E2E = process.env.COPROCESSOR_GPU_E2E === '1';
const describeE2E = GPU_E2E ? describe : describe.skip;

describeE2E('GAP-4 skill-activation → GPU dispatch → result (live)', () => {
  let client: CoprocessorClient;
  let gpuAvailable = false;

  beforeAll(async () => {
    client = await getSharedClient();
    const caps = await client.capabilities();
    gpuAvailable = caps.value.gpu?.available === true;
  }, 40_000);

  afterAll(async () => {
    await shutdownSharedClient();
  });

  it('activates a skill that declares `coprocessor: [statos]` against the live server', async () => {
    // This is the exact path that silently no-opped before the v1.49.919 fix:
    // frontmatter → activateCoprocessor → capabilities → chip.enabled check.
    const results: CoprocessorHookResult[] = [];
    const stage = createCoprocessorStage({
      readSkillContent: () => '---\nname: gpu-mc-skill\ncoprocessor: [statos]\n---\nBody.\n',
      onResult: (r) => results.push(r),
    });
    const context = createEmptyContext({ loaded: ['gpu-mc-skill'] });
    await stage.process(context);

    expect(results).toHaveLength(1);
    expect(results[0].requested).toEqual(['statos']);
    expect(results[0].error).toBeUndefined();
    expect(results[0].available).toContain('statos');
    expect(results[0].missing).toEqual([]);
  }, 30_000);

  it('dispatches a cuRAND Monte-Carlo run to the GPU and returns a correct result', async (ctx) => {
    if (!gpuAvailable) {
      ctx.skip();
      return;
    }
    // E[x^2 + y] for x∈[0,1], y∈[0,2] = 1/3 + 1 = 4/3 ≈ 1.3333
    const result = await client.monteCarlo({
      expression: 'x*x + y',
      param_ranges: { x: [0, 1], y: [0, 2] },
      n_paths: 200_000,
      precision: 'fp32',
    });
    expect(result.meta.device).toBe('gpu');
    expect(result.meta.tool).toBe('statos.monte_carlo');
    expect(result.value.n_paths).toBe(200_000);
    expect(result.value.mean).toBeCloseTo(4 / 3, 1);
    expect(Number.isFinite(result.value.std)).toBe(true);
  }, 30_000);
});
