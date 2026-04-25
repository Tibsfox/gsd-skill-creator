/**
 * HB-04 — LoRA-adapter-selection schema tests (v1.49.574 Half B, T2,
 * CAPCOM HARD PRESERVATION GATE).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AdapterDtypeSchema,
  AdapterEntrySchema,
  AdapterPoolSchema,
  AdapterBindingSchema,
  AdapterSelectionSchema,
  validateAdapterSelection,
  ADAPTER_SELECTION_SCHEMA_VERSION,
  type AdapterSelection,
} from '../adapter-selection-schema.js';
import type { InstructionTensor } from '../instruction-tensor-schema.js';

function withTempEnv(opts: {
  adapterSchema?: boolean;
  instructionTensor?: boolean;
} = {}): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'mk-adapter-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'adapter-selection-schema': { enabled: opts.adapterSchema ?? false },
        'instruction-tensor-schema': { enabled: opts.instructionTensor ?? false },
      },
    },
  }));
  return {
    configPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function validSelection(): AdapterSelection {
  return {
    pool: {
      vramBudgetMb: 200,
      maxResident: 4,
      adapters: [
        { id: 'code-py', rank: 16, vramFootprintMb: 50, dtype: 'fp16', role: 'code' },
        { id: 'code-rs', rank: 16, vramFootprintMb: 50, dtype: 'fp16', role: 'code' },
        { id: 'math', rank: 32, vramFootprintMb: 80, dtype: 'fp16', role: 'math' },
      ],
    },
    bindings: [
      { instructionId: 'mlp_up', adapterId: 'code-py' },
      { instructionId: 'mlp_down', adapterId: 'code-py' },
    ],
  };
}

function validInstructionTensor(): InstructionTensor {
  return {
    version: '1.0.0',
    hardwareTarget: 'ada-lovelace-ad106',
    modelName: 'qwen3-8b-q4_k_m',
    declaredTensors: [{ name: 'input', role: 'input', dtype: 'fp16' }],
    declaredCounters: [],
    instructions: [
      { id: 'mlp_up', opcode: 'matmul', operands: [] },
      { id: 'mlp_down', opcode: 'matmul', operands: [] },
    ],
  };
}

// ---- schema-shape tests ---------------------------------------------------

describe('HB-04 AdapterDtypeSchema', () => {
  it('accepts every documented dtype', () => {
    for (const d of ['fp16', 'bf16', 'fp32', 'int8', 'q4_k_m']) {
      expect(AdapterDtypeSchema.safeParse(d).success).toBe(true);
    }
  });
  it('rejects unknown dtype', () => {
    expect(AdapterDtypeSchema.safeParse('bogus').success).toBe(false);
  });
});

describe('HB-04 AdapterEntrySchema', () => {
  it('accepts a minimal valid adapter entry', () => {
    expect(AdapterEntrySchema.safeParse({
      id: 'a', rank: 16, vramFootprintMb: 50, dtype: 'fp16',
    }).success).toBe(true);
  });
  it('rejects rank out of range', () => {
    expect(AdapterEntrySchema.safeParse({
      id: 'a', rank: 0, vramFootprintMb: 50, dtype: 'fp16',
    }).success).toBe(false);
    expect(AdapterEntrySchema.safeParse({
      id: 'a', rank: 2048, vramFootprintMb: 50, dtype: 'fp16',
    }).success).toBe(false);
  });
  it('rejects negative VRAM footprint', () => {
    expect(AdapterEntrySchema.safeParse({
      id: 'a', rank: 16, vramFootprintMb: -1, dtype: 'fp16',
    }).success).toBe(false);
  });
});

describe('HB-04 AdapterPoolSchema', () => {
  it('rejects maxResident < 1', () => {
    expect(AdapterPoolSchema.safeParse({
      vramBudgetMb: 200, maxResident: 0,
      adapters: [{ id: 'a', rank: 1, vramFootprintMb: 1, dtype: 'fp16' }],
    }).success).toBe(false);
  });
  it('rejects empty adapter list', () => {
    expect(AdapterPoolSchema.safeParse({
      vramBudgetMb: 200, maxResident: 4, adapters: [],
    }).success).toBe(false);
  });
});

describe('HB-04 AdapterBindingSchema', () => {
  it('accepts a binding with optional scaling', () => {
    expect(AdapterBindingSchema.safeParse({
      instructionId: 'i', adapterId: 'a', scaling: 1.0,
    }).success).toBe(true);
  });
  it('rejects scaling NaN', () => {
    expect(AdapterBindingSchema.safeParse({
      instructionId: 'i', adapterId: 'a', scaling: Number.NaN,
    }).success).toBe(false);
  });
});

describe('HB-04 AdapterSelectionSchema', () => {
  it('accepts the canonical valid selection', () => {
    expect(AdapterSelectionSchema.safeParse(validSelection()).success).toBe(true);
  });
});

// ---- validateAdapterSelection — opt-out (CAPCOM hard preservation) -------

describe('HB-04 validateAdapterSelection — opt-out (hard preservation)', () => {
  it('returns disabled-result when config missing (byte-identical pre-574)', () => {
    const r = validateAdapterSelection(validSelection(), undefined, '/tmp/nope.json');
    expect(r.disabled).toBe(true);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.totalVramMb).toBe(0);
  });
  it('returns disabled-result when flag is off', () => {
    const env = withTempEnv({ adapterSchema: false });
    try {
      const r = validateAdapterSelection(validSelection(), undefined, env.configPath);
      expect(r.disabled).toBe(true);
    } finally { env.cleanup(); }
  });
});

// ---- validateAdapterSelection — opt-in -----------------------------------

describe('HB-04 validateAdapterSelection — opt-in', () => {
  let env: ReturnType<typeof withTempEnv>;
  beforeEach(() => { env = withTempEnv({ adapterSchema: true, instructionTensor: true }); });
  afterEach(() => { env.cleanup(); });

  it('passes the canonical valid selection', () => {
    const r = validateAdapterSelection(validSelection(), undefined, env.configPath);
    expect(r.valid).toBe(true);
    expect(r.disabled).toBe(false);
    expect(r.errors).toEqual([]);
    expect(r.totalVramMb).toBe(180);
    expect(r.uniqueBoundAdapters).toBe(1);
  });

  it('flags duplicate adapter ids', () => {
    const s = validSelection();
    s.pool.adapters[1].id = s.pool.adapters[0].id;
    const r = validateAdapterSelection(s, undefined, env.configPath);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('duplicate adapter id'))).toBe(true);
  });

  it('flags VRAM total exceeding budget', () => {
    const s = validSelection();
    s.pool.vramBudgetMb = 100;  // total is 180
    const r = validateAdapterSelection(s, undefined, env.configPath);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('exceeds declared budget'))).toBe(true);
  });

  it('flags binding to undeclared adapter', () => {
    const s = validSelection();
    s.bindings[0].adapterId = 'phantom';
    const r = validateAdapterSelection(s, undefined, env.configPath);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('undeclared adapter "phantom"'))).toBe(true);
  });

  it('flags too many distinct resident adapters', () => {
    const s = validSelection();
    s.pool.maxResident = 1;
    s.bindings = [
      { instructionId: 'i1', adapterId: 'code-py' },
      { instructionId: 'i2', adapterId: 'code-rs' },
    ];
    const r = validateAdapterSelection(s, undefined, env.configPath);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('maxResident is 1'))).toBe(true);
  });

  it('cross-checks against an instruction tensor when provided', () => {
    const s = validSelection();
    s.bindings.push({ instructionId: 'phantom', adapterId: 'code-py' });
    const r = validateAdapterSelection(s, validInstructionTensor(), env.configPath);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('undeclared instruction "phantom"'))).toBe(true);
  });

  it('skips cross-check when bound tensor is itself invalid', () => {
    const s = validSelection();
    const t = validInstructionTensor();
    // Force the tensor to fail its own validation.
    (t as unknown as { instructions: unknown[] }).instructions[0] = { id: '', opcode: 'matmul', operands: [] };
    const r = validateAdapterSelection(s, t, env.configPath);
    // Selection itself is fine; tensor cross-check is skipped with a warning.
    expect(r.warnings.some((w) => w.includes('cross-check skipped'))).toBe(true);
  });

  it('warns when budget is much larger than total', () => {
    const s = validSelection();
    s.pool.vramBudgetMb = 100000;  // huge budget; total still 180
    const r = validateAdapterSelection(s, undefined, env.configPath);
    expect(r.warnings.some((w) => w.includes('< 10%'))).toBe(true);
  });

  it('rejects malformed input via Zod', () => {
    const r = validateAdapterSelection({ junk: true }, undefined, env.configPath);
    expect(r.valid).toBe(false);
    expect(r.disabled).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('HB-04 schema version', () => {
  it('exposes a current schema version', () => {
    expect(ADAPTER_SELECTION_SCHEMA_VERSION).toBe('1.0.0');
  });
});
