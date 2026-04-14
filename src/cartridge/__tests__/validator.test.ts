/**
 * Validator tests — VA-01..VA-08 from 02-test-plan.md.
 *
 * Each rule has a positive case (validator returns valid=true) and a negative
 * case (validator returns valid=false with an actionable error message).
 */

import { describe, expect, it } from 'vitest';
import {
  validateCartridge,
  validateCartridgeOrThrow,
} from '../validator.js';
import type { Cartridge } from '../index.js';

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function baseCartridge(overrides: Partial<Cartridge> = {}): Cartridge {
  return {
    id: 'validator-fixture',
    name: 'Validator Fixture',
    version: '1.0.0',
    author: 'tester',
    description: 'fixture',
    trust: 'system',
    provenance: { origin: 'tester', createdAt: '2026-04-14T00:00:00Z' },
    chipsets: [
      {
        kind: 'department',
        skills: {
          'proofs-logic': {
            domain: 'mathematics',
            description: 'Formal proofs and logical reasoning.',
            triggers: ['proof', 'theorem'],
            agent_affinity: 'euclid',
          },
        },
        agents: {
          topology: 'router',
          router_agent: 'euclid',
          agents: [
            {
              name: 'euclid',
              role: 'proofs specialist',
              model: 'opus',
              tools: ['Read', 'Write'],
              is_capcom: true,
            },
          ],
        },
        teams: {
          'proofs-team': {
            description: 'proof construction pipeline',
            agents: ['euclid'],
          },
        },
      },
      {
        kind: 'evaluation',
        pre_deploy: ['schema_valid'],
        benchmark: {
          trigger_accuracy_threshold: 0.85,
          test_cases_minimum: 25,
          domains_covered: ['proofs'],
        },
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// VA-01 / VA-02 — agent affinity
// ---------------------------------------------------------------------------

describe('validator — department agent_affinity (VA-01 / VA-02)', () => {
  it('VA-01 positive: affinity references an agent in the agents list', () => {
    const result = validateCartridge(baseCartridge());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('VA-02 negative: dangling affinity produces a clear error', () => {
    const cart = baseCartridge();
    const dept = cart.chipsets[0];
    if (dept.kind !== 'department') throw new Error('unreachable');
    dept.skills['proofs-logic']!.agent_affinity = 'euclid-the-missing';

    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.chipsetKind).toBe('department');
    expect(result.errors[0]!.message).toMatch(/euclid-the-missing/);
    expect(result.errors[0]!.path).toContain('agent_affinity');
  });

  it('VA-02b agent_affinity as an array: reports each missing entry', () => {
    const cart = baseCartridge();
    const dept = cart.chipsets[0];
    if (dept.kind !== 'department') throw new Error('unreachable');
    dept.skills['proofs-logic']!.agent_affinity = ['euclid', 'riemann', 'gauss'];

    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    const messages = result.errors.map((e) => e.message).join('|');
    expect(messages).toContain('riemann');
    expect(messages).toContain('gauss');
  });
});

// ---------------------------------------------------------------------------
// VA-02c — router_agent
// ---------------------------------------------------------------------------

describe('validator — department router_agent', () => {
  it('router_agent must exist in agents list — positive', () => {
    const result = validateCartridge(baseCartridge());
    expect(result.valid).toBe(true);
  });

  it('router_agent must exist in agents list — negative', () => {
    const cart = baseCartridge();
    const dept = cart.chipsets[0];
    if (dept.kind !== 'department') throw new Error('unreachable');
    dept.agents.router_agent = 'not-a-real-agent';

    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /router_agent/.test(e.path))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VA-03 / VA-04 — evaluation domains_covered
// ---------------------------------------------------------------------------

describe('validator — evaluation domains_covered (VA-03 / VA-04)', () => {
  it('VA-03 positive: domain is mentioned by at least one skill', () => {
    const result = validateCartridge(baseCartridge());
    expect(result.valid).toBe(true);
  });

  it('VA-04 negative: orphan domain produces a clear error', () => {
    const cart = baseCartridge();
    const ev = cart.chipsets[1];
    if (ev.kind !== 'evaluation') throw new Error('unreachable');
    ev.benchmark.domains_covered = ['proofs', 'telepathy'];

    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toMatch(/telepathy/);
    expect(result.errors[0]!.chipsetKind).toBe('evaluation');
  });

  it('domains matched against skill descriptions as substrings', () => {
    const cart = baseCartridge();
    const ev = cart.chipsets[1];
    if (ev.kind !== 'evaluation') throw new Error('unreachable');
    ev.benchmark.domains_covered = ['formal']; // matches "Formal proofs..."
    expect(validateCartridge(cart).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VA-05 / VA-06 — trust scope
// ---------------------------------------------------------------------------

describe('validator — trust scope (VA-05 / VA-06)', () => {
  it('VA-05 positive: system trust may contain coprocessor + college', () => {
    const cart = baseCartridge({
      chipsets: [
        {
          kind: 'coprocessor',
          package: { name: 'p', language: 'python' },
        },
        {
          kind: 'college',
          department: 'mathematics',
          concept_graph: { read: true, write: true },
          try_session_generation: true,
          learning_pathway_updates: true,
          wings: ['algebra'],
        },
      ],
    });
    const result = validateCartridge(cart);
    expect(result.valid).toBe(true);
  });

  it('VA-06 negative: community trust may not contain coprocessor', () => {
    const cart = baseCartridge({
      trust: 'community',
      chipsets: [
        {
          kind: 'coprocessor',
          package: { name: 'p', language: 'python' },
        },
      ],
    });
    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.chipsetKind === 'coprocessor')).toBe(
      true,
    );
  });

  it('VA-06b community + college also rejected', () => {
    const cart = baseCartridge({
      trust: 'community',
      chipsets: [
        {
          kind: 'college',
          department: 'mathematics',
          concept_graph: { read: true, write: true },
          try_session_generation: true,
          learning_pathway_updates: true,
          wings: [],
        },
      ],
    });
    const result = validateCartridge(cart);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.chipsetKind === 'college')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// VA-07 / VA-08 — schema-level rejection
// ---------------------------------------------------------------------------

describe('validator — schema-level rejection', () => {
  it('VA-07 missing required field: returns errors, does not throw', () => {
    const broken = { id: 'x' };
    const result = validateCartridge(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('VA-08 each chipset kind reports per-field schema errors', () => {
    const broken = {
      id: 'x',
      name: 'x',
      version: '1.0.0',
      author: 'x',
      description: 'x',
      trust: 'system',
      provenance: { origin: 'x', createdAt: '2026-04-14T00:00:00Z' },
      chipsets: [
        { kind: 'grove', namespace: '' }, // missing record_types + empty namespace
      ],
    };
    const result = validateCartridge(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateCartridgeOrThrow throws on validation failure', () => {
    const cart = baseCartridge();
    const dept = cart.chipsets[0];
    if (dept.kind !== 'department') throw new Error('unreachable');
    dept.skills['proofs-logic']!.agent_affinity = 'ghost-agent';
    expect(() => validateCartridgeOrThrow(cart)).toThrow(/ghost-agent/);
  });

  it('validateCartridgeOrThrow returns the cartridge on success', () => {
    const result = validateCartridgeOrThrow(baseCartridge());
    expect(result.id).toBe('validator-fixture');
  });
});
