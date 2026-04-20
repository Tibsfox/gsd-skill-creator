/**
 * TypeScript client for the math coprocessor MCP server.
 *
 * Spawns `python -m math_coprocessor` as a subprocess and communicates via
 * stdio using the official MCP SDK. Exposes typed methods for the 19 tools.
 *
 * @module coprocessor/client
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CapabilitiesReport,
  CoprocessorClientOptions,
  Precision,
  ToolName,
  ToolResult,
  VramReport,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function defaultCoprocessorRoot(): string {
  return resolve(__dirname, '..', '..', 'coprocessors', 'math');
}

export class CoprocessorClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private readonly opts: Required<CoprocessorClientOptions>;

  constructor(opts: CoprocessorClientOptions = {}) {
    this.opts = {
      pythonPath: opts.pythonPath ?? 'python3',
      coprocessorRoot: opts.coprocessorRoot ?? defaultCoprocessorRoot(),
      configPath: opts.configPath ?? '',
      env: opts.env ?? {},
      clientName: opts.clientName ?? 'skill-creator-coprocessor',
      connectTimeoutMs: opts.connectTimeoutMs ?? 15000,
    };
  }

  async connect(): Promise<void> {
    if (this.client) return;

    const env: Record<string, string> = {
      ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]),
      ...this.opts.env,
    };
    if (this.opts.configPath) {
      env.MATH_COPROCESSOR_CONFIG = this.opts.configPath;
    }

    this.transport = new StdioClientTransport({
      command: this.opts.pythonPath,
      args: ['-m', 'math_coprocessor'],
      cwd: this.opts.coprocessorRoot,
      env,
    });

    this.client = new Client(
      { name: this.opts.clientName, version: '1.0.0' },
      { capabilities: {} },
    );

    const connectPromise = this.client.connect(this.transport);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Coprocessor connect timeout after ${this.opts.connectTimeoutMs}ms`)),
        this.opts.connectTimeoutMs,
      );
    });
    await Promise.race([connectPromise, timeout]);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.transport = null;
  }

  /** Generic typed tool call. Prefer the typed helpers below when available. */
  async callTool<T = unknown>(name: ToolName, args: Record<string, unknown> = {}): Promise<ToolResult<T>> {
    if (!this.client) throw new Error('Coprocessor not connected. Call connect() first.');
    const response = await this.client.callTool({ name, arguments: args });
    const content = response.content;
    if (!Array.isArray(content) || content.length === 0) {
      throw new Error(`Coprocessor tool ${name} returned empty content`);
    }
    const first = content[0];
    if (first.type !== 'text' || typeof first.text !== 'string') {
      throw new Error(`Coprocessor tool ${name} returned non-text content`);
    }
    return JSON.parse(first.text) as ToolResult<T>;
  }

  // ── META ──────────────────────────────────────────────────────────────

  async capabilities(): Promise<ToolResult<CapabilitiesReport>> {
    return this.callTool<CapabilitiesReport>('math.capabilities');
  }

  async vram(): Promise<ToolResult<VramReport>> {
    return this.callTool<VramReport>('math.vram');
  }

  async streams(): Promise<ToolResult<Record<string, unknown>>> {
    return this.callTool<Record<string, unknown>>('math.streams');
  }

  // ── ALGEBRUS (linear algebra) ────────────────────────────────────────

  async gemm(args: {
    a: number[][];
    b: number[][];
    c?: number[][];
    alpha?: number;
    beta?: number;
    precision?: Precision;
  }): Promise<ToolResult<number[][]>> {
    return this.callTool<number[][]>('algebrus.gemm', args);
  }

  async solve(args: { a: number[][]; b: number[]; precision?: Precision }): Promise<ToolResult<number[]>> {
    return this.callTool<number[]>('algebrus.solve', args);
  }

  async svd(args: { a: number[][]; precision?: Precision }): Promise<ToolResult<{ u: number[][]; s: number[]; vt: number[][] }>> {
    return this.callTool<{ u: number[][]; s: number[]; vt: number[][] }>('algebrus.svd', args);
  }

  async eigen(args: { a: number[][]; precision?: Precision }): Promise<ToolResult<{ eigenvalues: number[]; eigenvectors: number[][] }>> {
    return this.callTool<{ eigenvalues: number[]; eigenvectors: number[][] }>('algebrus.eigen', args);
  }

  async det(args: { a: number[][]; precision?: Precision }): Promise<ToolResult<number>> {
    return this.callTool<number>('algebrus.det', args);
  }

  // ── FOURIER (spectral analysis) ──────────────────────────────────────

  async fft(args: { data: number[]; precision?: Precision }): Promise<ToolResult<{ real: number[]; imag: number[] }>> {
    return this.callTool<{ real: number[]; imag: number[] }>('fourier.fft', args);
  }

  async ifft(args: { data_real: number[]; data_imag: number[]; precision?: Precision }): Promise<ToolResult<{ real: number[]; imag: number[] }>> {
    return this.callTool<{ real: number[]; imag: number[] }>('fourier.ifft', args);
  }

  async spectrum(args: { data: number[]; sample_rate?: number; precision?: Precision }): Promise<ToolResult<{ frequencies: number[]; power: number[] }>> {
    return this.callTool<{ frequencies: number[]; power: number[] }>('fourier.spectrum', args);
  }

  // ── VECTORA (vector calculus + batch eval) ───────────────────────────

  async gradient(args: { field: number[] | number[][]; spacing?: number; precision?: Precision }): Promise<ToolResult<number[] | number[][]>> {
    return this.callTool<number[] | number[][]>('vectora.gradient', args);
  }

  async transform(args: { points: number[][]; matrix: number[][]; precision?: Precision }): Promise<ToolResult<number[][]>> {
    return this.callTool<number[][]>('vectora.transform', args);
  }

  async batchEval(args: { expression: string; param_name: string; values: number[]; precision?: Precision }): Promise<ToolResult<number[]>> {
    return this.callTool<number[]>('vectora.batch_eval', args);
  }

  // ── STATOS (statistics) ──────────────────────────────────────────────

  async describe(args: { data: number[]; precision?: Precision }): Promise<ToolResult<{ mean: number; median: number; stddev: number; variance: number; min: number; max: number; quartiles: number[] }>> {
    return this.callTool<{ mean: number; median: number; stddev: number; variance: number; min: number; max: number; quartiles: number[] }>(
      'statos.describe',
      args,
    );
  }

  async monteCarlo(args: { expression: string; param_ranges: Record<string, [number, number]>; n_paths?: number; precision?: Precision }): Promise<ToolResult<{ mean: number; stddev: number; percentiles: Record<string, number> }>> {
    return this.callTool<{ mean: number; stddev: number; percentiles: Record<string, number> }>(
      'statos.monte_carlo',
      args,
    );
  }

  async regression(args: { x: number[]; y: number[]; degree?: number; precision?: Precision }): Promise<ToolResult<{ coefficients: number[]; r_squared: number; residuals: number[] }>> {
    return this.callTool<{ coefficients: number[]; r_squared: number; residuals: number[] }>(
      'statos.regression',
      args,
    );
  }

  // ── SYMBEX (symbolic / expression evaluation) ────────────────────────

  async evalExpr(args: { expression: string; param_name: string; values: number[]; precision?: Precision }): Promise<ToolResult<number[]>> {
    return this.callTool<number[]>('symbex.eval', args);
  }

  async verify(args: { expression: string; param_name: string; values: number[]; expected: number | number[]; tolerance?: number; precision?: Precision }): Promise<ToolResult<{ passed: boolean; max_error: number }>> {
    return this.callTool<{ passed: boolean; max_error: number }>('symbex.verify', args);
  }
}
