/**
 * Stackelberg Drainability Pricing Reference — drainability guardrail tests.
 *
 * Verifies that:
 *   - Tenant usage exceeding safety threshold → BLOCK verdict.
 *   - Tenant usage within threshold → ALLOW verdict.
 *   - Multi-resource scenarios work correctly.
 *   - Per-resource details are accurate.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 */

import { describe, expect, it } from 'vitest';
import {
  checkDrainability,
  checkGuardrailFeasibility,
  computeGuardrailSlack,
} from '../drainability-guardrail-checker.js';
import type {
  DrainabilityGuardrail,
  TenantUsage,
} from '../types.js';

// ============================================================================
// Basic ALLOW / BLOCK
// ============================================================================

describe('checkDrainability — single resource', () => {
  const guardrail: DrainabilityGuardrail = {
    resourceId: 'compute',
    capacity: 100,
    safetyFloor: 20, // Effective limit: 100 - 20 = 80
  };

  it('returns ALLOW when total consumption is within safe limit', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 30 }, utilityValue: 5, totalCost: 10 },
      { tenantId: 'B', consumption: { compute: 40 }, utilityValue: 4, totalCost: 8 },
    ];
    // Total = 70, limit = 80 → slack = 10 → ALLOW
    const result = checkDrainability(usages, [guardrail]);
    expect(result.verdict).toBe('ALLOW');
    expect(result.resourcesFailed).toBe(0);
  });

  it('returns ALLOW exactly at the safe limit (slack=0)', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 80 }, utilityValue: 8, totalCost: 16 },
    ];
    // Total = 80, limit = 80 → slack = 0 → ALLOW
    const result = checkDrainability(usages, [guardrail]);
    expect(result.verdict).toBe('ALLOW');
    expect(result.details[0]!.slack).toBeCloseTo(0, 9);
  });

  it('returns BLOCK when total consumption exceeds safe limit', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 50 }, utilityValue: 7, totalCost: 12 },
      { tenantId: 'B', consumption: { compute: 45 }, utilityValue: 6, totalCost: 9 },
    ];
    // Total = 95, limit = 80 → slack = -15 → BLOCK
    const result = checkDrainability(usages, [guardrail]);
    expect(result.verdict).toBe('BLOCK');
    expect(result.resourcesFailed).toBe(1);
    expect(result.details[0]!.status).toBe('BLOCK');
    expect(result.details[0]!.slack).toBeLessThan(0);
  });

  it('returns BLOCK when a single tenant drains the entire resource', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 100 }, utilityValue: 10, totalCost: 20 },
    ];
    const result = checkDrainability(usages, [guardrail]);
    expect(result.verdict).toBe('BLOCK');
  });
});

// ============================================================================
// Multi-resource scenarios
// ============================================================================

describe('checkDrainability — multi-resource', () => {
  const guardrails: DrainabilityGuardrail[] = [
    { resourceId: 'compute', capacity: 100, safetyFloor: 20 },
    { resourceId: 'bandwidth', capacity: 50, safetyFloor: 10 },
  ];

  it('returns ALLOW when all resources are within limits', () => {
    const usages: TenantUsage[] = [
      {
        tenantId: 'A',
        consumption: { compute: 30, bandwidth: 15 },
        utilityValue: 5,
        totalCost: 10,
      },
      {
        tenantId: 'B',
        consumption: { compute: 40, bandwidth: 20 },
        utilityValue: 4,
        totalCost: 8,
      },
    ];
    // compute: 70/80 → ALLOW; bandwidth: 35/40 → ALLOW
    const result = checkDrainability(usages, guardrails);
    expect(result.verdict).toBe('ALLOW');
    expect(result.resourcesChecked).toBe(2);
    expect(result.resourcesFailed).toBe(0);
  });

  it('returns BLOCK when only one resource is violated', () => {
    const usages: TenantUsage[] = [
      {
        tenantId: 'A',
        consumption: { compute: 30, bandwidth: 35 },
        utilityValue: 5,
        totalCost: 10,
      },
      {
        tenantId: 'B',
        consumption: { compute: 30, bandwidth: 10 },
        utilityValue: 4,
        totalCost: 8,
      },
    ];
    // compute: 60/80 → ALLOW; bandwidth: 45/40 → BLOCK
    const result = checkDrainability(usages, guardrails);
    expect(result.verdict).toBe('BLOCK');
    expect(result.resourcesFailed).toBe(1);
    const bwDetail = result.details.find((d) => d.resourceId === 'bandwidth');
    expect(bwDetail?.status).toBe('BLOCK');
    const cDetail = result.details.find((d) => d.resourceId === 'compute');
    expect(cDetail?.status).toBe('ALLOW');
  });

  it('counts correctly when all resources are violated', () => {
    const usages: TenantUsage[] = [
      {
        tenantId: 'A',
        consumption: { compute: 90, bandwidth: 48 },
        utilityValue: 5,
        totalCost: 10,
      },
    ];
    const result = checkDrainability(usages, guardrails);
    expect(result.verdict).toBe('BLOCK');
    expect(result.resourcesFailed).toBe(2);
  });
});

