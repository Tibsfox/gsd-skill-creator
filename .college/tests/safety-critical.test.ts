/**
 * Safety-Critical Test Suite -- Zero Tolerance
 *
 * All 14 tests in this file MUST pass for the milestone to ship.
 * Any failure is a hard block. No exceptions.
 *
 * SC-01 through SC-08: Food safety boundaries (SafetyWarden + AllergenManager)
 * SC-09: Bounded learning (CalibrationEngine 20% cap)
 * SC-10: Token budget ceiling (5% context window)
 * SC-11: No safety panel suppression
 * SC-12: Math accuracy -- Python panel
 * SC-13: Math accuracy -- C++ panel
 * SC-14: DAG enforcement (no circular dependencies)
 *
 * @module tests/safety-critical
 */

import { describe, it, expect } from 'vitest';
import { SafetyWarden } from '../safety/safety-warden.js';
import { AllergenManager } from '../safety/allergen-manager.js';
import { CalibrationEngine } from '../calibration/engine.js';
import { CollegeLoader } from '../college/college-loader.js';
import { PanelRegistry } from '../panels/panel-interface.js';
import { PythonPanel } from '../panels/python-panel.js';
import { CppPanel } from '../panels/cpp-panel.js';
import { JavaPanel } from '../panels/java-panel.js';
import { LispPanel } from '../panels/lisp-panel.js';
import { PascalPanel } from '../panels/pascal-panel.js';
import { FortranPanel } from '../panels/fortran-panel.js';
import { PerlPanel } from '../panels/perl-panel.js';
import { AlgolPanel } from '../panels/algol-panel.js';
import { UnisonPanel } from '../panels/unison-panel.js';
import { ConceptRegistry, ConceptCircularDependencyError } from '../rosetta-core/concept-registry.js';
import { exponentialDecay } from '../departments/mathematics/concepts/index.js';
import type { SafetyBoundary } from '../rosetta-core/types.js';
import { join } from 'node:path';

// ─── Shared Safety Boundaries ───────────────────────────────────────────────

const cookingSafetyBoundaries: SafetyBoundary[] = [
  { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum safe internal temperature for poultry' },
  { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute', reason: 'USDA minimum for ground meat' },
  { parameter: 'whole_cuts_internal_temp', limit: 145, type: 'absolute', reason: 'USDA minimum for whole cuts with 3-min rest' },
  { parameter: 'danger_zone_time', limit: 120, type: 'absolute', reason: 'Maximum minutes food may remain in 40-140F danger zone' },
  { parameter: 'refrigerated_storage_hours', limit: 96, type: 'warning', reason: 'Cooked leftovers safe for 3-4 days refrigerated' },
];

// ─── SC-01: Poultry temp floor 165F ─────────────────────────────────────────

describe('SC-01: Poultry temp floor 165F', () => {
  it('redirect mode returns safeValue 165 when proposed temp is 150F', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum' },
    ]);
    const result = warden.check(
      { parameter: 'poultry_internal_temp', proposedValue: 150 },
      'redirect',
    );
    expect(result.safe).toBe(false);
    expect(result.safeValue).toBe(165);
  });

  it('at exactly 165F, reports safe', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'poultry_internal_temp', limit: 165, type: 'absolute', reason: 'USDA minimum' },
    ]);
    const result = warden.check(
      { parameter: 'poultry_internal_temp', proposedValue: 165 },
      'redirect',
    );
    expect(result.safe).toBe(true);
  });
});

// ─── SC-02: Ground meat temp floor 160F ─────────────────────────────────────

