/**
 * Logic Department -- June-2026 arXiv concept tests.
 *
 * The 2 T1 concepts from SMALL-DEPARTMENTS-CONCEPT-SHORTLIST.md. Full LOG-0x
 * assertion set: fields, complexPlanePosition, relationships >= 2,
 * python+cpp+unison panels, logic- id prefix, and dept-local targetId resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  manyValuedLogic,
  abductiveReasoning,
  aiVerifiedProof,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const juneConcepts: RosettaConcept[] = [manyValuedLogic, abductiveReasoning];
const juneConceptNames = ['manyValuedLogic', 'abductiveReasoning'];

// Resolution target set for logic- targetIds (log-* foundational + math-* are external per D-13).
const allDeptConcepts: RosettaConcept[] = [...juneConcepts, aiVerifiedProof];

describe('Logic Department -- June-2026 arXiv concepts', () => {

  describe('LOGJ-01: Valid RosettaConcept fields', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=logic, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('logic');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('LOGJ-02: complexPlanePosition validation', () => {
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

  describe('LOGJ-03: relationships (>= 2)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('LOGJ-04: panels python + cpp + unison', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has panels.size >= 3 with python, cpp, unison',
      (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('unison')).toBe(true);
      }
    );
  });

  describe('LOGJ-05: id prefix logic-', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s id starts with logic-',
      (_n, c) => {
        expect(c.id.startsWith('logic-')).toBe(true);
      }
    );
  });

  describe('LOGJ-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'logic-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s logic- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (log-* foundational, math-*, etc.) accepted per D-13
        }
      }
    );
  });
});
