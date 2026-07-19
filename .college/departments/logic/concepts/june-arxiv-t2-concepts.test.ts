/**
 * logic Department -- June-2026 arXiv T2 concept tests.
 *
 * Heavy-convention T2 concepts (populated python/cpp/unison panels + try-sessions).
 * Assertions: valid fields + domain, complexPlanePosition, relationships >= 2,
 * three panels, id prefix logic-, and dept-local targetId resolution
 * (cross-dept / foundational refs accepted).
 */

import { describe, it, expect } from 'vitest';
import {
  kuratowskiOrderedPair,
  definiteDescriptions,
  deonticLogic,
  // existing barrel concepts as resolution targets
  aiVerifiedProof,
  manyValuedLogic,
  abductiveReasoning,
} from './index.js';
import { defeasibleDeonticCompilation } from './defeasible-deontic-compilation.js';
import { instructionAutoformalization } from './instruction-autoformalization.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const t2Concepts: RosettaConcept[] = [
  kuratowskiOrderedPair,
  definiteDescriptions,
  deonticLogic,
];
const t2ConceptNames = [
  'kuratowskiOrderedPair',
  'definiteDescriptions',
  'deonticLogic',
];
const allDeptConcepts: RosettaConcept[] = [
  ...t2Concepts,
  aiVerifiedProof,
  manyValuedLogic,
  abductiveReasoning,
  defeasibleDeonticCompilation,
  instructionAutoformalization,
];

describe('logic Department -- June-2026 arXiv T2 concepts', () => {
  describe('T2-01: Valid fields + domain', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has id, name, domain=logic, description', (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('logic');
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
  describe('T2-04: panels python + cpp + unison', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s panels.size >= 3 with python, cpp, unison', (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('unison')).toBe(true);
      });
  });
  describe('T2-05: id prefix logic-', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s id starts with logic-', (_n, c) => {
        expect(c.id.startsWith('logic-')).toBe(true);
      });
  });
  describe('T2-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'logic-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s logic- targetIds resolve', (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
        }
      });
  });
});
