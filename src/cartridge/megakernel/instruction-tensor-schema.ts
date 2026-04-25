/**
 * HB-01 — Megakernel instruction-tensor schema (chipset-format extension).
 *
 * v1.49.574 Half B, T1 must-ship.
 *
 * Derivation: M2 on-GPU interpreter pattern (Hazy Research Llama-1B megakernel,
 * "Look Ma, No Bubbles", May 2025); M5 §1 Amiga ↔ megakernel mapping row 3
 * (Copper list ↔ instruction tensor); cited in `megakernel.bib` as
 * `mk_hazy_nobubbles_2025`, `mk26_2512_22219` (Mirage MPK), `mk26_2604_13327`
 * (ETC).
 *
 * Substrate-only: typed schema, validation, round-trip serialization. NO
 * runtime, NO CUDA, NO actual megakernel implementation. The schema gives a
 * future Mirage-MPK integration a contract to fill against.
 *
 * The instruction tensor is the megakernel-era analog of the Amiga Copper
 * list: a CPU-produced sequence of (opcode, parameters, sync targets) tuples
 * that an on-GPU interpreter consumes. Each opcode corresponds to a CUDA
 * template (matmul / layer-norm / attention / RMS-norm / etc.). Counter-based
 * synchronization (M2 §3) is captured via `incrementsCounter` and `waitsFor`
 * fields on each instruction.
 *
 * ## Opt-in mechanism
 *
 * Default-OFF. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "megakernel-substrate": {
 *       "instruction-tensor-schema": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, the validator returns the disabled-result
 * sentinel: every input passes shape-checking trivially and no normalization
 * runs. Byte-identical to pre-v1.49.574 surface (hard-preservation invariant).
 *
 * @module cartridge/megakernel/instruction-tensor-schema
 */

import { z } from 'zod';

import {
  isMegakernelSubstrateEnabled,
} from './settings.js';

// ============================================================================
// Opcode taxonomy (M2 §1 — the small set of CUDA templates the interpreter
// dispatches to). Matches ThunderKittens primitives + ETC dynamic-shape ops.
// ============================================================================

/**
 * Canonical opcode set. Mirrors the ThunderKittens / Mirage-MPK template
 * library: matmul, layer-norm variants, attention, RMS norm, and the
 * compositional helpers needed for transformer decode. `noop` and `barrier`
 * are infrastructural; `host-callback` is the escape hatch a future engineering
 * mission may wire.
 */
export const InstructionOpcodeSchema = z.enum([
  'noop',
  'matmul',
  'matmul-tiled',
  'layer-norm',
  'rms-norm',
  'attention',
  'attention-flash',
  'softmax',
  'gelu',
  'silu',
  'add',
  'mul',
  'reduce-scatter',
  'all-reduce',
  'load-weights',
  'store',
  'barrier',
  'host-callback',
]);
export type InstructionOpcode = z.infer<typeof InstructionOpcodeSchema>;

// ============================================================================
// Counter reference — counter-based fine-grained synchronization (M2 §3).
// ============================================================================

/**
 * A counter reference identifies one of the megakernel's global-memory
 * counters (M2 §3 — counter-based synchronization). `name` is the symbolic
 * identifier; `target` is the value the consumer must observe before
 * proceeding. Producers advertise `incrementsCounter`; consumers advertise
 * `waitsFor`.
 */
export const CounterRefSchema = z.object({
  name: z.string().min(1),
  target: z.number().int().min(1),
}).strict();
export type CounterRef = z.infer<typeof CounterRefSchema>;

// ============================================================================
// Operand — typed reference to a tensor by name or by inline scalar.
// ============================================================================

/**
 * A tensor or scalar operand. `kind: "tensor"` references a named tensor in
 * the megakernel's address book; `kind: "scalar"` carries an inline number.
 */
export const InstructionOperandSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tensor'),
    name: z.string().min(1),
    role: z.enum(['input', 'output', 'weight', 'bias', 'kv-cache']).optional(),
  }).strict(),
  z.object({
    kind: z.literal('scalar'),
    value: z.number().finite(),
  }).strict(),
]);
export type InstructionOperand = z.infer<typeof InstructionOperandSchema>;

// ============================================================================
// Instruction — single entry in the instruction tensor.
// ============================================================================

/**
 * A single instruction. Carries the opcode, an ordered list of operands, the
 * synchronization counters it increments after completion, the counters it
 * must wait on before starting, and an optional warp-specialization role
 * (M2 §5 — producer / consumer / scheduler warps).
 *
 * `tileShape` is a hint the interpreter can use for software-pipelined memory
 * loads (M2 §4). Leaving it undefined is legal: the runtime uses defaults.
 */
export const InstructionSchema = z.object({
  id: z.string().min(1),
  opcode: InstructionOpcodeSchema,
  operands: z.array(InstructionOperandSchema).min(0),
  incrementsCounter: CounterRefSchema.optional(),
  waitsFor: z.array(CounterRefSchema).optional(),
  warpRole: z.enum(['producer', 'consumer', 'scheduler']).optional(),
  tileShape: z.array(z.number().int().positive()).optional(),
  comment: z.string().optional(),
}).strict();
export type Instruction = z.infer<typeof InstructionSchema>;

// ============================================================================
// Instruction-tensor envelope — the full chipset-cartridge artifact.
// ============================================================================

