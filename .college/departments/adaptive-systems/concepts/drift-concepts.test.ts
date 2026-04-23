/**
 * Adaptive Systems Department drift concept tests -- Phase 690 (v1.49.569 Drift in LLM Systems).
 *
 * Validates the two new adaptive-systems drift concepts (context-equilibrium,
 * agent-stability-index) have required fields, valid complexPlanePosition,
 * and >=2 relationships. Panels are intentionally empty for this wave --
 * panel population is a follow-up milestone concern (per Phase 690 spec).
 *
 * Covers: DRIFT-01, DRIFT-05 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import {
  contextEquilibrium,
  agentStabilityIndex,
  lorenzPredictabilityLimit,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

// All adaptive-systems concepts — needed so dept-local targetId resolution covers
// pre-existing concepts (lorenzPredictabilityLimit) referenced by new drift concepts.
const allDeptConcepts: RosettaConcept[] = [
  lorenzPredictabilityLimit,
  contextEquilibrium,
  agentStabilityIndex,
];

const driftConcepts: RosettaConcept[] = [
  contextEquilibrium,
  agentStabilityIndex,
];

const driftConceptNames = [
  'contextEquilibrium',
  'agentStabilityIndex',
];

describe('Adaptive Systems Department Drift Concepts (Phase 690)', () => {

  describe('ADAPT-DRIFT-01: Valid RosettaConcept fields', () => {
    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=adaptive-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('adaptive-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ADAPT-DRIFT-02: id prefix', () => {
    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
      '%s id starts with adaptive-systems-',
      (_n, c) => {
        expect(c.id.startsWith('adaptive-systems-')).toBe(true);
      }
    );
  });

  describe('ADAPT-DRIFT-03: complexPlanePosition validation', () => {
    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
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

  describe('ADAPT-DRIFT-04: relationships', () => {
    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
      '%s has >=2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ADAPT-DRIFT-05: panels empty (Phase 690 spec -- panels are follow-up milestone concern)', () => {
    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
      '%s has panels as a Map (empty is valid for this wave)',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('ADAPT-DRIFT-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'adaptive-systems-';
    // Use all dept concepts so pre-existing concepts (lorenz) resolve correctly
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(driftConcepts.map((c, i) => [driftConceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within adaptive-systems dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (ai-computation-*, data-science-*, etc.) are accepted
        }
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts exports all drift concepts', () => {
      expect(contextEquilibrium).toBeDefined();
      expect(agentStabilityIndex).toBeDefined();
    });
  });
});
