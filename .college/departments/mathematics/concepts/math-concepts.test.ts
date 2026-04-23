/**
 * Mathematics Department concept tests -- validates all 12 concepts have
 * required fields, valid complexPlanePosition, cross-references, and
 * correct wing assignments. Phase 679 extends to the 5 new concepts with
 * a stricter D-09 assertion set (panels.size >= 3 + dept-local targetId
 * resolution + relationships.length >= 2).
 *
 * Covers: MATH-01, MATH-03, NLF-01
 */

import { describe, it, expect } from 'vitest';
import {
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
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

// ─── All 12 Concepts ───────────────────────────────────────────────────────

const allConcepts: RosettaConcept[] = [
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
];

const conceptNames = [
  'exponentialDecay',
  'trigFunctions',
  'complexNumbers',
  'eulerFormula',
  'ratiosProportions',
  'logarithmicScales',
  'fractalGeometry',
  'solitons',
  'blowUpDynamics',
  'scaleCriticalEquations',
  'erdosProblemIndex',
  'millenniumProblemCatalogue',
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Mathematics Department Concepts', () => {

  describe('MATH-01: All 12 concepts have valid RosettaConcept fields', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=mathematics, and description',
      (_name, concept) => {
        expect(concept.id).toBeTruthy();
        expect(concept.name).toBeTruthy();
        expect(concept.domain).toBe('mathematics');
        expect(concept.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('MATH-03: complexPlanePosition validation', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has valid complexPlanePosition with magnitude and angle',
      (_name, concept) => {
        expect(concept.complexPlanePosition).toBeDefined();
        const pos = concept.complexPlanePosition!;

        // Must have all four fields
        expect(typeof pos.real).toBe('number');
        expect(typeof pos.imaginary).toBe('number');
        expect(typeof pos.magnitude).toBe('number');
        expect(typeof pos.angle).toBe('number');

        // Magnitude must equal sqrt(real^2 + imaginary^2)
        const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
        expect(pos.magnitude).toBeCloseTo(expectedMag, 5);

        // Angle must equal atan2(imaginary, real)
        const expectedAngle = Math.atan2(pos.imaginary, pos.real);
        expect(pos.angle).toBeCloseTo(expectedAngle, 5);
      }
    );

    it('concrete concepts have smaller theta than abstract ones', () => {
      // ratios (pi/12) should be more concrete than euler (pi/2)
      const ratiosAngle = ratiosProportions.complexPlanePosition!.angle;
      const eulerAngle = eulerFormula.complexPlanePosition!.angle;
      expect(ratiosAngle).toBeLessThan(eulerAngle);
    });
  });

  describe('Cross-references and relationships', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has at least one relationship',
      (_name, concept) => {
        expect(concept.relationships.length).toBeGreaterThanOrEqual(1);
      }
    );

    it('at least one concept has a cross-reference to culinary arts', () => {
      const hasCulinaryRef = allConcepts.some(c =>
        c.relationships.some(r =>
          r.type === 'cross-reference' && r.targetId.includes('culinary')
        )
      );
      expect(hasCulinaryRef).toBe(true);
    });
  });

  describe('Wing coverage', () => {
    it('concepts cover all 4 wings: Algebra, Geometry, Calculus, Complex Analysis', () => {
      // ratios and logarithmic -> Algebra
      // trig -> Geometry
      // exponential decay -> Calculus
      // complex numbers, euler, fractal -> Complex Analysis
      const ids = allConcepts.map(c => c.id);
      expect(ids).toContain('math-ratios');
      expect(ids).toContain('math-logarithmic-scales');
      expect(ids).toContain('math-trig-functions');
      expect(ids).toContain('math-exponential-decay');
      expect(ids).toContain('math-complex-numbers');
      expect(ids).toContain('math-euler-formula');
      expect(ids).toContain('math-fractal-geometry');
      // Phase 679 additions
      expect(ids).toContain('math-solitons');
      expect(ids).toContain('math-blow-up-dynamics');
      expect(ids).toContain('math-scale-critical-equations');
      expect(ids).toContain('math-erdos-problem-index');
      expect(ids).toContain('math-millennium-problem-catalogue');
    });
  });

  describe('panels Map', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has an initialized panels Map',
      (_name, concept) => {
        expect(concept.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts re-exports all 12 concepts', () => {
      expect(allConcepts).toHaveLength(12);
      // Each concept is defined (not undefined)
      for (const concept of allConcepts) {
        expect(concept).toBeDefined();
        expect(concept.id).toBeTruthy();
      }
    });
  });
});

// ─── Phase 679 — new concept assertions ────────────────────────────────────

const newConcepts: RosettaConcept[] = [
  solitons,
  blowUpDynamics,
  scaleCriticalEquations,
  erdosProblemIndex,
  millenniumProblemCatalogue,
];

const newConceptNames = [
  'solitons',
  'blowUpDynamics',
  'scaleCriticalEquations',
  'erdosProblemIndex',
  'millenniumProblemCatalogue',
];

describe('Phase 679 — new concept assertions', () => {

  describe('D-09: stricter relationship count (>= 2) on the 5 new concepts', () => {
    it.each(newConcepts.map((c, i) => [newConceptNames[i], c] as const))(
      '%s has at least 2 relationships',
      (_name, concept) => {
        expect(concept.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('D-09: panels Map populated with python + cpp + lisp', () => {
    it.each(newConcepts.map((c, i) => [newConceptNames[i], c] as const))(
      '%s has panels.size >= 3 with python, cpp, lisp keys',
      (_name, concept) => {
        expect(concept.panels.size).toBeGreaterThanOrEqual(3);
        expect(concept.panels.has('python')).toBe(true);
        expect(concept.panels.has('cpp')).toBe(true);
        expect(concept.panels.has('lisp')).toBe(true);
      }
    );
  });

  describe('D-09: Dept-local targetId resolution', () => {
    const deptPrefix = 'math-';
    const localIds = new Set(allConcepts.map((c) => c.id));

    it.each(newConcepts.map((c, i) => [newConceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within the dept',
      (_name, concept) => {
        for (const rel of concept.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (culinary-*, cross-dept refs) accepted per D-13
        }
      }
    );
  });
});