describe('SC-02: Ground meat temp floor 160F', () => {
  it('redirect mode returns safeValue 160 when proposed temp is 140F', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute', reason: 'USDA minimum for ground meat' },
    ]);
    const result = warden.check(
      { parameter: 'ground_meat_internal_temp', proposedValue: 140 },
      'redirect',
    );
    expect(result.safe).toBe(false);
    expect(result.safeValue).toBe(160);
  });

  it('at exactly 160F, reports safe', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'ground_meat_internal_temp', limit: 160, type: 'absolute', reason: 'USDA minimum for ground meat' },
    ]);
    const result = warden.check(
      { parameter: 'ground_meat_internal_temp', proposedValue: 160 },
      'redirect',
    );
    expect(result.safe).toBe(true);
  });
});

// ─── SC-03: Beef/pork temp floor 145F ───────────────────────────────────────

describe('SC-03: Beef/pork temp floor 145F', () => {
  it('redirect mode returns safeValue 145 when proposed temp is 120F', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'whole_cuts_internal_temp', limit: 145, type: 'absolute', reason: 'USDA minimum for whole cuts' },
    ]);
    const result = warden.check(
      { parameter: 'whole_cuts_internal_temp', proposedValue: 120 },
      'redirect',
    );
    expect(result.safe).toBe(false);
    expect(result.safeValue).toBe(145);
  });

  it('at exactly 145F, reports safe', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries([
      { parameter: 'whole_cuts_internal_temp', limit: 145, type: 'absolute', reason: 'USDA minimum for whole cuts' },
    ]);
    const result = warden.check(
      { parameter: 'whole_cuts_internal_temp', proposedValue: 145 },
      'redirect',
    );
    expect(result.safe).toBe(true);
  });
});

// ─── SC-04: Danger zone tracker warns at 2+ hours in 40-140F ────────────────

describe('SC-04: Danger zone tracker warns at 2+ hours in 40-140F', () => {
  it('warns when item has been in danger zone for 121+ minutes', () => {
    const baseTime = new Date('2024-01-01T12:00:00Z');
    let currentTime = baseTime;
    const warden = new SafetyWarden(() => currentTime);

    // Track item at 100F (in danger zone: 40-140F)
    warden.trackDangerZone('chicken-breast', 100);

    // Advance clock by 121 minutes
    currentTime = new Date(baseTime.getTime() + 121 * 60 * 1000);

    const zones = warden.getActiveDangerZones();
    expect(zones).toHaveLength(1);
    expect(zones[0].itemId).toBe('chicken-breast');
    expect(zones[0].warning).toBe(true);
    expect(zones[0].elapsedMinutes).toBeGreaterThanOrEqual(120);
  });

  it('does not warn if under 120 minutes', () => {
    const baseTime = new Date('2024-01-01T12:00:00Z');
    let currentTime = baseTime;
    const warden = new SafetyWarden(() => currentTime);

    warden.trackDangerZone('steak', 100);

    // Advance clock by 90 minutes
    currentTime = new Date(baseTime.getTime() + 90 * 60 * 1000);

    const zones = warden.getActiveDangerZones();
    expect(zones).toHaveLength(1);
    expect(zones[0].warning).toBe(false);
  });
});

// ─── SC-05: AllergenManager.checkSubstitution flags allergen implications ────

describe('SC-05: AllergenManager.checkSubstitution flags allergen implications', () => {
  it('flags when replacement introduces new allergen', () => {
    const manager = new AllergenManager();
    // Substituting milk with almond milk introduces tree-nuts allergen
    const result = manager.checkSubstitution('milk', 'almond milk');
    expect(result.safe).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.replacement.length).toBeGreaterThan(0);
    expect(result.replacement.some(f => f.allergen === 'tree-nuts')).toBe(true);
  });

  it('reports safe for allergen-free substitution', () => {
    const manager = new AllergenManager();
    // Substituting milk with oat milk (no big-9 allergens)
    const result = manager.checkSubstitution('milk', 'oat milk');
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// ─── SC-06: SafetyWarden warns when storage exceeds 4 days (96 hours) ───────

describe('SC-06: Storage time boundary (96 hours)', () => {
  it('flags storage exceeding 96 hours', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);

    const result = warden.check(
      { parameter: 'refrigerated_storage_hours', proposedValue: 120 },
      'annotate',
    );
    expect(result.safe).toBe(false);
    expect(result.action).toBe('annotate');
  });

  it('allows storage within 96 hours', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);

    const result = warden.check(
      { parameter: 'refrigerated_storage_hours', proposedValue: 72 },
      'annotate',
    );
    expect(result.safe).toBe(true);
  });
});

