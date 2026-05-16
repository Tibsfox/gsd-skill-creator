/**
 * Tests for TypedSkillSpec — the typed-manifest extension to SkillView
 * driven by the May 2026 arxiv synthesis (section 2.4). Verifies roundtrip
 * encoding, identity-hash distinctness from the base SkillSpec, and the
 * migration helper.
 */

import { describe, it, expect } from 'vitest';
import {
  type SkillSpec,
  type TypedSkillSpec,
  type SkillCapabilities,
  type ManifestDependencies,
  type BehaviouralAudit,
  buildTypedSkillRecord,
  buildTypedSkillSpecTypeRecord,
  TYPED_SKILL_SPEC_TYPE_HASH,
  SKILL_SPEC_TYPE_HASH,
  encodeTypedSkillSpec,
  decodeTypedSkillSpec,
  parseTypedSkillRecord,
  skillSpecToTyped,
  recordHashOf,
} from './skill-view.js';
import { hashRefEquals, decodeRecord, encodeRecord, TYPE_RECORD_HASH } from '../memory/grove-format.js';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function caps(overrides: Partial<SkillCapabilities> = {}): SkillCapabilities {
  return {
    tools: ['Read', 'Edit'],
    reads: ['src/**/*.ts'],
    writes: ['src/learn/**/*.ts'],
    network: false,
    exec: false,
    secrets: [],
    ...overrides,
  };
}

function manifestDeps(overrides: Partial<ManifestDependencies> = {}): ManifestDependencies {
  return {
    tools: ['Bash'],
    skills: ['intent-router'],
    order: 'before',
    graph: null,
    ...overrides,
  };
}

function audit(overrides: Partial<BehaviouralAudit> = {}): BehaviouralAudit {
  return {
    sipDistribution: {
      'surface-anchoring': 0.1,
      'template-copy': 0.05,
      'excess-planning': 0.2,
      'task-recovery': 0.6,
      'off-task-artifact': 0.05,
    },
    lastAuditedMs: 1715811600000,
    baselineBucket: 'shipped',
    ...overrides,
  };
}

function spec(overrides: Partial<TypedSkillSpec> = {}): TypedSkillSpec {
  return {
    name: 'agent-systems-phase-2',
    description: 'A skill that exists only to exercise the TypedSkillSpec roundtrip.',
    body: '# agent-systems-phase-2\n\nA typed-manifest fixture for tests.',
    activationPatterns: ['typed manifest', 'phase 2', 'agent-systems'],
    dependencies: [],
    capabilities: caps(),
    manifestDependencies: manifestDeps(),
    behaviouralAudit: audit(),
    compilationTargets: ['claude-code', 'codex'],
    ...overrides,
  };
}

// ─── TypeRecord identity ────────────────────────────────────────────────────

describe('TypedSkillSpec TypeRecord', () => {
  it('produces a stable identity hash distinct from SKILL_SPEC_TYPE_HASH', () => {
    const expected = TYPED_SKILL_SPEC_TYPE_HASH;
    const recomputed = recordHashOf(buildTypedSkillSpecTypeRecord());
    expect(hashRefEquals(expected, recomputed)).toBe(true);
    expect(hashRefEquals(expected, SKILL_SPEC_TYPE_HASH)).toBe(false);
  });

  it('declares its type_hash as TYPE_RECORD_HASH (bootstrap chain)', () => {
    const record = buildTypedSkillSpecTypeRecord();
    expect(hashRefEquals(record.typeHash, TYPE_RECORD_HASH)).toBe(true);
  });
});

// ─── Encode / decode roundtrip ──────────────────────────────────────────────

