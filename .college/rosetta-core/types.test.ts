/**
 * Type compilation smoke tests for shared Rosetta Core types.
 *
 * These tests verify that the type definitions are correct and usable,
 * not runtime behavior. Each test creates typed object literals and
 * uses assertions to verify the structure compiles and is correct.
 */

import { describe, it, expect } from 'vitest';
import type {
  RosettaConcept,
  PanelExpression,
  CalibrationDelta,
  CollegeDepartment,
  SafetyBoundary,
  PanelId,
  CalibrationModel,
  ConceptRelationship,
  CalibrationProfile,
  ComplexPosition,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
} from './types.js';

describe('Shared Types', () => {
  it('shared types are importable', () => {
    // Type-level assertions -- if this file compiles, the types are importable.
    // Runtime check: verify we can reference the type names in value position
    // by creating typed variables.
    const panelId: PanelId = 'python';
    expect(panelId).toBe('python');
  });

  it('RosettaConcept can be constructed', () => {
    const concept = {
      id: 'exponential-growth',
      name: 'Exponential Growth',
      domain: 'mathematics',
      description: 'A quantity that increases at a rate proportional to its current value',
      panels: new Map<PanelId, PanelExpression>(),
      relationships: [],
    } satisfies RosettaConcept;

    expect(concept.id).toBe('exponential-growth');
    expect(concept.name).toBe('Exponential Growth');
    expect(concept.domain).toBe('mathematics');
    expect(concept.panels).toBeInstanceOf(Map);
    expect(concept.relationships).toEqual([]);
  });

  it('RosettaConcept supports optional fields', () => {
    const position: ComplexPosition = {
      real: 0.7,
      imaginary: 0.3,
      magnitude: Math.sqrt(0.49 + 0.09),
      angle: Math.atan2(0.3, 0.7),
    };

    const profile: CalibrationProfile = {
      domain: 'mathematics',
      deltas: [],
      confidenceScore: 0.85,
      lastUpdated: new Date(),
    };

    const concept = {
      id: 'trig-functions',
      name: 'Trigonometric Functions',
      domain: 'mathematics',
      description: 'Functions relating angles to side ratios in right triangles',
      panels: new Map<PanelId, PanelExpression>(),
      relationships: [],
      calibration: profile,
      complexPlanePosition: position,
    } satisfies RosettaConcept;

    expect(concept.calibration).toBeDefined();
    expect(concept.calibration!.confidenceScore).toBe(0.85);
    expect(concept.complexPlanePosition).toBeDefined();
    expect(concept.complexPlanePosition!.real).toBe(0.7);
  });

  it('CalibrationDelta enforces structure', () => {
    const delta = {
      observedResult: 'Cookies came out flat',
      expectedResult: 'Cookies should be 1cm thick',
      adjustment: { butterRatio: -0.05, chillTimeMinutes: 15 },
      confidence: 0.72,
      domainModel: 'baking-science',
      timestamp: new Date(),
    } satisfies CalibrationDelta;

    expect(delta.observedResult).toBe('Cookies came out flat');
    expect(delta.confidence).toBe(0.72);
    expect(delta.adjustment).toHaveProperty('butterRatio');
    expect(delta.adjustment).toHaveProperty('chillTimeMinutes');
    expect(delta.domainModel).toBe('baking-science');
  });

  it('SafetyBoundary distinguishes absolute from warning', () => {
    const absoluteBoundary = {
      parameter: 'poultry_internal_temp',
      limit: 165,
      type: 'absolute' as const,
      reason: 'USDA minimum safe internal temperature for poultry',
    } satisfies SafetyBoundary;

    const warningBoundary = {
      parameter: 'seasoning_salt_level',
      limit: 'high',
      type: 'warning' as const,
      reason: 'Excessive salt may affect taste and health',
    } satisfies SafetyBoundary;

    expect(absoluteBoundary.type).toBe('absolute');
    expect(warningBoundary.type).toBe('warning');
    expect(absoluteBoundary.limit).toBe(165);
    expect(typeof warningBoundary.limit).toBe('string');
  });

  it('CollegeDepartment includes all required fields', () => {
    const wing: DepartmentWing = {
      id: 'food-science',
      name: 'Food Science',
      description: 'Maillard reactions, emulsification, protein denaturation',
      concepts: ['maillard-reaction', 'emulsification'],
    };

    const trySession: TrySession = {
      id: 'first-meal',
      name: 'Your First Meal',
      description: 'A guided session for cooking a simple balanced meal',
      entryPoint: 'try-sessions/first-meal.ts',
      estimatedDuration: '30 min',
    };

    const tokenBudget: TokenBudgetConfig = {
      summaryLimit: 3000,
      activeLimit: 12000,
      deepLimit: 50000,
    };

    const model: CalibrationModel = {
      domain: 'temperature',
      parameters: ['target_temp', 'cooking_time'],
      science: 'Thermodynamics and heat transfer',
      safetyBoundaries: [],
    };

    const department = {
      id: 'culinary-arts',
      name: 'Culinary Arts',
      wings: [wing],
      concepts: [],
      calibrationModels: [model],
      trySessions: [trySession],
      tokenBudget,
    } satisfies CollegeDepartment;

    expect(department.id).toBe('culinary-arts');
    expect(department.wings).toHaveLength(1);
    expect(department.wings[0].id).toBe('food-science');
    expect(department.trySessions).toHaveLength(1);
    expect(department.tokenBudget.summaryLimit).toBe(3000);
    expect(department.calibrationModels).toHaveLength(1);
  });

  it('PanelId accepts valid panel identifiers', () => {
    const pythonId: PanelId = 'python';
    const lispId: PanelId = 'lisp';
    const naturalId: PanelId = 'natural';
    const vhdlId: PanelId = 'vhdl';
    const perlId: PanelId = 'perl';
    const algolId: PanelId = 'algol';
    const unisonId: PanelId = 'unison';

    expect(pythonId).toBe('python');
    expect(lispId).toBe('lisp');
    expect(naturalId).toBe('natural');
    expect(vhdlId).toBe('vhdl');
    expect(perlId).toBe('perl');
    expect(algolId).toBe('algol');
    expect(unisonId).toBe('unison');
  });

  it('ConceptRelationship supports all relationship types', () => {
    const dependency: ConceptRelationship = {
      type: 'dependency',
      targetId: 'basic-algebra',
      description: 'Requires understanding of algebraic manipulation',
    };

    const analogy: ConceptRelationship = {
      type: 'analogy',
      targetId: 'population-growth',
      description: 'Same exponential pattern applied to biology',
    };

    const crossRef: ConceptRelationship = {
      type: 'cross-reference',
      targetId: 'cooling-curves',
      description: 'Exponential decay appears in cooking thermodynamics',
    };

    expect(dependency.type).toBe('dependency');
    expect(analogy.type).toBe('analogy');
    expect(crossRef.type).toBe('cross-reference');
  });

  it('PanelExpression can represent a complete panel output', () => {
    const expression = {
      panelId: 'python' as PanelId,
      code: 'import numpy as np\ndef exponential_growth(x0, r, t):\n    return x0 * np.exp(r * t)',
      explanation: 'Exponential growth modeled using NumPy for numerical precision',
      examples: [
        'exponential_growth(100, 0.05, 10)  # 100 * e^0.5',
        'exponential_growth(1, 1, 1)  # e',
      ],
      pedagogicalNotes: 'Demonstrates NumPy vectorization for scientific computing',
    } satisfies PanelExpression;

    expect(expression.panelId).toBe('python');
    expect(expression.code).toContain('numpy');
    expect(expression.examples).toHaveLength(2);
    expect(expression.pedagogicalNotes).toBeDefined();
  });
});
