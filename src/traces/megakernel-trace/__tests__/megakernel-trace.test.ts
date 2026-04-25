/**
 * HB-02 — Megakernel-trace telemetry-hook tests (v1.49.574 Half B, T1).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  record,
  read,
  makeEventId,
  isMegakernelTraceEnabled,
  ComputeGraphStateSchema,
  CodeTransformationSchema,
  ObservedPerformanceSchema,
  MegakernelTraceEventSchema,
  MEGAKERNEL_TRACE_SCHEMA_VERSION,
  type MegakernelTraceEvent,
} from '../index.js';

function withTempEnv(enabled: boolean): {
  configPath: string;
  ledgerPath: string;
  cleanup: () => void;
} {
  const dir = mkdtempSync(join(tmpdir(), 'mk-trace-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'execution-trace-telemetry': { enabled },
      },
    },
  }));
  return {
    configPath,
    ledgerPath: join(dir, 'mk-trace.jsonl'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

function validEvent(overrides: Partial<MegakernelTraceEvent> = {}): MegakernelTraceEvent {
  return {
    id: 'evt-1',
    timestamp: 1_000_000,
    source: 'test',
    state: {
      kernelId: 'k0',
      modelName: 'qwen3-8b',
      hardwareTarget: 'ada-lovelace-ad106',
      fusedOperatorCount: 100,
      syncCounterCount: 8,
    },
    ...overrides,
  };
}

// ---- schema-shape tests ----------------------------------------------------

describe('HB-02 ComputeGraphStateSchema', () => {
  it('accepts a minimal valid state', () => {
    expect(ComputeGraphStateSchema.safeParse({
      kernelId: 'k', modelName: 'm', hardwareTarget: 'h',
      fusedOperatorCount: 0, syncCounterCount: 0,
    }).success).toBe(true);
  });
  it('accepts SM allocation with all roles', () => {
    expect(ComputeGraphStateSchema.safeParse({
      kernelId: 'k', modelName: 'm', hardwareTarget: 'h',
      fusedOperatorCount: 1, syncCounterCount: 1,
      smAllocation: { producer: 8, consumer: 16, scheduler: 2, free: 8 },
    }).success).toBe(true);
  });
  it('rejects negative counts', () => {
    expect(ComputeGraphStateSchema.safeParse({
      kernelId: 'k', modelName: 'm', hardwareTarget: 'h',
      fusedOperatorCount: -1, syncCounterCount: 0,
    }).success).toBe(false);
  });
});

describe('HB-02 CodeTransformationSchema', () => {
  it('accepts every documented category', () => {
    const cats = ['instruction-reorder', 'fusion', 'tile-size-change',
      'warp-spec-tweak', 'sync-counter-restructure', 'dtype-narrow', 'dtype-widen',
      'load-pipeline-extend', 'load-pipeline-shrink', 'split', 'merge', 'noop'];
    for (const c of cats) {
      expect(CodeTransformationSchema.safeParse({ category: c }).success).toBe(true);
    }
  });
  it('rejects unknown category', () => {
    expect(CodeTransformationSchema.safeParse({ category: 'bogus' }).success).toBe(false);
  });
});

describe('HB-02 ObservedPerformanceSchema', () => {
  it('accepts an empty performance object (all fields optional)', () => {
    expect(ObservedPerformanceSchema.safeParse({}).success).toBe(true);
  });
  it('accepts every verification method', () => {
    const methods = ['fixed-input', 'randomized-fuzz', 'robust-kbench-style', 'reference-comparison', 'unverified'];
    for (const m of methods) {
      expect(ObservedPerformanceSchema.safeParse({ verificationMethod: m }).success).toBe(true);
    }
  });
  it('rejects negative latency', () => {
    expect(ObservedPerformanceSchema.safeParse({ latencyMicros: -1 }).success).toBe(false);
  });
  it('clamps correctness score to [0,1]', () => {
    expect(ObservedPerformanceSchema.safeParse({ correctnessScore: 1.1 }).success).toBe(false);
    expect(ObservedPerformanceSchema.safeParse({ correctnessScore: -0.1 }).success).toBe(false);
    expect(ObservedPerformanceSchema.safeParse({ correctnessScore: 0.5 }).success).toBe(true);
  });
});

describe('HB-02 MegakernelTraceEventSchema', () => {
  it('accepts a complete event', () => {
    expect(MegakernelTraceEventSchema.safeParse(validEvent()).success).toBe(true);
  });
  it('accepts an event with full transformation + performance', () => {
    expect(MegakernelTraceEventSchema.safeParse(validEvent({
      transformation: { category: 'fusion', description: 'fuse mlp_up + mlp_down' },
      performance: {
        latencyMicros: 1234,
        throughputTflops: 22.0,
        memoryBandwidthGbps: 270,
        correctnessScore: 1.0,
        verificationMethod: 'robust-kbench-style',
      },
    })).success).toBe(true);
  });
});

// ---- record() / read() — opt-out behavior ---------------------------------

describe('HB-02 record() — opt-out', () => {
  it('returns disabled result when config missing', () => {
    const r = record(validEvent(), '/tmp/nowhere/ledger.jsonl', '/tmp/nowhere/cfg.json');
    expect(r.recorded).toBe(false);
    expect(r.disabled).toBe(true);
    expect(r.bytesWritten).toBe(0);
  });
  it('writes nothing when flag is off', () => {
    const env = withTempEnv(false);
    try {
      const r = record(validEvent(), env.ledgerPath, env.configPath);
      expect(r.disabled).toBe(true);
      expect(r.recorded).toBe(false);
      expect(existsSync(env.ledgerPath)).toBe(false);
    } finally { env.cleanup(); }
  });
});

describe('HB-02 read() — opt-out', () => {
  it('returns empty disabled-result when flag is off', () => {
    const env = withTempEnv(false);
    try {
      writeFileSync(env.ledgerPath, '{"id":"x","timestamp":1,"source":"s","state":{"kernelId":"k","modelName":"m","hardwareTarget":"h","fusedOperatorCount":0,"syncCounterCount":0}}\n');
      const r = read(env.ledgerPath, env.configPath);
      expect(r.disabled).toBe(true);
      expect(r.events.length).toBe(0);
    } finally { env.cleanup(); }
  });
});

// ---- record() / read() — opt-in roundtrip ---------------------------------

describe('HB-02 record() — opt-in', () => {
  let env: ReturnType<typeof withTempEnv>;
  beforeEach(() => { env = withTempEnv(true); });
  afterEach(() => { env.cleanup(); });

  it('round-trips a single event', () => {
    const evt = validEvent();
    const r = record(evt, env.ledgerPath, env.configPath);
    expect(r.recorded).toBe(true);
    expect(r.disabled).toBe(false);
    expect(r.bytesWritten).toBeGreaterThan(0);

    const back = read(env.ledgerPath, env.configPath);
    expect(back.disabled).toBe(false);
    expect(back.events.length).toBe(1);
    expect(back.events[0]).toEqual(evt);
  });

  it('appends multiple events in order', () => {
    record(validEvent({ id: 'a' }), env.ledgerPath, env.configPath);
    record(validEvent({ id: 'b' }), env.ledgerPath, env.configPath);
    record(validEvent({ id: 'c' }), env.ledgerPath, env.configPath);
    const back = read(env.ledgerPath, env.configPath);
    expect(back.events.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('rejects invalid event without writing', () => {
    const r = record({ junk: true }, env.ledgerPath, env.configPath);
    expect(r.recorded).toBe(false);
    expect(r.disabled).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(existsSync(env.ledgerPath)).toBe(false);
  });

  it('creates directory chain on first write', () => {
    const nested = join(env.ledgerPath, '..', 'sub', 'deep', 'mk-trace.jsonl');
    const r = record(validEvent(), nested, env.configPath);
    expect(r.recorded).toBe(true);
    expect(existsSync(nested)).toBe(true);
  });

  it('writes valid newline-delimited JSON', () => {
    record(validEvent(), env.ledgerPath, env.configPath);
    const raw = readFileSync(env.ledgerPath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(raw.trimEnd())).not.toThrow();
  });
});

describe('HB-02 read() — opt-in', () => {
  let env: ReturnType<typeof withTempEnv>;
  beforeEach(() => { env = withTempEnv(true); });
  afterEach(() => { env.cleanup(); });

  it('returns empty list when ledger missing', () => {
    const r = read(env.ledgerPath, env.configPath);
    expect(r.events.length).toBe(0);
    expect(r.errors.length).toBe(0);
  });

  it('reports per-line errors but continues', () => {
    writeFileSync(env.ledgerPath, [
      JSON.stringify(validEvent({ id: 'good' })),
      '{ broken json',
      JSON.stringify(validEvent({ id: 'good2' })),
      JSON.stringify({ junk: true }),
      '',
    ].join('\n'));
    const r = read(env.ledgerPath, env.configPath);
    expect(r.events.map((e) => e.id)).toEqual(['good', 'good2']);
    expect(r.errors.length).toBe(2);
    expect(r.errors[0]).toMatch(/line 2/);
  });

  it('tolerates an empty ledger file', () => {
    writeFileSync(env.ledgerPath, '');
    const r = read(env.ledgerPath, env.configPath);
    expect(r.events.length).toBe(0);
    expect(r.errors.length).toBe(0);
  });
});

// ---- helpers --------------------------------------------------------------

describe('HB-02 helpers', () => {
  it('makeEventId produces stable deterministic ids', () => {
    expect(makeEventId(1000, 'src', 'k1')).toBe(makeEventId(1000, 'src', 'k1'));
    expect(makeEventId(1000, 'src', 'k1')).not.toBe(makeEventId(1001, 'src', 'k1'));
  });
  it('isMegakernelTraceEnabled honors substrate flag', () => {
    const env = withTempEnv(true);
    try {
      expect(isMegakernelTraceEnabled(env.configPath)).toBe(true);
    } finally { env.cleanup(); }
  });
  it('schema version is current', () => {
    expect(MEGAKERNEL_TRACE_SCHEMA_VERSION).toBe('1.0.0');
  });
});