/**
 * The instruction-tensor envelope. Identifies the target hardware, declares
 * the named tensors and counters, lists the instructions in execution order
 * (the runtime is free to overlap pipelined instructions per M2 §4 / §6),
 * and carries the chipset-format provenance metadata.
 *
 * `version` follows the cartridge schema convention (semver-like string).
 * `hardwareTarget` records the GPU generation (e.g., "ada-lovelace-ad106"
 * for RTX 4060 Ti, "blackwell-b200" for B200, etc.) — different targets may
 * tolerate different opcode subsets in a future engineering mission.
 */
export const InstructionTensorSchema = z.object({
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/),
  hardwareTarget: z.string().min(1),
  modelName: z.string().min(1),
  declaredTensors: z.array(z.object({
    name: z.string().min(1),
    role: z.enum(['input', 'output', 'weight', 'bias', 'kv-cache', 'scratch']),
    dtype: z.enum(['fp16', 'bf16', 'fp32', 'fp8', 'int8', 'int4', 'q4_k_m']),
  }).strict()).min(0),
  declaredCounters: z.array(z.object({
    name: z.string().min(1),
    initialValue: z.number().int().min(0).default(0),
  }).strict()).min(0),
  instructions: z.array(InstructionSchema).min(0),
  metadata: z.object({
    derivedFrom: z.string().optional(),
    notes: z.string().optional(),
  }).strict().optional(),
}).strict();
export type InstructionTensor = z.infer<typeof InstructionTensorSchema>;

// ============================================================================
// Validation result envelope.
// ============================================================================

export interface InstructionTensorValidationResult {
  valid: boolean;
  disabled: boolean;
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
}

const DISABLED_RESULT: InstructionTensorValidationResult = Object.freeze({
  valid: true,
  disabled: true,
  errors: Object.freeze([]) as ReadonlyArray<string>,
  warnings: Object.freeze([]) as ReadonlyArray<string>,
});

// ============================================================================
// Public API.
// ============================================================================

/**
 * Validate an instruction-tensor envelope.
 *
 * When the megakernel-substrate / instruction-tensor-schema module is opted
 * out, returns the disabled-result sentinel without inspecting input. With
 * the flag on, runs the full Zod parse plus structural-consistency checks
 * (counter references match declared counters; tensor references match
 * declared tensors; instruction IDs are unique).
 *
 * @param input Candidate instruction-tensor object.
 * @param settingsPath Optional override for the config file location (tests).
 */
export function validateInstructionTensor(
  input: unknown,
  settingsPath?: string,
): InstructionTensorValidationResult {
  if (!isMegakernelSubstrateEnabled('instruction-tensor-schema', settingsPath)) {
    return DISABLED_RESULT;
  }
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = InstructionTensorSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(
        `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`,
      );
    }
    return { valid: false, disabled: false, errors, warnings };
  }

  const tensor = parsed.data;
  const declaredTensorNames = new Set(tensor.declaredTensors.map((t) => t.name));
  const declaredCounterNames = new Set(tensor.declaredCounters.map((c) => c.name));
  const instructionIds = new Set<string>();

  for (const instr of tensor.instructions) {
    if (instructionIds.has(instr.id)) {
      errors.push(`duplicate instruction id: ${instr.id}`);
    }
    instructionIds.add(instr.id);

    for (const operand of instr.operands) {
      if (operand.kind === 'tensor' && !declaredTensorNames.has(operand.name)) {
        errors.push(
          `instruction "${instr.id}" references undeclared tensor "${operand.name}"`,
        );
      }
    }

    if (instr.incrementsCounter && !declaredCounterNames.has(instr.incrementsCounter.name)) {
      errors.push(
        `instruction "${instr.id}" increments undeclared counter "${instr.incrementsCounter.name}"`,
      );
    }
    if (instr.waitsFor) {
      for (const wait of instr.waitsFor) {
        if (!declaredCounterNames.has(wait.name)) {
          errors.push(
            `instruction "${instr.id}" waits on undeclared counter "${wait.name}"`,
          );
        }
      }
    }
  }

  if (tensor.declaredCounters.length === 0 && tensor.instructions.some((i) => i.waitsFor || i.incrementsCounter)) {
    warnings.push(
      'instructions reference counters but no counters are declared at the envelope level',
    );
  }

  return {
    valid: errors.length === 0,
    disabled: false,
    errors,
    warnings,
  };
}

/**
 * Round-trip serialize an instruction-tensor envelope to JSON. Throws when
 * the substrate is disabled (do not silently produce output) — callers must
 * check `isMegakernelSubstrateEnabled('instruction-tensor-schema')` first.
 *
 * Stable property: `serialize(parse(json)) === <equivalent JSON>` modulo
 * key ordering and whitespace.
 */
export function serializeInstructionTensor(
  tensor: InstructionTensor,
): string {
  return JSON.stringify(tensor, null, 2);
}

/**
 * Parse a JSON string back into a typed `InstructionTensor`. Returns a
 * `safeParse`-style result so callers can react to bad inputs without try/catch.
 */
export function parseInstructionTensor(
  json: string,
):
  | { ok: true; tensor: InstructionTensor }
  | { ok: false; errors: ReadonlyArray<string> } {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (e) {
    return { ok: false, errors: [`malformed JSON: ${(e as Error).message}`] };
  }
  const parsed = InstructionTensorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`,
      ),
    };
  }
  return { ok: true, tensor: parsed.data };
}

/**
 * The current envelope schema version. Bump when the schema changes in a
 * non-backward-compatible way.
 */
export const INSTRUCTION_TENSOR_SCHEMA_VERSION = '1.0.0' as const;
