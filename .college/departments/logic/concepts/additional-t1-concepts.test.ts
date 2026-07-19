/**
 * logic Department -- June-2026 additional-material scan T1 concept tests.
 *
 * Heavy convention (populated python/cpp/unison panels + try-session).
 * Assertions: valid fields, complexPlanePosition, relationships >= 2, three
 * panels, id prefix logic-, and dept-local targetId resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  instructionAutoformalization,
  // resolution targets
  deonticLogic,
  aiVerifiedProof,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const concepts: RosettaConcept[] = [instructionAutoformalization];
const conceptNames = ['instructionAutoformalization'];
const allDeptConcepts: RosettaConcept[] = [
  ...concepts,
  deonticLogic,
  aiVerifiedProof,
];

describe('logic Department -- additional-material T1 concepts', () => {
  describe('LA-01: Valid fields + domain', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has id, name, domain=logic, description', (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('logic');
        expect(c.description.length).toBeGreaterThan(10);
      });
  });
  describe('LA-02: complexPlanePosition', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s magnitude and angle agree', (_n, c) => {
        const p = c.complexPlanePosition!;
        expect(p.magnitude).toBeCloseTo(Math.sqrt(p.real * p.real + p.imaginary * p.imaginary), 5);
        expect(p.angle).toBeCloseTo(Math.atan2(p.imaginary, p.real), 5);
      });
  });
  describe('LA-03: relationships (>= 2)', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >= 2 relationships', (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      });
  });
  describe('LA-04: panels python + cpp + unison', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s panels.size >= 3 with python, cpp, unison', (_n, c) => {
        expect(c.panels.size).toBeGreaterThanOrEqual(3);
        expect(c.panels.has('python')).toBe(true);
        expect(c.panels.has('cpp')).toBe(true);
        expect(c.panels.has('unison')).toBe(true);
      });
  });
  describe('LA-05: id prefix logic-', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s id starts with logic-', (_n, c) => {
        expect(c.id.startsWith('logic-')).toBe(true);
      });
  });
  describe('LA-06: Dept-local targetId resolution', () => {
    const localIds = new Set(allDeptConcepts.map((c) => c.id));
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s logic- targetIds resolve', (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith('logic-')) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
        }
      });
  });
});
