/**
 * HB-01 — Instruction-tensor schema tests (v1.49.574 Half B, T1).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  InstructionTensor,
  InstructionTensorSchema,
  InstructionOpcodeSchema,
  CounterRefSchema,
  InstructionOperandSchema,
  InstructionSchema,
  validateInstructionTensor,
  serializeInstructionTensor,
  parseInstructionTensor,
  INSTRUCTION_TENSOR_SCHEMA_VERSION,
} from '../instruction-tensor-schema.js';

// ---- helpers ---------------------------------------------------------------

function makeOptInConfig(): unknown {
  return {
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'instruction-tensor-schema': { enabled: true },
      },
    },
  };
}

function makeOptOutConfig(): unknown {
  return {
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'instruction-tensor-schema': { enabled: false },
      },
    },
  };
}

function withTempConfig(config: unknown): { path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'mk-it-schema-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify(config));
  return {
    path: configPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function validTensor(): InstructionTensor {
  return {
    version: '1.0.0',
    hardwareTarget: 'ada-lovelace-ad106',
    modelName: 'qwen3-8b-q4_k_m',
    declaredTensors: [
      { name: 'input', role: 'input', dtype: 'fp16' },
      { name: 'mlp_w1', role: 'weight', dtype: 'q4_k_m' },
      { name: 'mlp_w2', role: 'weight', dtype: 'q4_k_m' },
      { name: 'output', role: 'output', dtype: 'fp16' },
    ],
    declaredCounters: [
      { name: 'mlp_up_done', initialValue: 0 },
      { name: 'mlp_down_done', initialValue: 0 },
    ],
    instructions: [
      {
        id: 'mlp_up',
        opcode: 'matmul',
        operands: [
          { kind: 'tensor', name: 'input', role: 'input' },
          { kind: 'tensor', name: 'mlp_w1', role: 'weight' },
        ],
        incrementsCounter: { name: 'mlp_up_done', target: 1 },
        warpRole: 'producer',
      },
      {
        id: 'mlp_down',
        opcode: 'matmul',
        operands: [
          { kind: 'tensor', name: 'mlp_w2', role: 'weight' },
          { kind: 'tensor', name: 'output', role: 'output' },
        ],
        waitsFor: [{ name: 'mlp_up_done', target: 1 }],
        incrementsCounter: { name: 'mlp_down_done', target: 1 },
        warpRole: 'consumer',
      },
    ],
  };
}

// ---- schema-shape tests ----------------------------------------------------

describe('HB-01 InstructionOpcodeSchema', () => {
  it('accepts every canonical opcode', () => {
    const cases = [
      'noop', 'matmul', 'matmul-tiled', 'layer-norm', 'rms-norm',
      'attention', 'attention-flash', 'softmax', 'gelu', 'silu',
      'add', 'mul', 'reduce-scatter', 'all-reduce',
      'load-weights', 'store', 'barrier', 'host-callback',
    ];
    for (const o of cases) {
      expect(InstructionOpcodeSchema.safeParse(o).success).toBe(true);
    }
  });
  it('rejects unknown opcode', () => {
    expect(InstructionOpcodeSchema.safeParse('bogus').success).toBe(false);
  });
});

describe('HB-01 CounterRefSchema', () => {
  it('accepts a valid counter reference', () => {
    expect(CounterRefSchema.safeParse({ name: 'c1', target: 1 }).success).toBe(true);
  });
  it('rejects empty name', () => {
    expect(CounterRefSchema.safeParse({ name: '', target: 1 }).success).toBe(false);
  });
  it('rejects non-positive target', () => {
    expect(CounterRefSchema.safeParse({ name: 'c1', target: 0 }).success).toBe(false);
    expect(CounterRefSchema.safeParse({ name: 'c1', target: -1 }).success).toBe(false);
  });
});

describe('HB-01 InstructionOperandSchema', () => {
  it('accepts a tensor operand', () => {
    expect(InstructionOperandSchema.safeParse({ kind: 'tensor', name: 't' }).success).toBe(true);
  });
  it('accepts a scalar operand', () => {
    expect(InstructionOperandSchema.safeParse({ kind: 'scalar', value: 1.5 }).success).toBe(true);
  });
  it('rejects scalar with non-finite value', () => {
    expect(InstructionOperandSchema.safeParse({ kind: 'scalar', value: Number.NaN }).success).toBe(false);
    expect(InstructionOperandSchema.safeParse({ kind: 'scalar', value: Number.POSITIVE_INFINITY }).success).toBe(false);
  });
  it('rejects unknown kind', () => {
    expect(InstructionOperandSchema.safeParse({ kind: 'mystery', name: 't' }).success).toBe(false);
  });
});

describe('HB-01 InstructionSchema', () => {
  it('accepts a minimal instruction', () => {
    expect(InstructionSchema.safeParse({
      id: 'i', opcode: 'noop', operands: [],
    }).success).toBe(true);
  });
  it('accepts a full-featured instruction', () => {
    expect(InstructionSchema.safeParse({
      id: 'i',
      opcode: 'matmul',
      operands: [{ kind: 'tensor', name: 't' }],
      incrementsCounter: { name: 'c', target: 1 },
      waitsFor: [{ name: 'c0', target: 1 }],
      warpRole: 'producer',
      tileShape: [16, 16, 64],
      comment: 'tile-major',
    }).success).toBe(true);
  });
  it('rejects empty id', () => {
    expect(InstructionSchema.safeParse({
      id: '', opcode: 'noop', operands: [],
    }).success).toBe(false);
  });
});

describe('HB-01 InstructionTensorSchema', () => {
  it('accepts the canonical valid tensor', () => {
    expect(InstructionTensorSchema.safeParse(validTensor()).success).toBe(true);
  });
  it('rejects malformed version', () => {
    const t = validTensor();
    (t as unknown as { version: string }).version = 'v1';
    expect(InstructionTensorSchema.safeParse(t).success).toBe(false);
  });
  it('rejects unknown dtype', () => {
    const t = validTensor() as unknown as { declaredTensors: Array<{ dtype: string }> };
    t.declaredTensors[0].dtype = 'magic';
    expect(InstructionTensorSchema.safeParse(t).success).toBe(false);
  });
});

// ---- validateInstructionTensor (opt-in / opt-out / structural) ------------

describe('HB-01 validateInstructionTensor — opt-out', () => {
  it('returns disabled-result when config missing', () => {
    const r = validateInstructionTensor(validTensor(), '/nonexistent/path.json');
    expect(r.valid).toBe(true);
    expect(r.disabled).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([]);
  });
  it('returns disabled-result when flag is off', () => {
    const c = withTempConfig(makeOptOutConfig());
    try {
      const r = validateInstructionTensor(validTensor(), c.path);
      expect(r.disabled).toBe(true);
      expect(r.valid).toBe(true);
    } finally { c.cleanup(); }
  });
  it('returns disabled-result on malformed config JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mk-it-bad-'));
    const claudeDir = join(dir, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const p = join(claudeDir, 'gsd-skill-creator.json');
    writeFileSync(p, '{ malformed');
    try {
      expect(validateInstructionTensor(validTensor(), p).disabled).toBe(true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe('HB-01 validateInstructionTensor — opt-in', () => {
  let cfg: { path: string; cleanup: () => void };
  beforeEach(() => { cfg = withTempConfig(makeOptInConfig()); });
  afterEach(() => { cfg.cleanup(); });

  it('passes the canonical valid tensor', () => {
    const r = validateInstructionTensor(validTensor(), cfg.path);
    expect(r.valid).toBe(true);
    expect(r.disabled).toBe(false);
    expect(r.errors).toEqual([]);
  });

  it('flags duplicate instruction ids', () => {
    const t = validTensor();
    t.instructions[1].id = t.instructions[0].id;
    const r = validateInstructionTensor(t, cfg.path);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('duplicate instruction id'))).toBe(true);
  });

  it('flags reference to undeclared tensor', () => {
    const t = validTensor();
    t.instructions[0].operands.push({ kind: 'tensor', name: 'phantom' });
    const r = validateInstructionTensor(t, cfg.path);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('undeclared tensor "phantom"'))).toBe(true);
  });

  it('flags increment of undeclared counter', () => {
    const t = validTensor();
    t.instructions[0].incrementsCounter = { name: 'phantom', target: 1 };
    const r = validateInstructionTensor(t, cfg.path);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('undeclared counter "phantom"'))).toBe(true);
  });

  it('flags wait on undeclared counter', () => {
    const t = validTensor();
    t.instructions[1].waitsFor = [{ name: 'phantom', target: 1 }];
    const r = validateInstructionTensor(t, cfg.path);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('waits on undeclared counter'))).toBe(true);
  });

  it('warns when instructions reference counters but no counters declared', () => {
    const t = validTensor();
    t.declaredCounters = [];
    const r = validateInstructionTensor(t, cfg.path);
    // errors expected due to undeclared counter refs, but the warning fires too
    expect(r.warnings.some((w) => w.includes('counters reference'))
      || r.warnings.some((w) => w.includes('no counters are declared'))
    ).toBe(true);
  });

  it('rejects malformed input via Zod surface', () => {
    const r = validateInstructionTensor({ junk: true }, cfg.path);
    expect(r.valid).toBe(false);
    expect(r.disabled).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('accepts an empty instruction list', () => {
    const t = validTensor();
    t.instructions = [];
    expect(validateInstructionTensor(t, cfg.path).valid).toBe(true);
  });
});

// ---- serialize / parse (round-trip) ---------------------------------------

describe('HB-01 serialize and parse', () => {
  it('round-trips the canonical tensor losslessly', () => {
    const original = validTensor();
    const json = serializeInstructionTensor(original);
    const parsed = parseInstructionTensor(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(JSON.parse(serializeInstructionTensor(parsed.tensor)))
        .toEqual(JSON.parse(json));
    }
  });

  it('serialize produces stable JSON', () => {
    const j1 = serializeInstructionTensor(validTensor());
    const j2 = serializeInstructionTensor(validTensor());
    expect(j1).toBe(j2);
  });

  it('parse returns ok:false on malformed JSON', () => {
    const r = parseInstructionTensor('{ broken');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes('malformed JSON'))).toBe(true);
    }
  });

  it('parse returns ok:false when shape fails', () => {
    const r = parseInstructionTensor(JSON.stringify({ version: 'bogus' }));
    expect(r.ok).toBe(false);
  });
});

// ---- version constant -----------------------------------------------------

describe('HB-01 schema version', () => {
  it('exposes a current schema version constant', () => {
    expect(INSTRUCTION_TENSOR_SCHEMA_VERSION).toBe('1.0.0');
  });
  it('schema version matches the regex used by the schema', () => {
    expect(/^\d+\.\d+(\.\d+)?$/.test(INSTRUCTION_TENSOR_SCHEMA_VERSION)).toBe(true);
  });
});