describe('TypedSkillSpec encode/decode', () => {
  it('roundtrips a fully populated spec', () => {
    const original = spec();
    const bytes = encodeTypedSkillSpec(original);
    const decoded = decodeTypedSkillSpec(bytes);

    expect(decoded.name).toBe(original.name);
    expect(decoded.description).toBe(original.description);
    expect(decoded.body).toBe(original.body);
    expect(decoded.activationPatterns).toEqual(original.activationPatterns);
    expect(decoded.dependencies).toEqual(original.dependencies);
    expect(decoded.capabilities).toEqual(original.capabilities);
    expect(decoded.manifestDependencies.tools).toEqual(original.manifestDependencies.tools);
    expect(decoded.manifestDependencies.skills).toEqual(original.manifestDependencies.skills);
    expect(decoded.manifestDependencies.order).toBe(original.manifestDependencies.order);
    expect(decoded.manifestDependencies.graph).toBeNull();
    expect(decoded.behaviouralAudit.baselineBucket).toBe(original.behaviouralAudit.baselineBucket);
    expect(decoded.behaviouralAudit.lastAuditedMs).toBe(original.behaviouralAudit.lastAuditedMs);
    expect(decoded.compilationTargets).toEqual(original.compilationTargets);
  });

  it('quantises SIP distribution to 6 decimal places (canonical)', () => {
    const original = spec({
      behaviouralAudit: audit({
        sipDistribution: { 'task-recovery': 0.123456789 },
      }),
    });
    const bytes = encodeTypedSkillSpec(original);
    const decoded = decodeTypedSkillSpec(bytes);
    expect(decoded.behaviouralAudit.sipDistribution['task-recovery']).toBeCloseTo(0.123457, 6);
  });

  it('produces byte-identical encoding for equivalent specs', () => {
    const a = encodeTypedSkillSpec(spec());
    const b = encodeTypedSkillSpec(spec());
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it('rejects unknown compilation targets at decode time', () => {
    const original = spec();
    const bytes = encodeTypedSkillSpec(original);
    // Tamper the bytes: replace 'codex' with 'fakeai' (same length).
    const buf = Buffer.from(bytes);
    const idx = buf.indexOf(Buffer.from('codex'));
    expect(idx).toBeGreaterThan(0);
    buf.write('fakei', idx);
    expect(() => decodeTypedSkillSpec(new Uint8Array(buf))).toThrow(/invalid compilation target/);
  });

  it('rejects invalid order at decode time', () => {
    const original = spec({ manifestDependencies: manifestDeps({ order: 'before' }) });
    const bytes = encodeTypedSkillSpec(original);
    const buf = Buffer.from(bytes);
    const idx = buf.indexOf(Buffer.from('before'));
    expect(idx).toBeGreaterThan(0);
    buf.write('wrong!', idx);
    expect(() => decodeTypedSkillSpec(new Uint8Array(buf))).toThrow(/invalid manifest_dependencies\.order/);
  });

  it('rejects invalid baseline bucket at decode time', () => {
    const original = spec({ behaviouralAudit: audit({ baselineBucket: 'shipped' }) });
    const bytes = encodeTypedSkillSpec(original);
    const buf = Buffer.from(bytes);
    const idx = buf.indexOf(Buffer.from('shipped'));
    expect(idx).toBeGreaterThan(0);
    buf.write('xxxxxxx', idx);
    expect(() => decodeTypedSkillSpec(new Uint8Array(buf))).toThrow(/invalid baseline_bucket/);
  });
});

// ─── Record wrapping ────────────────────────────────────────────────────────

describe('buildTypedSkillRecord', () => {
  it('wraps the spec in a Grove record with TYPED_SKILL_SPEC_TYPE_HASH', () => {
    const record = buildTypedSkillRecord(spec(), { createdAtMs: 1715811600000 });
    expect(hashRefEquals(record.typeHash, TYPED_SKILL_SPEC_TYPE_HASH)).toBe(true);
    expect(record.provenance.createdAtMs).toBe(1715811600000);
    expect(record.provenance.toolVersion).toBe('grove-skillview/2.0');
  });

  it('roundtrips through parseTypedSkillRecord', () => {
    const original = spec();
    const record = buildTypedSkillRecord(original, { createdAtMs: 0 });
    const decoded = parseTypedSkillRecord(record);
    expect(decoded.name).toBe(original.name);
    expect(decoded.capabilities.tools).toEqual(original.capabilities.tools);
    expect(decoded.compilationTargets).toEqual(original.compilationTargets);
  });

  it('refuses to parse a record whose type_hash does not match', () => {
    // Build a typed record then claim it's a regular SkillSpec.
    const typed = buildTypedSkillRecord(spec(), { createdAtMs: 0 });
    typed.typeHash = SKILL_SPEC_TYPE_HASH;
    expect(() => parseTypedSkillRecord(typed)).toThrow(/type_hash is not TYPED_SKILL_SPEC_TYPE_HASH/);
  });

  it('encodes through decodeRecord+parseTypedSkillRecord (end-to-end bytes)', () => {
    const original = spec();
    const record = buildTypedSkillRecord(original, { createdAtMs: 0 });
    // Manually walk through serialize → parse.
    const bytes = encodeRecord(record);
    const decoded = parseTypedSkillRecord(decodeRecord(bytes));
    expect(decoded.behaviouralAudit.sipDistribution['task-recovery']).toBeCloseTo(0.6, 4);
  });
});

// ─── Migration helper ───────────────────────────────────────────────────────

describe('skillSpecToTyped', () => {
  it('promotes a base SkillSpec with conservative defaults', () => {
    const base: SkillSpec = {
      name: 'legacy-skill',
      description: 'A pre-typed-manifest skill.',
      body: '# legacy',
      activationPatterns: ['legacy'],
      dependencies: [],
    };
    const typed = skillSpecToTyped(base);
    expect(typed.name).toBe(base.name);
    expect(typed.capabilities.tools).toEqual([]);
    expect(typed.capabilities.network).toBe(false);
    expect(typed.capabilities.exec).toBe(false);
    expect(typed.manifestDependencies.order).toBe('any');
    expect(typed.manifestDependencies.graph).toBeNull();
    expect(typed.behaviouralAudit.lastAuditedMs).toBe(0);
    expect(typed.behaviouralAudit.baselineBucket).toBe('pre-ship');
    expect(typed.compilationTargets).toEqual(['claude-code', 'codex', 'kimi', 'cursor']);
  });

  it('produces a value that roundtrips through encode/decode', () => {
    const typed = skillSpecToTyped({
      name: 'x',
      description: 'y',
      body: 'z',
      activationPatterns: [],
      dependencies: [],
    });
    const bytes = encodeTypedSkillSpec(typed);
    const decoded = decodeTypedSkillSpec(bytes);
    expect(decoded.name).toBe('x');
    expect(decoded.capabilities.tools).toEqual([]);
    expect(decoded.compilationTargets).toEqual(['claude-code', 'codex', 'kimi', 'cursor']);
  });
});
