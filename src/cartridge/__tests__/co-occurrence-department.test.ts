/**
 * Tests for minting a department-cartridge DRAFT from measured co-activation.
 *
 * Test plan:
 *   - A synthetic co-occurrence fixture with well-observed pairs mints a
 *     valid department cartridge whose skills cover every co-activating skill.
 *   - The mint is a DRAFT (co-activation provenance, not installed).
 *   - Every bundle slot becomes a team; a router agent coordinates.
 *   - `minSupport` drops thin pairs; a fixture that falls below the threshold
 *     REFUSES to mint rather than emitting an empty artifact.
 *   - A matrix with no supported pairs refuses (ok:false).
 *   - Provenance carries the support/skillCount metadata.
 *
 * All fixtures are SYNTHETIC — the live trace co-occurrence log is sparse
 * because the activation writers are still unwired (Phase 646).
 */

import { describe, it, expect } from 'vitest';
import { mintDepartmentFromCoOccurrence } from '../co-occurrence-department.js';
import { validateCartridge } from '../validator.js';
import type {
  CoOccurrenceMatrix,
  CoOccurrencePair,
} from '../../traces/co-occurrence-schema.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function pair(
  a: string,
  b: string,
  observationCount: number,
  probability = 0.8,
): CoOccurrencePair {
  return {
    event_a: { skillId: a, eventType: 'activation' },
    event_b: { skillId: b, eventType: 'activation' },
    probability,
    temporalLagMs: 250,
    observationCount,
    windowMs: 30_000,
  };
}

function matrix(pairs: CoOccurrencePair[]): CoOccurrenceMatrix {
  return {
    generatedAt: 1_700_000_000_000,
    traceWindowStart: 1_699_000_000_000,
    traceWindowEnd: 1_700_000_000_000,
    pairs,
  };
}

// Four skills, all well-observed together.
const DENSE = matrix([
  pair('gsd-workflow', 'session-awareness', 12),
  pair('gsd-workflow', 'skill-integration', 9),
  pair('session-awareness', 'skill-integration', 8),
  pair('skill-integration', 'security-hygiene', 5),
]);

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('mintDepartmentFromCoOccurrence', () => {
  it('mints a valid department cartridge from a dense fixture', () => {
    const result = mintDepartmentFromCoOccurrence(DENSE, {
      minSupport: 4,
      name: 'flow-department',
      createdAt: '2026-07-12',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.validation.valid).toBe(true);
    expect(validateCartridge(result.cartridge).valid).toBe(true);

    // Every co-activating skill is represented.
    expect(result.skillCount).toBe(4);
    const dept = result.cartridge.chipsets.find((c) => c.kind === 'department');
    expect(dept).toBeDefined();
    expect(Object.keys((dept as { skills: object }).skills)).toHaveLength(4);
  });

  it('emits a router agent and one team per slot', () => {
    const result = mintDepartmentFromCoOccurrence(DENSE, { minSupport: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const dept = result.cartridge.chipsets.find(
      (c) => c.kind === 'department',
    ) as {
      agents: { topology: string; router_agent?: string; agents: { name: string }[] };
      teams: Record<string, unknown>;
    };
    expect(dept.agents.topology).toBe('router');
    expect(dept.agents.router_agent).toBe('co-activation-router');
    expect(dept.agents.agents).toHaveLength(1);
    expect(Object.keys(dept.teams).length).toBe(result.slotCount);
    expect(result.slotCount).toBeGreaterThan(0);
  });

  it('stamps DRAFT co-activation provenance with support metadata', () => {
    const result = mintDepartmentFromCoOccurrence(DENSE, {
      minSupport: 4,
      createdAt: '2026-07-12',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const prov = result.cartridge.provenance as Record<string, unknown>;
    expect(prov.origin).toBe('co-activation');
    expect(prov.draft).toBe(true);
    expect(prov.createdAt).toBe('2026-07-12');
    expect(prov.coActivation).toMatchObject({
      minSupport: 4,
      skillCount: 4,
    });
    // support = sum of supported observationCounts (12+9+8+5).
    expect(result.support).toBe(34);
    expect(result.yaml).toContain('co-activation');
  });

  it('refuses to mint below min-support (guards against thin data)', () => {
    // With minSupport=10 only the 12-obs pair survives → 2 skills? No: only
    // gsd-workflow/session-awareness (12) clears 10, giving exactly 2 skills.
    // Bump the threshold past every pair to force a thin refusal.
    const result = mintDepartmentFromCoOccurrence(DENSE, { minSupport: 100 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/too thin/);
    expect(result.skillCount).toBeLessThan(2);
    expect(result.support).toBe(0);
  });

  it('refuses when a single pair leaves fewer than two skills', () => {
    // A lone weak pair below threshold → no supported skills.
    const sparse = matrix([pair('a', 'b', 1)]);
    const result = mintDepartmentFromCoOccurrence(sparse, { minSupport: 3 });
    expect(result.ok).toBe(false);
  });

  it('mints when exactly two skills clear the threshold', () => {
    const result = mintDepartmentFromCoOccurrence(DENSE, { minSupport: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.skillCount).toBe(2);
    expect(result.validation.valid).toBe(true);
  });

  it('sanitizes opaque skill ids into filesystem-safe keys', () => {
    const weird = matrix([
      pair('Foo/Bar Skill!!', 'baz..qux', 5),
      pair('baz..qux', 'Foo/Bar Skill!!', 5),
    ]);
    const result = mintDepartmentFromCoOccurrence(weird, { minSupport: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Must validate — unsafe keys would trip checkSafeCompanionNames.
    expect(result.validation.valid).toBe(true);
    const dept = result.cartridge.chipsets.find(
      (c) => c.kind === 'department',
    ) as { skills: Record<string, unknown> };
    for (const key of Object.keys(dept.skills)) {
      expect(key).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });
});
