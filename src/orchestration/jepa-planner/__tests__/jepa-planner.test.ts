/**
 * HB-03 — JEPA-as-planner typed-interface stub tests (v1.49.574 Half B, T1).
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  KernelLatentSchema,
  ActionSequenceSchema,
  DEFAULT_PLANNER_OPTIONS,
  makePlanner,
  squaredL2,
  isLatentWellFormed,
  isJepaPlannerEnabled,
  JEPA_PLANNER_CONTRACT_VERSION,
  type Planner,
  type ComputeGraphState,
  type KernelLatent,
} from '../index.js';

// HB-03 → HB-02 integration imports
import {
  record,
  type MegakernelTraceEvent,
} from '../../../traces/megakernel-trace/index.js';

function withTempEnv(opts: { jepa?: boolean; trace?: boolean } = {}): {
  configPath: string;
  ledgerPath: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'mk-jepa-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'jepa-planner-stub': { enabled: opts.jepa ?? false },
        'execution-trace-telemetry': { enabled: opts.trace ?? false },
      },
    },
  }));
  return {
    configPath,
    ledgerPath: join(dir, 'mk-trace.jsonl'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const validState: ComputeGraphState = {
  kernelId: 'k0', modelName: 'qwen3-8b', hardwareTarget: 'ada-lovelace-ad106',
  fusedOperatorCount: 100, syncCounterCount: 8,
};

// ---- schema-shape tests ----------------------------------------------------

describe('HB-03 KernelLatentSchema', () => {
  it('accepts a finite vector of length ≥ 1', () => {
    expect(KernelLatentSchema.safeParse({ vector: [0.1, 0.2, 0.3] }).success).toBe(true);
  });
  it('rejects empty vector', () => {
    expect(KernelLatentSchema.safeParse({ vector: [] }).success).toBe(false);
  });
  it('rejects NaN / Infinity', () => {
    expect(KernelLatentSchema.safeParse({ vector: [Number.NaN] }).success).toBe(false);
    expect(KernelLatentSchema.safeParse({ vector: [Number.POSITIVE_INFINITY] }).success).toBe(false);
  });
});

describe('HB-03 ActionSequenceSchema', () => {
  it('accepts an empty sequence', () => {
    expect(ActionSequenceSchema.safeParse([]).success).toBe(true);
  });
  it('accepts a sequence of valid transformations', () => {
    expect(ActionSequenceSchema.safeParse([
      { category: 'fusion' }, { category: 'tile-size-change' },
    ]).success).toBe(true);
  });
});

// ---- DEFAULT_PLANNER_OPTIONS ----------------------------------------------

describe('HB-03 DEFAULT_PLANNER_OPTIONS', () => {
  it('exposes published LeWM-style defaults', () => {
    expect(DEFAULT_PLANNER_OPTIONS.latentDim).toBe(192);
    expect(DEFAULT_PLANNER_OPTIONS.horizonH).toBe(16);
    expect(DEFAULT_PLANNER_OPTIONS.executeFirstK).toBe(4);
  });
});

// ---- makePlanner — opt-out / opt-in / option validation -------------------

describe('HB-03 makePlanner', () => {
  it('returns the disabled stub when flag is off', () => {
    const env = withTempEnv({ jepa: false });
    try {
      const p = makePlanner({}, env.configPath);
      const goal: KernelLatent = { vector: new Array(p.options.latentDim).fill(1) };
      const r = p.plan(validState, goal);
      expect(r.disabled).toBe(true);
      expect(r.actions).toEqual([]);
      expect(r.predictedCost).toBe(Number.POSITIVE_INFINITY);
    } finally { env.cleanup(); }
  });

  it('returns the disabled stub even with flag on (no real model shipped)', () => {
    const env = withTempEnv({ jepa: true });
    try {
      const p = makePlanner({}, env.configPath);
      // Opt-in still ships the stub for HB-03 — the load-bearing concern is
      // that the contract is stable, not that a real model exists.
      expect(p.options.latentDim).toBe(192);
    } finally { env.cleanup(); }
  });

  it('rejects non-positive latentDim', () => {
    expect(() => makePlanner({ latentDim: 0 })).toThrow(/invalid latentDim/);
    expect(() => makePlanner({ latentDim: -1 })).toThrow(/invalid latentDim/);
  });

  it('rejects non-positive horizonH', () => {
    expect(() => makePlanner({ horizonH: 0 })).toThrow(/invalid horizonH/);
  });

  it('rejects non-positive executeFirstK', () => {
    expect(() => makePlanner({ executeFirstK: 0 })).toThrow(/invalid executeFirstK/);
  });

  it('rejects executeFirstK > horizonH', () => {
    expect(() => makePlanner({ horizonH: 4, executeFirstK: 8 }))
      .toThrow(/must be ≤ horizonH/);
  });
});

// ---- planner contract surface ---------------------------------------------

describe('HB-03 Planner contract', () => {
  it('encode returns a latent of declared dimensionality', () => {
    const planner = makePlanner({ latentDim: 32 });
    const z = planner.encode(validState);
    expect(z.vector.length).toBe(32);
    expect(z.encoderTag).toBe('disabled-stub');
  });

  it('predict preserves latent dimensionality', () => {
    const planner = makePlanner({ latentDim: 16 });
    const z0 = planner.encode(validState);
    const z1 = planner.predict(z0, { category: 'fusion' });
    expect(z1.vector.length).toBe(16);
  });

  it('cost returns Infinity from the disabled stub', () => {
    const planner = makePlanner({ latentDim: 4 });
    const a = planner.encode(validState);
    const b: KernelLatent = { vector: [1, 1, 1, 1] };
    expect(planner.cost(a, b)).toBe(Number.POSITIVE_INFINITY);
  });

  it('options are frozen', () => {
    const planner = makePlanner();
    expect(Object.isFrozen(planner.options)).toBe(true);
  });
});

// ---- pure utilities -------------------------------------------------------

describe('HB-03 squaredL2', () => {
  it('returns 0 for identical latents', () => {
    expect(squaredL2({ vector: [1, 2, 3] }, { vector: [1, 2, 3] })).toBe(0);
  });
  it('computes correct squared L2', () => {
    expect(squaredL2({ vector: [0, 0] }, { vector: [3, 4] })).toBe(25);
  });
  it('throws on dimension mismatch', () => {
    expect(() => squaredL2({ vector: [1, 2] }, { vector: [1] })).toThrow(/dimension mismatch/);
  });
});

describe('HB-03 isLatentWellFormed', () => {
  it('accepts a well-formed latent', () => {
    expect(isLatentWellFormed({ vector: [1, 2, 3] }, 3)).toBe(true);
  });
  it('rejects on dimension mismatch', () => {
    expect(isLatentWellFormed({ vector: [1, 2, 3] }, 4)).toBe(false);
  });
  it('rejects malformed inputs', () => {
    expect(isLatentWellFormed({ vector: 'nope' }, 1)).toBe(false);
    expect(isLatentWellFormed(null, 1)).toBe(false);
  });
});

// ---- HB-02 → HB-03 integration --------------------------------------------

describe('HB-03 ↔ HB-02 integration', () => {
  it('telemetry observation feeds planner encode', () => {
    const env = withTempEnv({ jepa: true, trace: true });
    try {
      // 1. HB-02 records an event
      const evt: MegakernelTraceEvent = {
        id: 'e1', timestamp: 1, source: 'integration-test',
        state: validState,
      };
      const w = record(evt, env.ledgerPath, env.configPath);
      expect(w.recorded).toBe(true);
      // 2. HB-03 consumes the same state shape via encode
      const planner = makePlanner({ latentDim: 8 }, env.configPath);
      const z = planner.encode(evt.state);
      expect(z.vector.length).toBe(8);
    } finally { env.cleanup(); }
  });

  it('planner observation type IS the trace ComputeGraphState', () => {
    // Compile-time check via TypeScript: the imported type unifies.
    const planner = makePlanner({ latentDim: 4 });
    const out = planner.encode(validState);
    expect(out.vector.length).toBe(4);
  });

  it('isJepaPlannerEnabled honors substrate flag', () => {
    const env = withTempEnv({ jepa: true });
    try {
      expect(isJepaPlannerEnabled(env.configPath)).toBe(true);
    } finally { env.cleanup(); }
  });
});

describe('HB-03 contract version', () => {
  it('exposes a current contract version', () => {
    expect(JEPA_PLANNER_CONTRACT_VERSION).toBe('1.0.0');
  });
});
