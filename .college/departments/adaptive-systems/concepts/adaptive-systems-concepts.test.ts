/**
 * Adaptive Systems Department concept tests -- Phase 679 (v1.49.568 Nonlinear Frontier).
 *
 * NOTE (N=1 by-design per D-13): with only 1 seeded concept
 * (lorenz-predictability-limit), the dept-local targetId.startsWith('adaptive-systems-')
 * branch has nothing to check -- the relationships[] array references cross-dept ids only
 * (math-fractal-geometry, math-exponential-decay). The test structure mirrors
 * multi-concept depts for parity; the assertion activates when the second adaptive-systems
 * concept ships. `relationships.length >= 2` remains the meaningful check for this concept.
 *
 * Covers: NLF-01, NLF-03 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import {
  lorenzPredictabilityLimit,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const allConcepts: RosettaConcept[] = [
  lorenzPredictabilityLimit,
];

const conceptNames = [
  'lorenzPredictabilityLimit',
];

describe('Adaptive Systems Department Concepts (Phase 679)', () => {

  describe('ADAPT-01: Valid RosettaConcept fields', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=adaptive-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('adaptive-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ADAPT-02: complexPlanePosition validation', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has valid complexPlanePosition (magnitude + angle)',
      (_n, c) => {
        expect(c.complexPlanePosition).toBeDefined();
        const pos = c.complexPlanePosition!;

        expect(typeof pos.real).toBe('number');
        expect(typeof pos.imaginary).toBe('number');
        expect(typeof pos.magnitude).toBe('number');
        expect(typeof pos.angle).toBe('number');

        const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
        expect(pos.magnitude).toBeCloseTo(expectedMag, 5);

        const expectedAngle = Math.atan2(pos.imaginary, pos.real);
        expect(pos.angle).toBeCloseTo(expectedAngle, 5);
      }
    );
  });

  describe('ADAPT-03: relationships', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >=2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ADAPT-04: panels', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has panels.size >= 3 with python + cpp + lisp',
      (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('lisp')).toBe(true);
      }
    );
  });

  describe('ADAPT-05: Dept-local targetId resolution', () => {
    const deptPrefix = 'adaptive-systems-';
    const localIds = new Set(allConcepts.map((c) => c.id));

    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within adaptive-systems dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (math-*, physics-*, etc.) accepted per D-13
        }
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts re-exports all 1 concepts', () => {
      expect(allConcepts).toHaveLength(1);
      for (const c of allConcepts) {
        expect(c).toBeDefined();
        expect(c.id).toBeTruthy();
      }
    });
  });
});
