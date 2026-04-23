/**
 * AI Computation Department concept tests -- Phase 690 (v1.49.569 Drift in LLM Systems).
 *
 * Validates the five new ai-computation drift concepts have required fields,
 * valid complexPlanePosition, and >=2 relationships. Panels are intentionally
 * empty for this wave -- panel population is a follow-up milestone concern
 * (per Phase 690 spec).
 *
 * Covers: DRIFT-01, DRIFT-05 (dept-local).
 */

import { describe, it, expect } from 'vitest';
import {
  activationDeltaProbe,
  alignmentDrift,
  goalDrift,
  groundingFaithfulness,
  responseSemanticDrift,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const allConcepts: RosettaConcept[] = [
  activationDeltaProbe,
  alignmentDrift,
  goalDrift,
  groundingFaithfulness,
  responseSemanticDrift,
];

const conceptNames = [
  'activationDeltaProbe',
  'alignmentDrift',
  'goalDrift',
  'groundingFaithfulness',
  'responseSemanticDrift',
];

describe('AI Computation Department Concepts (Phase 690)', () => {

  describe('AIC-01: Valid RosettaConcept fields', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=ai-computation, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('ai-computation');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('AIC-02: id prefix', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s id starts with ai-computation-',
      (_n, c) => {
        expect(c.id.startsWith('ai-computation-')).toBe(true);
      }
    );
  });

  describe('AIC-03: complexPlanePosition validation', () => {
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

  describe('AIC-04: relationships', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >=2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('AIC-05: panels empty (Phase 690 spec -- panels are follow-up milestone concern)', () => {
    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has panels as a Map (empty is valid for this wave)',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('AIC-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'ai-computation-';
    const localIds = new Set(allConcepts.map((c) => c.id));

    it.each(allConcepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s dept-local targetIds resolve within ai-computation dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (adaptive-systems-*, data-science-*, etc.) are accepted
        }
      }
    );
  });

  describe('barrel export', () => {
    it('index.ts re-exports all 5 concepts', () => {
      expect(allConcepts).toHaveLength(5);
      for (const c of allConcepts) {
        expect(c).toBeDefined();
        expect(c.id).toBeTruthy();
      }
    });
  });
});
