/**
 * Unit tests for `normalizeToolResult` — the adapter that maps the Python
 * coprocessor server's flat response dicts into the typed `{ value, meta }`
 * envelope the client exposes.
 *
 * These fixtures are VERBATIM captures from a live `coprocessors/math/` probe
 * on 2026-05-30 (RTX 4060 Ti). They are the drift-guard: if the server's wire
 * shape changes, or the normalizer regresses to the pre-2026-05-30 fiction
 * (where it cast the flat dict straight to `{value, meta}` and every `.value`
 * was undefined), these CI-gated assertions fail — no GPU or live server
 * required. Closes the latent contract drift that made the default-on
 * coprocessor activation hook silently no-op (GAP-4).
 */
import { describe, expect, it } from 'vitest';
import { normalizeToolResult } from '../client.js';

// ── Real captured server responses (flat dicts, no envelope) ────────────────

const MONTE_CARLO_GPU = {
  mean: 1.3319470882415771,
  std: 0.6504696011543274,
  min: 0.0010871418053284287,
  max: 2.9942259788513184,
  q05: 0.28272706270217896,
  q95: 2.409430503845215,
  n_paths: 200000,
  backend: 'gpu',
  precision: 'fp32',
  computation_time_ms: 17.036,
  operation: 'monte_carlo',
};

const DET_CPU = { result: -2, backend: 'cpu', precision: 'fp64', computation_time_ms: 0.1, operation: 'det' };

const SVD_CPU = {
  U: [[1, 0], [0, 1]],
  s: [1, 1],
  Vt: [[1, 0], [0, 1]],
  backend: 'cpu',
  precision: 'fp64',
  computation_time_ms: 0.2,
  operation: 'svd',
};

const EVAL_GPU = { result: [1, 4, 9], backend: 'gpu', precision: 'fp32', computation_time_ms: 0.5, operation: 'eval', jit_cached: true };

const CAPABILITIES = {
  chips: {
    statos: { chip: 'STATOS', operations: ['describe', 'monte_carlo', 'regression'], gpu_accelerated: ['monte_carlo'], cpu_fallback: ['describe', 'regression'], precision: ['fp32', 'fp64'], backend: 'cuRAND+custom', enabled: true },
    algebrus: { chip: 'ALGEBRUS', operations: ['gemm', 'det'], gpu_accelerated: ['gemm'], cpu_fallback: ['det'], precision: ['fp32', 'fp64'], backend: 'cuBLAS/cuSOLVER', enabled: true },
  },
  gpu: { name: 'NVIDIA GeForce RTX 4060 Ti', compute_capability: [8, 9], total_memory_mb: 7803, free_memory_mb: 3279, available: true },
  vram: { budget_mb: 750, allocated_mb: 0, utilization_pct: 0, active_allocations: 0, backend: 'gpu', gpu_name: 'NVIDIA GeForce RTX 4060 Ti', gpu_free_mb: 3279, gpu_total_mb: 7803 },
  streams: { dedicated_stream: true, stream_priority: 1, active_ops: 1, max_concurrent_ops: 4, sync_after_op: true },
  config: { default_precision: 'fp64', thermal_limit_c: 85 },
};

const VRAM = { budget_mb: 750, allocated_mb: 0, utilization_pct: 0, active_allocations: 0, backend: 'gpu', gpu_name: 'NVIDIA GeForce RTX 4060 Ti', gpu_free_mb: 3279, gpu_total_mb: 7803 };

const STREAMS = { dedicated_stream: true, stream_priority: 1, active_ops: 1, max_concurrent_ops: 4, sync_after_op: true };

const EIGEN_ERROR = { error: 'eigen requires a square matrix', operation: 'eigen', backend: 'error' };

const META_KEYS = ['backend', 'precision', 'computation_time_ms', 'operation', 'jit_cached'];

