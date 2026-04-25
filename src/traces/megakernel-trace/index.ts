/**
 * HB-02 — Megakernel execution-trace telemetry hook.
 *
 * v1.49.574 Half B, T1 must-ship.
 *
 * Derivation: M3 §3 step 1 (bridge-thesis training-data substrate);
 * M5 §3 step 1 ("Existing skill-creator telemetry → extend to capture
 * kernel-level execution traces"). Cited in `megakernel.bib` as
 * `mk26_2603_19312` (LeWorldModel; the JEPA needs (compute graph, code
 * transformation, observed performance) tuples) and `mk_hazy_nobubbles_2025`
 * (the megakernel layer the traces would be captured from).
 *
 * Substrate-only: append-only JSONL telemetry envelope plus a single
 * "record + read" surface. NO actual telemetry collection from a running
 * kernel — that requires Stage 1 ThunderKittens prototype work, which is
 * out of scope per the mission's Out-of-Scope discipline (M5 §6).
 *
 * The envelope schema is the contract a future engineering mission's
 * telemetry collector writes to. By having it shipped now, downstream code
 * (HB-03 JEPA-planner stub) can declare its observation type against a
 * stable shape without forcing a dependency on a not-yet-built collector.
 *
 * The trace records compose with `src/traces/` Decision-Trace Ledger
 * (the AMTP-compatible append-only JSONL ledger). HB-02 is a sibling format
 * (mk-trace) that flows through the same writer mechanics.
 *
 * ## Opt-in mechanism
 *
 * Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "megakernel-substrate": {
 *       "execution-trace-telemetry": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, `record()` returns the disabled-result
 * sentinel and writes nothing. Byte-identical to pre-v1.49.574 surface.
 *
 * @module traces/megakernel-trace
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { isMegakernelTraceEnabled } from './settings.js';

export { isMegakernelTraceEnabled } from './settings.js';

// ============================================================================
// Trace event schemas.
// ============================================================================

/**
 * A compute-graph snapshot at a synthesis step. Identifies the kernel under
 * consideration, the candidate transformations available, and a coarse-grained
 * resource allocation summary. The shape mirrors LeWM observation-tuple
 * structure: enough state for a downstream JEPA encoder to embed without
 * leaking implementation detail.
 */
export const ComputeGraphStateSchema = z.object({
  kernelId: z.string().min(1),
  modelName: z.string().min(1),
  hardwareTarget: z.string().min(1),
  /** Number of operators currently fused into the megakernel. */
  fusedOperatorCount: z.number().int().min(0),
  /** Number of distinct counters in the synchronization plan. */
  syncCounterCount: z.number().int().min(0),
  /** SM allocation summary: how many SMs per warp-role, if scheduled. */
  smAllocation: z.object({
    producer: z.number().int().min(0),
    consumer: z.number().int().min(0),
    scheduler: z.number().int().min(0),
    free: z.number().int().min(0),
  }).strict().optional(),
  /** Free-form annotations from the upstream emitter (e.g., compiler hints). */
  notes: z.string().optional(),
}).strict();
export type ComputeGraphState = z.infer<typeof ComputeGraphStateSchema>;

/**
 * A code transformation: the action an autotuner / synthesis agent applies
 * to move from one compute-graph state to the next. Categories are stable
 * (a future JEPA action-vocabulary trains over them).
 */
export const CodeTransformationSchema = z.object({
  category: z.enum([
    'instruction-reorder',
    'fusion',
    'tile-size-change',
    'warp-spec-tweak',
    'sync-counter-restructure',
    'dtype-narrow',
    'dtype-widen',
    'load-pipeline-extend',
    'load-pipeline-shrink',
    'split',
    'merge',
    'noop',
  ]),
  /** Optional structured parameters per category. Free-form for now. */
  parameters: z.record(z.string(), z.unknown()).optional(),
  /** Human-readable description. */
  description: z.string().optional(),
}).strict();
export type CodeTransformation = z.infer<typeof CodeTransformationSchema>;

/**
 * Observed performance after applying a transformation. All fields optional
 * because real-world telemetry is partial: a verification step may produce
 * correctness without timing; a benchmark may produce latency without
 * bandwidth measurement.
 */
export const ObservedPerformanceSchema = z.object({
  latencyMicros: z.number().nonnegative().optional(),
  throughputTflops: z.number().nonnegative().optional(),
  memoryBandwidthGbps: z.number().nonnegative().optional(),
  vramUsageMb: z.number().nonnegative().optional(),
  correctnessScore: z.number().min(0).max(1).optional(),
  /** Verification methodology used (per SC-VER discipline). */
  verificationMethod: z.enum([
    'fixed-input',
    'randomized-fuzz',
    'robust-kbench-style',
    'reference-comparison',
    'unverified',
  ]).optional(),
}).strict();
export type ObservedPerformance = z.infer<typeof ObservedPerformanceSchema>;