// ============================================================================
// Detail fields
// ============================================================================

describe('checkDrainability — detail fields', () => {
  it('populates totalConsumption, remainingCapacity, and slack correctly', () => {
    const guardrails: DrainabilityGuardrail[] = [
      { resourceId: 'compute', capacity: 100, safetyFloor: 20 },
    ];
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 30 }, utilityValue: 5, totalCost: 5 },
      { tenantId: 'B', consumption: { compute: 25 }, utilityValue: 4, totalCost: 4 },
    ];
    const result = checkDrainability(usages, guardrails);
    const detail = result.details[0]!;
    expect(detail.totalConsumption).toBeCloseTo(55, 6);
    expect(detail.capacity).toBe(100);
    expect(detail.safetyFloor).toBe(20);
    expect(detail.remainingCapacity).toBeCloseTo(45, 6); // 100 - 55
    expect(detail.slack).toBeCloseTo(25, 6);              // (100-20) - 55
  });
});

// ============================================================================
// Empty / edge cases
// ============================================================================

describe('checkDrainability — edge cases', () => {
  it('returns ALLOW with zero tenants (nothing consumes)', () => {
    const guardrails: DrainabilityGuardrail[] = [
      { resourceId: 'compute', capacity: 100, safetyFloor: 20 },
    ];
    const result = checkDrainability([], guardrails);
    expect(result.verdict).toBe('ALLOW');
    expect(result.resourcesChecked).toBe(1);
    expect(result.resourcesFailed).toBe(0);
  });

  it('returns ALLOW with zero guardrails', () => {
    const usages: TenantUsage[] = [
      { tenantId: 'A', consumption: { compute: 999 }, utilityValue: 0, totalCost: 0 },
    ];
    const result = checkDrainability(usages, []);
    expect(result.verdict).toBe('ALLOW');
    expect(result.resourcesChecked).toBe(0);
  });
});

// ============================================================================
// Internal helpers
// ============================================================================

describe('checkGuardrailFeasibility', () => {
  it('returns true when all resources are within limits', () => {
    const feasible = checkGuardrailFeasibility(
      { compute: 70, bandwidth: 30 },
      [
        { id: 'compute', capacity: 100, guardrailFloor: 20 },
        { id: 'bandwidth', capacity: 50, guardrailFloor: 10 },
      ],
    );
    expect(feasible).toBe(true);
  });

  it('returns false when any resource exceeds its limit', () => {
    const feasible = checkGuardrailFeasibility(
      { compute: 90, bandwidth: 30 },
      [
        { id: 'compute', capacity: 100, guardrailFloor: 20 }, // limit=80, demand=90 → fail
        { id: 'bandwidth', capacity: 50, guardrailFloor: 10 },
      ],
    );
    expect(feasible).toBe(false);
  });
});

describe('computeGuardrailSlack', () => {
  it('returns positive slack when under limit', () => {
    const slack = computeGuardrailSlack(
      { compute: 60 },
      [{ id: 'compute', capacity: 100, guardrailFloor: 20 }],
    );
    // (100-20) - 60 = 20
    expect(slack.compute).toBeCloseTo(20, 6);
  });

  it('returns negative slack when over limit', () => {
    const slack = computeGuardrailSlack(
      { compute: 95 },
      [{ id: 'compute', capacity: 100, guardrailFloor: 20 }],
    );
    // (100-20) - 95 = -15
    expect(slack.compute).toBeCloseTo(-15, 6);
  });
});