describe('normalizeToolResult', () => {
  it('maps a GPU spread op (monte_carlo) to value + meta with device=gpu', () => {
    const r = normalizeToolResult('statos.monte_carlo', MONTE_CARLO_GPU);
    expect(r.meta.device).toBe('gpu');
    expect(r.meta.chip).toBe('statos');
    expect(r.meta.tool).toBe('statos.monte_carlo');
    expect(r.meta.precision).toBe('fp32');
    expect(r.meta.elapsed_ms).toBe(17.036);
    expect(r.value).toMatchObject({ mean: expect.any(Number), std: expect.any(Number), n_paths: 200000 });
  });

  it('strips every meta key out of a spread op value (no leakage)', () => {
    const r = normalizeToolResult('statos.monte_carlo', MONTE_CARLO_GPU);
    for (const k of META_KEYS) {
      expect(r.value as Record<string, unknown>).not.toHaveProperty(k);
    }
    // payload fields survive
    expect(Object.keys(r.value as Record<string, unknown>).sort()).toEqual(
      ['max', 'mean', 'min', 'n_paths', 'q05', 'q95', 'std'],
    );
  });

  it('unwraps a single-value op (det) to the bare result, not an object', () => {
    const r = normalizeToolResult('algebrus.det', DET_CPU);
    expect(r.value).toBe(-2);
    expect(r.meta.device).toBe('cpu');
    expect(r.meta.chip).toBe('algebrus');
    expect(r.meta.tool).toBe('algebrus.det');
  });

  it('unwraps a result-key op even when extra meta (jit_cached) is present', () => {
    const r = normalizeToolResult('symbex.eval', EVAL_GPU);
    expect(r.value).toEqual([1, 4, 9]);
    expect(r.meta.device).toBe('gpu');
  });

  it('preserves capitalised spread keys (svd U/Vt)', () => {
    const r = normalizeToolResult('algebrus.svd', SVD_CPU);
    const v = r.value as Record<string, unknown>;
    expect(v).toHaveProperty('U');
    expect(v).toHaveProperty('s');
    expect(v).toHaveProperty('Vt');
    expect(v).not.toHaveProperty('backend');
  });

  it('keeps the flat capabilities report navigable (chips/gpu/vram/config)', () => {
    const r = normalizeToolResult('math.capabilities', CAPABILITIES);
    // The exact access path activation.ts + cli.ts rely on:
    expect(r.value).toHaveProperty('chips');
    const v = r.value as typeof CAPABILITIES;
    expect(v.chips.statos.enabled).toBe(true);
    expect(v.chips.algebrus.gpu_accelerated).toContain('gemm');
    expect(v.gpu.available).toBe(true);
    expect(v.config.default_precision).toBe('fp64');
    expect(v.vram.budget_mb).toBeGreaterThan(0);
    expect(r.meta.chip).toBe('math');
    expect(r.meta.tool).toBe('math.capabilities');
  });

  it('keeps the vram report fields and reads device from backend', () => {
    const r = normalizeToolResult('math.vram', VRAM);
    const v = r.value as typeof VRAM;
    expect(v.budget_mb).toBe(750);
    expect(v.gpu_free_mb).toBe(3279);
    expect(r.meta.device).toBe('gpu');
  });

  it('treats a report with no backend (streams) as device=cpu', () => {
    const r = normalizeToolResult('math.streams', STREAMS);
    const v = r.value as typeof STREAMS;
    expect(v.dedicated_stream).toBe(true);
    expect(r.meta.device).toBe('cpu');
  });

  it('throws (does not return a bogus value) on a server-side error', () => {
    expect(() => normalizeToolResult('algebrus.eigen', EIGEN_ERROR)).toThrow(/eigen requires a square matrix/);
  });

  it('tolerates a non-object response without crashing', () => {
    const r = normalizeToolResult('math.streams', null);
    expect(r.meta.tool).toBe('math.streams');
    expect(r.value).toEqual({});
  });
});
