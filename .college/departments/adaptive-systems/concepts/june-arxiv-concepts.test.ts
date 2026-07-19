/**
 * Adaptive Systems Department -- June-2026 arXiv concept tests.
 *
 * The 1 T1 concept from SMALL-DEPARTMENTS-CONCEPT-SHORTLIST.md. Full ADAPT-0x
 * assertion set: fields, complexPlanePosition, relationships >= 2,
 * python+cpp+lisp panels, and dept-local targetId resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  lyapunovGradientStability,
  lorenzPredictabilityLimit,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const juneConcepts: RosettaConcept[] = [lyapunovGradientStability];
const juneConceptNames = ['lyapunovGradientStability'];

// Resolution target set for adaptive-systems- targetIds (math-* refs are external per D-13).
const allDeptConcepts: RosettaConcept[] = [...juneConcepts, lorenzPredictabilityLimit];

describe('Adaptive Systems Department -- June-2026 arXiv concepts', () => {

  describe('ADAPTJ-01: Valid RosettaConcept fields', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=adaptive-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('adaptive-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ADAPTJ-02: complexPlanePosition validation', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s complexPlanePosition magnitude and angle agree with real/imaginary',
      (_n, c) => {
        const pos = c.complexPlanePosition!;
        expect(pos).toBeDefined();
        const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
        expect(pos.magnitude).toBeCloseTo(expectedMag, 5);
        const expectedAngle = Math.atan2(pos.imaginary, pos.real);
        expect(pos.angle).toBeCloseTo(expectedAngle, 5);
      }
    );
  });

  describe('ADAPTJ-03: relationships (>= 2)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ADAPTJ-04: panels python + cpp + lisp', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has panels.size >= 3 with python, cpp, lisp',
      (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('lisp')).toBe(true);
      }
    );
  });

  describe('ADAPTJ-05: Dept-local targetId resolution', () => {
    const deptPrefix = 'adaptive-systems-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s adaptive-systems- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (math-*, etc.) accepted per D-13
        }
      }
    );
  });
});
