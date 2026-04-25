/**
 * HB-04 — LoRA-adapter-selection schema (instruction-tensor parameter form).
 *
 * v1.49.574 Half B, T2 if-budget. **CAPCOM HARD PRESERVATION GATE.**
 *
 * Derivation: M5 §2 ("adapter selection becomes an instruction-tensor
 * parameter, not a separate kernel"); ThunderKittens parameterized templates;
 * Mirage MPK SM-level dispatch. Cited in `megakernel.bib` as
 * `mk_hazy_nobubbles_2025`, `mk26_2512_22219`, `mk_thunderkittens`.
 *
 * Substrate-only: schema for declaring an adapter pool, a binding from
 * instruction → adapter, and validation that the binding is internally
 * coherent against an `InstructionTensor`. NO adapter-aware matmul template
 * implementation — that's Stage 2 engineering work, explicitly out of scope
 * per M5 §6 (the candidate's substrate-boundary check).
 *
 * ## CAPCOM HARD PRESERVATION GATE
 *
 * Adapter selection constrains skill-space organization (how the orchestrator
 * routes skills to chipsets / which adapter set is resident at any point).
 * This module ships **default-OFF** with byte-identical surface to
 * pre-v1.49.574. Activating it (writing `enabled: true` in the substrate
 * config) is a deliberate operator decision; CAPCOM sign-off recorded in
 * `.planning/missions/megakernel-one-launch-one-chipset/work/capcom_gates.json`
 * is a prerequisite for any code path that consumes this schema.
 *
 * ## Opt-in mechanism
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "megakernel-substrate": {
 *       "adapter-selection-schema": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * @module cartridge/megakernel/adapter-selection-schema
 */

import { z } from 'zod';

import { isMegakernelSubstrateEnabled } from './settings.js';
import {
  validateInstructionTensor,
  type InstructionTensor,
} from './instruction-tensor-schema.js';

// ============================================================================
// Adapter pool — a declared set of LoRA adapters resident in VRAM at
// inference time. The 4060 Ti reference platform's M5 §4 envelope budgets
// 200 MB across 3-4 hot adapters; the schema validates the count and total
// budget.
// ============================================================================

export const AdapterDtypeSchema = z.enum(['fp16', 'bf16', 'fp32', 'int8', 'q4_k_m']);
export type AdapterDtype = z.infer<typeof AdapterDtypeSchema>;

export const AdapterEntrySchema = z.object({
  /** Adapter identifier (referenced by `instructionBindings`). */
  id: z.string().min(1),
  /** LoRA rank. Typical range 4-64. */
  rank: z.number().int().min(1).max(1024),
  /** Memory footprint in megabytes. */
  vramFootprintMb: z.number().nonnegative(),
  /** Quantization / storage dtype. */
  dtype: AdapterDtypeSchema,
  /** Optional human-readable role. */
  role: z.string().optional(),
}).strict();
export type AdapterEntry = z.infer<typeof AdapterEntrySchema>;

export const AdapterPoolSchema = z.object({
  /** Total VRAM budget for the resident adapter set, in MB. */
  vramBudgetMb: z.number().positive(),
  /** Maximum simultaneous resident adapters. M5 §4 cites 3-4 on 4060 Ti. */
  maxResident: z.number().int().min(1).max(64),
  /** Adapters declared in this pool. */
  adapters: z.array(AdapterEntrySchema).min(1),
}).strict();
export type AdapterPool = z.infer<typeof AdapterPoolSchema>;

// ============================================================================
// Instruction → adapter binding. The schema mirrors the M5 §2 conclusion:
// the adapter-id is a parameter on the instruction, not a property of a
// distinct kernel.
// ============================================================================

export const AdapterBindingSchema = z.object({
  /** Instruction id (must exist in the bound `InstructionTensor`). */
  instructionId: z.string().min(1),
  /** Adapter id (must exist in the bound `AdapterPool`). */
  adapterId: z.string().min(1),
  /** Optional scaling factor applied to the adapter delta. */
  scaling: z.number().finite().optional(),
}).strict();
export type AdapterBinding = z.infer<typeof AdapterBindingSchema>;

export const AdapterSelectionSchema = z.object({
  pool: AdapterPoolSchema,
  bindings: z.array(AdapterBindingSchema).min(0),
}).strict();
export type AdapterSelection = z.infer<typeof AdapterSelectionSchema>;

// ============================================================================
// Validation result.
// ============================================================================

export interface AdapterSelectionValidationResult {
  valid: boolean;
  disabled: boolean;
  errors: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  /** Total VRAM consumed by the declared adapters, MB. */
  totalVramMb: number;
  /** Number of unique adapters referenced by bindings. */
  uniqueBoundAdapters: number;
}

