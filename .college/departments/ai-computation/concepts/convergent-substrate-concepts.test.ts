/**
 * AI Computation Department Convergent Substrate concept tests -- Phase 707 (v1.49.570).
 *
 * Validates the four new ai-computation convergent-substrate concepts have required
 * fields, valid complexPlanePosition, >=2 relationships, and proper dept-local
 * targetId resolution. Panels remain empty (same convention as Phase 690 drift).
 *
 * Covers: CONV-11 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import {
  capabilityEvolution,
  harnessAsObject,
  evidenceCentricReasoning,
  fourTierTrust,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const convergentConcepts: RosettaConcept[] = [
  capabilityEvolution,
  harnessAsObject,
  evidenceCentricReasoning,
  fourTierTrust,
];

const conceptNames = [
  'capabilityEvolution',
  'harnessAsObject',
  'evidenceCentricReasoning',
  'fourTierTrust',
];

describe('AI Computation Department Convergent Substrate Concepts (Phase 707)', () => {

  describe('CONV-AIC-01: Valid RosettaConcept fields', () => {
    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=ai-computation, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('ai-computation');
        expect(c.description.length).toBeGreaterThan(100);
      }
    );
  });

  describe('CONV-AIC-02: id prefix', () => {
    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s id starts with ai-computation-',
      (_n, c) => {
        expect(c.id.startsWith('ai-computation-')).toBe(true);
      }
    );
  });

  describe('CONV-AIC-03: complexPlanePosition validation', () => {
    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has valid complexPlanePosition',
      (_n, c) => {
        expect(c.complexPlanePosition).toBeDefined();
        const pos = c.complexPlanePosition!;
        const expectedMag = Math.sqrt(pos.real * pos.real + pos.imaginary * pos.imaginary);
        expect(pos.magnitude).toBeCloseTo(expectedMag, 5);
        const expectedAngle = Math.atan2(pos.imaginary, pos.real);
        expect(pos.angle).toBeCloseTo(expectedAngle, 5);
      }
    );
  });

  describe('CONV-AIC-04: relationships', () => {
    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >=2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('CONV-AIC-05: relationship fields', () => {
    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s relationships each have type, targetId, description',
      (_n, c) => {
        for (const rel of c.relationships) {
          expect(rel.type).toBeTruthy();
          expect(rel.targetId).toBeTruthy();
          expect(rel.description).toBeTruthy();
          expect(rel.description.length).toBeGreaterThan(20);
        }
      }
    );
  });

  describe('CONV-AIC-06: dept-local targetId resolution', () => {
    const deptPrefix = 'ai-computation-';
    const localIds = new Set(convergentConcepts.map((c) => c.id));

    it.each(convergentConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within the new convergent-substrate set',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            // Either resolves within the new convergent concepts OR was part of
            // the drift Phase 690 set — both are valid inter-dept references
            const isConvergent = localIds.has(rel.targetId);
            const isDriftEra = [
              'ai-computation-activation-delta-probe',
              'ai-computation-alignment-drift',
              'ai-computation-goal-drift',
              'ai-computation-grounding-faithfulness',
              'ai-computation-response-semantic-drift',
            ].includes(rel.targetId);
            expect(isConvergent || isDriftEra, `unknown dept-local target: ${rel.targetId}`).toBe(true);
          }
        }
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts re-exports all 4 convergent concepts', () => {
      expect(convergentConcepts).toHaveLength(4);
      for (const c of convergentConcepts) {
        expect(c).toBeDefined();
        expect(c.id).toBeTruthy();
      }
    });
  });
});