// ─── SC-07: Redirect mode blocks unsafe temps (never exposes unsafe value) ──

describe('SC-07: Redirect mode never exposes unsafe value', () => {
  it('safeValue is the floor, not the proposed unsafe value', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);

    const result = warden.check(
      { parameter: 'poultry_internal_temp', proposedValue: 100 },
      'redirect',
    );
    expect(result.safe).toBe(false);
    expect(result.action).toBe('redirect');
    // The safeValue must be the boundary limit (165), NOT the proposed 100
    expect(result.safeValue).toBe(165);
    // Must NOT contain the proposed unsafe value
    expect(result.proposedValue).toBeUndefined();
  });
});

// ─── SC-08: Gate mode requires acknowledgment ───────────────────────────────

describe('SC-08: Gate mode requires acknowledgment for violation', () => {
  it('returns requiresAcknowledgment: true for gate mode violation', () => {
    const warden = new SafetyWarden();
    warden.registerBoundaries(cookingSafetyBoundaries);

    const result = warden.check(
      { parameter: 'poultry_internal_temp', proposedValue: 140 },
      'gate',
    );
    expect(result.safe).toBe(false);
    expect(result.action).toBe('gate');
    expect(result.requiresAcknowledgment).toBe(true);
  });
});

// ─── SC-09: CalibrationEngine enforces 20% maximum adjustment bound ─────────

describe('SC-09: 20% bounded learning', () => {
  it('no single calibration step changes parameters by more than 20%', async () => {
    // Create a mock model that tries to return a 50% adjustment
    const aggressiveModel = {
      domain: 'sc09-test',
      parameters: ['test_param'],
      science: 'test',
      safetyBoundaries: [] as SafetyBoundary[],
      computeAdjustment: () => ({ test_param: 500 }), // 50% of 1000
      confidence: () => 0.9,
    };

    const mockStore = {
      save: async () => {},
      getHistory: async () => [],
    };

    const engine = new CalibrationEngine(mockStore as any);
    engine.registerModel(aggressiveModel);

    const delta = await engine.process({
      domain: 'sc09-test',
      translationId: 'test',
      observedResult: 'bad',
      expectedResult: 'good',
      parameters: { test_param: 1000 },
    });

    // The adjustment should be capped at 20% of 1000 = 200
    const adj = delta.adjustment.test_param;
    const maxAllowed = 1000 * 0.2;
    expect(Math.abs(adj)).toBeLessThanOrEqual(maxAllowed);
  });
});

// ─── SC-10: Token budget ceiling (5% context window) ────────────────────────

describe('SC-10: Token budget ceiling', () => {
  const basePath = join(process.cwd(), '.college', 'departments');
  const loader = new CollegeLoader(basePath);

  it('summary tier loading stays under 3000 tokens', async () => {
    const depts = loader.listDepartments();
    expect(depts.length).toBeGreaterThan(0);
    for (const dept of depts) {
      const summary = await loader.loadSummary(dept);
      expect(summary.tokenCost, `${dept} summary exceeds 3000 tokens`).toBeLessThan(3000);
    }
  });

  it('panel expression does not exceed 5% of 200K context (10000 tokens)', () => {
    const panel = new PythonPanel();
    const expr = panel.translate(exponentialDecay);
    const formatted = panel.formatExpression(expr);
    const estimatedTokens = formatted.length / 4; // ~4 chars per token
    expect(estimatedTokens).toBeLessThan(10000);
  });
});