const DISABLED_RESULT: AdapterSelectionValidationResult = Object.freeze({
  valid: true,
  disabled: true,
  errors: Object.freeze([]) as ReadonlyArray<string>,
  warnings: Object.freeze([]) as ReadonlyArray<string>,
  totalVramMb: 0,
  uniqueBoundAdapters: 0,
});

// ============================================================================
// Public API.
// ============================================================================

/**
 * Validate an `AdapterSelection` and (optionally) cross-check against an
 * `InstructionTensor`. Returns the disabled-result sentinel when the substrate
 * flag is off (CAPCOM hard-preservation invariant).
 *
 * Internal checks when enabled:
 *   - schema parse (Zod)
 *   - adapter ids are unique within the pool
 *   - binding adapter-ids reference declared adapters
 *   - if `instructionTensor` provided: binding instruction-ids reference
 *     declared instructions
 *   - total vramFootprintMb ≤ pool.vramBudgetMb
 *   - distinct adapters in bindings ≤ pool.maxResident
 *
 * @param input candidate adapter-selection object
 * @param instructionTensor optional bound instruction tensor for cross-check
 * @param settingsPath optional config-file override (tests)
 */
export function validateAdapterSelection(
  input: unknown,
  instructionTensor?: InstructionTensor,
  settingsPath?: string,
): AdapterSelectionValidationResult {
  if (!isMegakernelSubstrateEnabled('adapter-selection-schema', settingsPath)) {
    return DISABLED_RESULT;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let totalVramMb = 0;
  let uniqueBoundAdapters = 0;

  const parsed = AdapterSelectionSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(
        `${issue.path.length ? issue.path.join('.') : '<root>'}: ${issue.message}`,
      );
    }
    return { valid: false, disabled: false, errors, warnings, totalVramMb, uniqueBoundAdapters };
  }

  const { pool, bindings } = parsed.data;
  totalVramMb = pool.adapters.reduce((acc, a) => acc + a.vramFootprintMb, 0);

  // Adapter-id uniqueness within the pool.
  const adapterIds = new Set<string>();
  for (const a of pool.adapters) {
    if (adapterIds.has(a.id)) errors.push(`duplicate adapter id: ${a.id}`);
    adapterIds.add(a.id);
  }

  // VRAM budget.
  if (totalVramMb > pool.vramBudgetMb) {
    errors.push(
      `adapter pool VRAM total ${totalVramMb} MB exceeds declared budget ${pool.vramBudgetMb} MB`,
    );
  }

  // Binding integrity.
  const boundAdapterIds = new Set<string>();
  for (const b of bindings) {
    if (!adapterIds.has(b.adapterId)) {
      errors.push(`binding for "${b.instructionId}" references undeclared adapter "${b.adapterId}"`);
    }
    boundAdapterIds.add(b.adapterId);
  }
  uniqueBoundAdapters = boundAdapterIds.size;
  if (uniqueBoundAdapters > pool.maxResident) {
    errors.push(
      `bindings reference ${uniqueBoundAdapters} distinct adapters but maxResident is ${pool.maxResident}`,
    );
  }

  // Cross-check against bound instruction tensor.
  if (instructionTensor) {
    const tensorCheck = validateInstructionTensor(instructionTensor, settingsPath);
    if (!tensorCheck.disabled && !tensorCheck.valid) {
      warnings.push(
        'adapter-selection cross-check skipped: bound instruction-tensor failed its own validation',
      );
    } else if (!tensorCheck.disabled) {
      const instructionIds = new Set(instructionTensor.instructions.map((i) => i.id));
      for (const b of bindings) {
        if (!instructionIds.has(b.instructionId)) {
          errors.push(
            `binding references undeclared instruction "${b.instructionId}"`,
          );
        }
      }
    }
  }

  if (uniqueBoundAdapters === 0 && bindings.length > 0) {
    warnings.push('all bindings reference unknown adapters');
  }
  if (totalVramMb > 0 && totalVramMb < pool.vramBudgetMb * 0.1) {
    warnings.push('adapter pool uses < 10% of declared VRAM budget; consider tightening the budget');
  }

  return {
    valid: errors.length === 0,
    disabled: false,
    errors,
    warnings,
    totalVramMb,
    uniqueBoundAdapters,
  };
}

/**
 * Schema version. Bump on non-backward-compatible changes.
 */
export const ADAPTER_SELECTION_SCHEMA_VERSION = '1.0.0' as const;
