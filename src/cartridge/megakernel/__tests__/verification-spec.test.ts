/**
 * HB-07 — Verification doctrine tests (v1.49.574 Half B, T2).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  VerificationMethodSchema,
  VerifierKindSchema,
  VerificationSpecSchema,
  auditVerificationSpec,
  VERIFICATION_SPEC_VERSION,
  type VerificationSpec,
} from '../verification-spec.js';

function withTempEnv(enabled: boolean): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'mk-vd-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': { 'verification-doctrine': { enabled } },
    },
  }));
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const goodSpec: VerificationSpec = {
  method: 'robust-kbench-style',
  verifier: 'reference-impl',
  replicationCount: 16,
  variedInputs: true,
  numericalTolerance: 1e-3,
  referenceImpl: 'pytorch.nn.Linear',
};

// ---- schemas --------------------------------------------------------------

describe('HB-07 VerificationMethodSchema', () => {
  it('accepts every documented method', () => {
    for (const m of ['fixed-input', 'randomized-fuzz', 'robust-kbench-style', 'reference-comparison', 'unverified']) {
      expect(VerificationMethodSchema.safeParse(m).success).toBe(true);
    }
  });
});

describe('HB-07 VerifierKindSchema', () => {
  it('accepts every documented verifier kind', () => {
    for (const k of ['reference-impl', 'llm-judge', 'invariant-set', 'property-based']) {
      expect(VerifierKindSchema.safeParse(k).success).toBe(true);
    }
  });
});

describe('HB-07 VerificationSpecSchema', () => {
  it('accepts the canonical good spec', () => {
    expect(VerificationSpecSchema.safeParse(goodSpec).success).toBe(true);
  });
  it('rejects negative replicationCount', () => {
    expect(VerificationSpecSchema.safeParse({ ...goodSpec, replicationCount: 0 }).success).toBe(false);
  });
  it('rejects negative numericalTolerance', () => {
    expect(VerificationSpecSchema.safeParse({ ...goodSpec, numericalTolerance: -1 }).success).toBe(false);
  });
});

// ---- auditVerificationSpec — opt-out --------------------------------------

describe('HB-07 auditVerificationSpec — opt-out', () => {
  it('returns disabled-result when config missing', () => {
    const r = auditVerificationSpec(goodSpec, '/tmp/nope.json');
    expect(r.disabled).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.findings).toEqual([]);
  });
  it('returns disabled-result when flag is off', () => {
    const env = withTempEnv(false);
    try {
      expect(auditVerificationSpec(goodSpec, env.configPath).disabled).toBe(true);
    } finally { env.cleanup(); }
  });
});

// ---- auditVerificationSpec — opt-in ---------------------------------------

describe('HB-07 auditVerificationSpec — opt-in', () => {
  let env: ReturnType<typeof withTempEnv>;
  beforeEach(() => { env = withTempEnv(true); });
  afterEach(() => { env.cleanup(); });

  it('passes a robust spec with INFO finding', () => {
    const r = auditVerificationSpec(goodSpec, env.configPath);
    expect(r.ok).toBe(true);
    expect(r.disabled).toBe(false);
    expect(r.findings.length).toBeGreaterThan(0);
    expect(r.findings.some((f) => f.severity === 'INFO')).toBe(true);
    expect(r.findings.some((f) => f.severity === 'BLOCK')).toBe(false);
  });

  it('BLOCKs unverified', () => {
    const r = auditVerificationSpec(
      { ...goodSpec, method: 'unverified' }, env.configPath,
    );
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.rule === 'no-unverified' && f.severity === 'BLOCK')).toBe(true);
  });

  it('BLOCKs the Sakana failure shape (fixed-input + 1 replica + unvaried)', () => {
    const r = auditVerificationSpec(
      { ...goodSpec, method: 'fixed-input', replicationCount: 1, variedInputs: false },
      env.configPath,
    );
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.rule === 'sakana-shape' && f.severity === 'BLOCK')).toBe(true);
  });

  it('WARNs on fixed-input even with high replication', () => {
    const r = auditVerificationSpec(
      { ...goodSpec, method: 'fixed-input', replicationCount: 32, variedInputs: true },
      env.configPath,
    );
    expect(r.ok).toBe(true);  // not BLOCK
    expect(r.findings.some((f) => f.rule === 'fixed-input-discouraged' && f.severity === 'WARN')).toBe(true);
  });

  it('WARNs on low replication', () => {
    const r = auditVerificationSpec(
      { ...goodSpec, replicationCount: 4 }, env.configPath,
    );
    expect(r.ok).toBe(true);
    expect(r.findings.some((f) => f.rule === 'low-replication' && f.severity === 'WARN')).toBe(true);
  });

  it('WARNs on llm-judge without tolerance', () => {
    const r = auditVerificationSpec(
      { ...goodSpec, verifier: 'llm-judge', numericalTolerance: undefined },
      env.configPath,
    );
    expect(r.findings.some((f) => f.rule === 'llm-judge-without-tolerance' && f.severity === 'WARN')).toBe(true);
  });

  it('BLOCKs malformed spec', () => {
    const r = auditVerificationSpec({ junk: true }, env.configPath);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.rule === 'spec-shape' && f.severity === 'BLOCK')).toBe(true);
  });
});

describe('HB-07 version', () => {
  it('exposes a current spec version', () => {
    expect(VERIFICATION_SPEC_VERSION).toBe('1.0.0');
  });
});