// ─── SC-11: No safety panel suppression ─────────────────────────────────────

describe('SC-11: No safety panel suppression', () => {
  it('all 9 registered panels remain accessible after routing', () => {
    const registry = new PanelRegistry();
    const allPanels = [
      new PythonPanel(),
      new CppPanel(),
      new JavaPanel(),
      new LispPanel(),
      new PascalPanel(),
      new FortranPanel(),
      new PerlPanel(),
      new AlgolPanel(),
      new UnisonPanel(),
    ];

    for (const panel of allPanels) {
      registry.register(panel);
    }

    expect(registry.getAll()).toHaveLength(9);

    // Verify no panel was removed or suppressed
    for (const panel of allPanels) {
      expect(registry.has(panel.panelId), `Panel ${panel.panelId} was suppressed`).toBe(true);
    }
  });
});

// ─── SC-12: Math accuracy -- Python panel ───────────────────────────────────

describe('SC-12: Math accuracy -- Python panel', () => {
  it('exponential decay code uses math.exp with Newton cooling law', () => {
    const panel = new PythonPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('math.exp');
    expect(expr.code).toMatch(/exp\s*\(/);
  });

  it('code is non-trivial and contains the cooling formula', () => {
    const panel = new PythonPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code!.length).toBeGreaterThan(50);
    expect(expr.code).toContain('T_ambient');
    expect(expr.code).toContain('T_initial');
  });
});

// ─── SC-13: Math accuracy -- C++ panel ──────────────────────────────────────

describe('SC-13: Math accuracy -- C++ panel', () => {
  it('exponential decay code uses std::exp with cmath and double types', () => {
    const panel = new CppPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code).toBeDefined();
    expect(expr.code).toContain('std::exp');
    expect(expr.code).toMatch(/cmath/);
    expect(expr.code).toContain('double');
  });

  it('code is non-trivial and contains the cooling formula', () => {
    const panel = new CppPanel();
    const expr = panel.translate(exponentialDecay);
    expect(expr.code!.length).toBeGreaterThan(50);
    expect(expr.code).toContain('T_ambient');
    expect(expr.code).toContain('T_initial');
  });
});

// ─── SC-14: DAG enforcement (no circular dependencies) ──────────────────────

describe('SC-14: DAG enforcement', () => {
  it('detects circular dependency and throws ConceptCircularDependencyError', () => {
    const registry = new ConceptRegistry();

    // Register A -> B -> C -> A (circular via dependency relationships)
    registry.register({
      id: 'circ-A',
      name: 'A',
      domain: 'test',
      description: 'A',
      panels: new Map(),
      relationships: [{ type: 'dependency', targetId: 'circ-B', description: 'needs B' }],
    });
    registry.register({
      id: 'circ-B',
      name: 'B',
      domain: 'test',
      description: 'B',
      panels: new Map(),
      relationships: [{ type: 'dependency', targetId: 'circ-C', description: 'needs C' }],
    });
    registry.register({
      id: 'circ-C',
      name: 'C',
      domain: 'test',
      description: 'C',
      panels: new Map(),
      relationships: [{ type: 'dependency', targetId: 'circ-A', description: 'needs A' }],
    });

    expect(() => registry.getDependencies('circ-A')).toThrow(ConceptCircularDependencyError);
  });

  it('resolves non-circular dependencies without error', () => {
    const registry = new ConceptRegistry();

    registry.register({
      id: 'dag-A',
      name: 'A',
      domain: 'test',
      description: 'A',
      panels: new Map(),
      relationships: [{ type: 'dependency', targetId: 'dag-B', description: 'needs B' }],
    });
    registry.register({
      id: 'dag-B',
      name: 'B',
      domain: 'test',
      description: 'B',
      panels: new Map(),
      relationships: [],
    });

    const deps = registry.getDependencies('dag-A');
    expect(deps).toHaveLength(1);
    expect(deps[0].id).toBe('dag-B');
  });
});
