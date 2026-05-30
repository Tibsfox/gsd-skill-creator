/**
 * Types for the math coprocessor runtime.
 *
 * Mirrors the 19 MCP tools exposed by `coprocessors/math/math_coprocessor/server.py`.
 * The Python server is the source of truth; keep this file in sync when the
 * server's tool registry changes.
 *
 * @module coprocessor/types
 */

/** The 5 chip identifiers. */
export type ChipName = 'algebrus' | 'fourier' | 'vectora' | 'statos' | 'symbex';

/** The 19 tool names exposed over MCP. */
export type ToolName =
  | 'algebrus.gemm'
  | 'algebrus.solve'
  | 'algebrus.svd'
  | 'algebrus.eigen'
  | 'algebrus.det'
  | 'fourier.fft'
  | 'fourier.ifft'
  | 'fourier.spectrum'
  | 'vectora.gradient'
  | 'vectora.transform'
  | 'vectora.batch_eval'
  | 'statos.describe'
  | 'statos.monte_carlo'
  | 'statos.regression'
  | 'symbex.eval'
  | 'symbex.verify'
  | 'math.capabilities'
  | 'math.vram'
  | 'math.streams';

/** Numeric precision for a single call. Defaults to the chipset.yaml default. */
export type Precision = 'fp32' | 'fp64';

/** Response metadata attached to every tool result by the Python server. */
export interface ToolResultMeta {
  chip: ChipName | 'math';
  tool: ToolName;
  device: 'gpu' | 'cpu';
  precision: Precision;
  elapsed_ms: number;
}

/** Shape of a successful tool call result. */
export interface ToolResult<T = unknown> {
  value: T;
  meta: ToolResultMeta;
}

/**
 * VRAM budget report from `math.vram` (and the nested `vram` block of
 * `math.capabilities`). Field names mirror the Python server verbatim —
 * captured from a live `coprocessors/math/` probe on 2026-05-30. The server
 * is the source of truth; keep this in sync.
 */
export interface VramReport {
  budget_mb: number;
  allocated_mb: number;
  utilization_pct: number;
  active_allocations: number;
  backend: string;
  gpu_name: string;
  gpu_free_mb: number;
  gpu_total_mb: number;
}

/** Per-chip capability record nested under `CapabilitiesReport.chips`. */
export interface ChipCapability {
  /** Upper-case chip identifier, e.g. "STATOS". */
  chip: string;
  operations: string[];
  /** Operations that dispatch to the GPU when CUDA is available. */
  gpu_accelerated: string[];
  /** Operations that always run on the CPU oracle. */
  cpu_fallback: string[];
  precision: Precision[];
  /** Backend description, e.g. "cuRAND+custom". */
  backend: string;
  enabled: boolean;
  /** SYMBEX-only: NVRTC JIT availability + cache stats. */
  jit_available?: boolean;
  jit_cache?: Record<string, unknown>;
}

/** GPU device info nested under `CapabilitiesReport.gpu`. */
export interface GpuInfo {
  name: string;
  compute_capability: [number, number];
  total_memory_mb: number;
  free_memory_mb: number;
  available: boolean;
}

/** CUDA stream isolation status from `math.streams`. */
export interface StreamsReport {
  dedicated_stream: boolean;
  stream_priority: number;
  active_ops: number;
  max_concurrent_ops: number;
  sync_after_op: boolean;
}

/**
 * Capabilities report from `math.capabilities`. Mirrors the live server
 * response (probed 2026-05-30): a flat object with `chips`, `gpu`, `vram`,
 * `streams`, and `config` keys.
 */
export interface CapabilitiesReport {
  chips: Record<ChipName, ChipCapability>;
  gpu: GpuInfo;
  vram: VramReport;
  streams: StreamsReport;
  config: { default_precision: Precision; thermal_limit_c: number };
}

/** Transport configuration for spawning the Python MCP server. */
export interface CoprocessorTransportConfig {
  /** Python interpreter path. Defaults to 'python3'. */
  pythonPath?: string;
  /** Override for the coprocessors/math/ directory. Defaults to repo-relative. */
  coprocessorRoot?: string;
  /** Override for the chipset.yaml config path. Defaults to coprocessors/math/chipset.yaml. */
  configPath?: string;
  /** Additional env vars for the subprocess. */
  env?: Record<string, string>;
}

/** Options for the CoprocessorClient constructor. */
export interface CoprocessorClientOptions extends CoprocessorTransportConfig {
  /** Client display name for logs. Defaults to 'skill-creator-coprocessor'. */
  clientName?: string;
  /** Connect timeout in ms. Defaults to 15000. */
  connectTimeoutMs?: number;
}

/** Declared in a skill's frontmatter to pre-warm chips on activation. */
export interface CoprocessorActivationSpec {
  /** Chips required for this skill. The activation hook pre-allocates their VRAM. */
  required?: ChipName[];
  /** Preferred precision (overrides chipset default for this skill's calls). */
  precision?: Precision;
  /** Whether to allow CPU fallback. Defaults to true. */
  cpu_fallback?: boolean;
}