/**
 * The full JEPA-bootstrap tuple: (state, action, performance). Plus envelope
 * metadata (id / timestamp / source).
 */
export const MegakernelTraceEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.number().int().min(0),
  source: z.string().min(1),
  state: ComputeGraphStateSchema,
  transformation: CodeTransformationSchema.optional(),
  performance: ObservedPerformanceSchema.optional(),
}).strict();
export type MegakernelTraceEvent = z.infer<typeof MegakernelTraceEventSchema>;

// ============================================================================
// Result envelopes.
// ============================================================================

export interface RecordResult {
  recorded: boolean;
  disabled: boolean;
  errors: ReadonlyArray<string>;
  bytesWritten: number;
}

const DISABLED_RECORD_RESULT: RecordResult = Object.freeze({
  recorded: false,
  disabled: true,
  errors: Object.freeze([]) as ReadonlyArray<string>,
  bytesWritten: 0,
});

export interface ReadResult {
  events: ReadonlyArray<MegakernelTraceEvent>;
  disabled: boolean;
  errors: ReadonlyArray<string>;
}

const DISABLED_READ_RESULT: ReadResult = Object.freeze({
  events: Object.freeze([]) as ReadonlyArray<MegakernelTraceEvent>,
  disabled: true,
  errors: Object.freeze([]) as ReadonlyArray<string>,
});

// ============================================================================
// Public surface.
// ============================================================================

/**
 * Append a single megakernel-trace event to the JSONL ledger at `ledgerPath`.
 *
 * When the substrate flag is off, returns the disabled-result sentinel and
 * writes nothing. When on, validates against `MegakernelTraceEventSchema` and
 * appends one line of newline-delimited JSON.
 */
export function record(
  event: unknown,
  ledgerPath: string,
  settingsPath?: string,
): RecordResult {
  if (!isMegakernelTraceEnabled(settingsPath)) {
    return DISABLED_RECORD_RESULT;
  }
  const parsed = MegakernelTraceEventSchema.safeParse(event);
  if (!parsed.success) {
    return {
      recorded: false,
      disabled: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.length ? i.path.join('.') : '<root>'}: ${i.message}`,
      ),
      bytesWritten: 0,
    };
  }
  try {
    const line = `${JSON.stringify(parsed.data)}\n`;
    const dir = path.dirname(ledgerPath);
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(ledgerPath, line, 'utf8');
    return {
      recorded: true,
      disabled: false,
      errors: [],
      bytesWritten: Buffer.byteLength(line, 'utf8'),
    };
  } catch (e) {
    return {
      recorded: false,
      disabled: false,
      errors: [`append failed: ${(e as Error).message}`],
      bytesWritten: 0,
    };
  }
}

/**
 * Read all megakernel-trace events from a JSONL ledger. Returns events in
 * file order (append order). When the flag is off, returns the disabled-read
 * sentinel without inspecting the ledger. Malformed lines produce per-line
 * errors but do not throw.
 */
export function read(
  ledgerPath: string,
  settingsPath?: string,
): ReadResult {
  if (!isMegakernelTraceEnabled(settingsPath)) {
    return DISABLED_READ_RESULT;
  }
  if (!fs.existsSync(ledgerPath)) {
    return { events: [], disabled: false, errors: [] };
  }
  let raw: string;
  try {
    raw = fs.readFileSync(ledgerPath, 'utf8');
  } catch (e) {
    return { events: [], disabled: false, errors: [`read failed: ${(e as Error).message}`] };
  }
  const events: MegakernelTraceEvent[] = [];
  const errors: string[] = [];
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.length === 0) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      errors.push(`line ${i + 1}: malformed JSON (${(e as Error).message})`);
      continue;
    }
    const validated = MegakernelTraceEventSchema.safeParse(parsed);
    if (!validated.success) {
      errors.push(
        `line ${i + 1}: ${validated.error.issues
          .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
          .join('; ')}`,
      );
      continue;
    }
    events.push(validated.data);
  }
  return { events, disabled: false, errors };
}

/**
 * Make a deterministic event ID from (timestamp, source, kernelId). Useful
 * when emitters need stable IDs for replay testing without depending on UUIDs.
 */
export function makeEventId(
  timestamp: number,
  source: string,
  kernelId: string,
): string {
  return `mk-trace-${timestamp.toString(36)}-${source}-${kernelId}`;
}

/**
 * Schema version. Bump on non-backward-compatible changes to the event shape.
 */
export const MEGAKERNEL_TRACE_SCHEMA_VERSION = '1.0.0' as const;
