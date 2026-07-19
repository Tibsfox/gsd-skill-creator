/**
 * mathematics Department -- June-2026 arXiv T2 concept tests.
 *
 * Heavy-convention T2 concepts (populated python/cpp/lisp panels + try-sessions).
 * Assertions: valid fields + domain, complexPlanePosition, relationships >= 2,
 * three panels, id prefix math-, and dept-local targetId resolution
 * (cross-dept / foundational refs accepted).
 */

import { describe, it, expect } from 'vitest';
import {
  bregmanProjection,
  cayleyGraphFourierEmbedding,
  chipFiringGraphRiemannRoch,
  discreteNodalDomains,
  equilateralDimension,
  functorialDynamicsSemantics,
  geometricGraphManifoldRecovery,
  measureQuantization,
  tailIntegralMomentRepresentation,
  wassersteinGradientFlowLangevin,
  // existing barrel concepts as resolution targets
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
  solitons,
  blowUpDynamics,
  scaleCriticalEquations,
  erdosProblemIndex,
  millenniumProblemCatalogue,
  coherentFunctor,
  ollivierRicciCurvature,
  hourglassPersistence,
  tonnetzLattice,
  optimalTransport,
  perronFrobeniusCentrality,
  aperiodicWangTiles,
  bakryEmeryCurvatureDimension,
  informationGeometry,
  dualSpaceInterpolation,
  transformUncertaintyPrinciple,
} from './index.js';
import { geometricGraphManifoldRecovery } from './geometric-graph-manifold-recovery.js';
import { bregmanProjection } from './bregman-projection.js';
import { cayleyGraphFourierEmbedding } from './cayley-graph-fourier-embedding.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const t2Concepts: RosettaConcept[] = [
  bregmanProjection,
  cayleyGraphFourierEmbedding,
  chipFiringGraphRiemannRoch,
  discreteNodalDomains,
  equilateralDimension,
  functorialDynamicsSemantics,
  geometricGraphManifoldRecovery,
  measureQuantization,
  tailIntegralMomentRepresentation,
  wassersteinGradientFlowLangevin,
];
const t2ConceptNames = [
  'bregmanProjection',
  'cayleyGraphFourierEmbedding',
  'chipFiringGraphRiemannRoch',
  'discreteNodalDomains',
  'equilateralDimension',
  'functorialDynamicsSemantics',
  'geometricGraphManifoldRecovery',
  'measureQuantization',
  'tailIntegralMomentRepresentation',
  'wassersteinGradientFlowLangevin',
];
const allDeptConcepts: RosettaConcept[] = [
  ...t2Concepts,
  exponentialDecay,
  trigFunctions,
  complexNumbers,
  eulerFormula,
  ratiosProportions,
  logarithmicScales,
  fractalGeometry,
  solitons,
  blowUpDynamics,
  scaleCriticalEquations,
  erdosProblemIndex,
  millenniumProblemCatalogue,
  coherentFunctor,
  ollivierRicciCurvature,
  hourglassPersistence,
  tonnetzLattice,
  optimalTransport,
  perronFrobeniusCentrality,
  aperiodicWangTiles,
  bakryEmeryCurvatureDimension,
  informationGeometry,
  dualSpaceInterpolation,
  transformUncertaintyPrinciple,
  geometricGraphManifoldRecovery,
  bregmanProjection,
  cayleyGraphFourierEmbedding,
];

describe('mathematics Department -- June-2026 arXiv T2 concepts', () => {
  describe('T2-01: Valid fields + domain', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has id, name, domain=mathematics, description', (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('mathematics');
        expect(c.description.length).toBeGreaterThan(10);
      });
  });
  describe('T2-02: complexPlanePosition', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s magnitude and angle agree', (_n, c) => {
        const p = c.complexPlanePosition!;
        expect(p.magnitude).toBeCloseTo(Math.sqrt(p.real * p.real + p.imaginary * p.imaginary), 5);
        expect(p.angle).toBeCloseTo(Math.atan2(p.imaginary, p.real), 5);
      });
  });
  describe('T2-03: relationships (>= 2)', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has >= 2 relationships', (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      });
  });
  describe('T2-04: panels python + cpp + lisp', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s panels.size >= 3 with python, cpp, lisp', (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('lisp')).toBe(true);
      });
  });
  describe('T2-05: id prefix math-', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s id starts with math-', (_n, c) => {
        expect(c.id.startsWith('math-')).toBe(true);
      });
  });
  describe('T2-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'math-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s math- targetIds resolve', (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
        }
      });
  });
});
