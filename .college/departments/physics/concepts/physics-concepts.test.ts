/**
 * Physics Department concept tests -- Phase 679 (v1.49.568 Nonlinear Frontier).
 *
 * Validates all 4 new physics concepts (k41-cascade, primitive-equations,
 * reynolds-similarity, vorticity-stretching) have the required fields,
 * valid complexPlanePosition, relationships (>= 2), and a 3-panel Map
 * keyed by python + cpp + fortran.
 *
 * Covers: NLF-01, NLF-03 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import {
  k41Cascade,
  primitiveEquations,
  reynoldsSimilarity,
  vorticityStretching,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const allConcepts: RosettaConcept[] = [
  k41Cascade,
  primitiveEquations,
  reynoldsSimilarity,
  vorticityStretching,
];

const conceptNames = [
  'k41Cascade',
  'primitiveEquations',
  'reynoldsSimilarity',
  'vorticityStretching',
];

describe('Physics Department Concepts (Phase 679)', () => {

  describe('PHY-01: Valid RosettaConcept fields', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=physics, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('physics');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('PHY-02: complexPlanePosition validation', () => {
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

  describe('PHY-03: relationships', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >=2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('PHY-04: panels', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has panels.size >= 3 with python + cpp + fortran',
      (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('fortran')).toBe(true);
      }
    );
  });

  describe('PHY-05: Dept-local targetId resolution', () => {
    const deptPrefix = 'physics-';
    const localIds = new Set(allConcepts.map((c) => c.id));

    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within physics dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (math-*, phys-*, etc.) accepted per D-13
        }
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts re-exports all 4 concepts', () => {
      expect(allConcepts).toHaveLength(4);
      for (const c of allConcepts) {
        expect(c).toBeDefined();
        expect(c.id).toBeTruthy();
      }
    });
  });
});
