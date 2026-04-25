/**
 * Stackelberg Drainability Pricing Reference — integration tests.
 *
 * Tests:
 *   1. Default-off byte-identical: flag false → { disabled: true }.
 *   2. solveStackelberg() with realistic 3-tenant + 2-resource scenario.
 *   3. checkDrainability() flag-gating.
 *   4. Round-trip PricingSolution JSON shape.
 *   5. Reference-only verification: no imports from orchestration/dacp.
 *   6. Public surface uses generic language (no Fox Companies IP names).
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDrainability,
  solveStackelberg,
} from '../index.js';
import type {
  DrainabilityGuardrail,
  StackelbergGame,
  TenantUsage,
} from '../types.js';

// ============================================================================
// 1. Default-off byte-identical
// ============================================================================

describe('default-off behaviour', () => {
  it('solveStackelberg returns { disabled: true } when flag is off', () => {
    const game: StackelbergGame = {
      resources: [
        { id: 'compute', capacity: 100, guardrailFloor: 20 },
      ],
      tenants: [
        {
          id: 'T0',
          utility: { kind: 'quadratic', a: 10, b: 2 },
          maxConsumption: { compute: 50 },
        },
      ],
    };
    const result = solveStackelberg(game, { forceEnabled: false });
    expect(result).toStrictEqual({ disabled: true });
  });

  it('checkDrainability returns { disabled: true } when flag is off', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 40 }, utilityValue: 4, totalCost: 8 },
    ];
    const guardrails: DrainabilityGuardrail[] = [
      { resourceId: 'compute', capacity: 100, safetyFloor: 20 },
    ];
    const result = checkDrainability(usages, guardrails, { forceEnabled: false });
    expect(result).toStrictEqual({ disabled: true });
  });

  it('disabled result has exactly { disabled: true } shape — byte-identical check', () => {
    const game: StackelbergGame = {
      resources: [{ id: 'r', capacity: 10, guardrailFloor: 1 }],
      tenants: [
        {
          id: 'T',
          utility: { kind: 'quadratic', a: 5, b: 1 },
          maxConsumption: { r: 10 },
        },
      ],
    };
    const off = solveStackelberg(game, { forceEnabled: false });
    expect(JSON.stringify(off)).toBe('{"disabled":true}');
  });
});

// ============================================================================
// 2. Realistic 3-tenant + 2-resource scenario
// ============================================================================

describe('solveStackelberg — realistic 3-tenant 2-resource scenario', () => {
  const game: StackelbergGame = {
    resources: [
      { id: 'compute', capacity: 120, guardrailFloor: 24, minPrice: 0, maxPrice: 12 },
      { id: 'bandwidth', capacity: 60, guardrailFloor: 12, minPrice: 0, maxPrice: 8 },
    ],
    tenants: [
      {
        id: 'tenant-alpha',
        utility: { kind: 'quadratic', a: 10, b: 1.5 },
        maxConsumption: { compute: 50, bandwidth: 25 },
      },
      {
        id: 'tenant-beta',
        utility: { kind: 'quadratic', a: 8, b: 2 },
        maxConsumption: { compute: 40, bandwidth: 20 },
      },
      {
        id: 'tenant-gamma',
        utility: { kind: 'quadratic', a: 12, b: 3 },
        maxConsumption: { compute: 45, bandwidth: 15 },
      },
    ],
    gridSteps: 12,
  };

  it('produces a feasible solution', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    expect('disabled' in sol).toBe(false);
    if ('disabled' in sol) return;
    expect(sol.guardrailFeasible).toBe(true);
  });

  it('has non-negative prices for all resources', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    expect(sol.prices.compute).toBeGreaterThanOrEqual(0);
    expect(sol.prices.bandwidth).toBeGreaterThanOrEqual(0);
  });

  it('produces exactly 3 tenant usage records', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    expect(sol.tenantUsages).toHaveLength(3);
  });

  it('aggregate demand does not exceed guardrail limit for compute', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    const limit = 120 - 24; // 96
    expect(sol.aggregateDemand.compute).toBeLessThanOrEqual(limit + 1e-6);
  });

  it('aggregate demand does not exceed guardrail limit for bandwidth', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    const limit = 60 - 12; // 48
    expect(sol.aggregateDemand.bandwidth).toBeLessThanOrEqual(limit + 1e-6);
  });

  it('revenue is positive', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    expect(sol.revenue).toBeGreaterThan(0);
  });

  it('guardrailSlack is non-negative for all resources when feasible', () => {
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) return;
    if (sol.guardrailFeasible) {
      expect(sol.guardrailSlack.compute).toBeGreaterThanOrEqual(-1e-6);
      expect(sol.guardrailSlack.bandwidth).toBeGreaterThanOrEqual(-1e-6);
    }
  });
});

// ============================================================================
// 3. checkDrainability flag-gating (integration)
// ============================================================================

describe('checkDrainability — flag-gating integration', () => {
  it('returns ALLOW/BLOCK when flag is on', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 30 }, utilityValue: 5, totalCost: 6 },
    ];
    const guardrails: DrainabilityGuardrail[] = [
      { resourceId: 'compute', capacity: 100, safetyFloor: 20 },
    ];
    const result = checkDrainability(usages, guardrails, { forceEnabled: true });
    expect('disabled' in result).toBe(false);
    if ('disabled' in result) return;
    expect(['ALLOW', 'BLOCK']).toContain(result.verdict);
  });
});

// ============================================================================
// 4. Round-trip PricingSolution JSON shape
// ============================================================================

describe('PricingSolution JSON round-trip', () => {
  it('serialises and deserialises without data loss', () => {
    const game: StackelbergGame = {
      resources: [
        { id: 'compute', capacity: 100, guardrailFloor: 20, minPrice: 0, maxPrice: 10 },
      ],
      tenants: [
        {
          id: 'T0',
          utility: { kind: 'quadratic', a: 10, b: 2 },
          maxConsumption: { compute: 50 },
        },
        {
          id: 'T1',
          utility: { kind: 'quadratic', a: 8, b: 1.5 },
          maxConsumption: { compute: 60 },
        },
      ],
      gridSteps: 10,
    };
    const sol = solveStackelberg(game, { forceEnabled: true });
    if ('disabled' in sol) {
      expect(sol).toStrictEqual({ disabled: true });
      return;
    }

    const json = JSON.stringify(sol);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveProperty('prices');
    expect(parsed).toHaveProperty('tenantUsages');
    expect(parsed).toHaveProperty('aggregateDemand');
    expect(parsed).toHaveProperty('revenue');
    expect(parsed).toHaveProperty('guardrailFeasible');
    expect(parsed).toHaveProperty('guardrailSlack');
    expect(parsed).toHaveProperty('solverIterations');

    expect(parsed.prices.compute).toBeCloseTo(sol.prices.compute, 6);
    expect(parsed.revenue).toBeCloseTo(sol.revenue, 6);
    expect(parsed.tenantUsages).toHaveLength(sol.tenantUsages.length);
  });
});

// ============================================================================
// 5. Reference-only verification: no imports from orchestration/dacp
// ============================================================================

describe('reference-only verification', () => {
  it('no src/orchestration or src/dacp or src/capcom imports in module source files', () => {
    const moduleDir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
    );
    const files = fs.readdirSync(moduleDir).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
    );
    const forbidden = /src\/(orchestration|dacp|capcom)/;
    for (const file of files) {
      const content = fs.readFileSync(path.join(moduleDir, file), 'utf8');
      expect(content).not.toMatch(forbidden);
    }
  });
});

// ============================================================================
// 6. Public surface: no Fox Companies IP names in source
// ============================================================================

describe('public surface — no Fox Companies IP names', () => {
  it('module source files contain no Fox Companies IP names', () => {
    const moduleDir = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '..',
    );
    const files = fs.readdirSync(moduleDir).filter(
      (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
    );
    const forbidden =
      /FoxCompute|FoxFiber|FoxEnergy|FIG plan|Fox Infrastructure Group/;
    for (const file of files) {
      const content = fs.readFileSync(path.join(moduleDir, file), 'utf8');
      expect(content).not.toMatch(forbidden);
    }
  });
});
