/**
 * AI-Computation Department -- June-2026 additional-material scan T1 concept tests.
 *
 * Light convention (empty panels). Assertions: valid fields, id prefix
 * ai-computation-, complexPlanePosition consistency, relationships >= 2,
 * panels is a Map, dept-local targetId resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  instructionSetRecovery,
  // resolution targets
  activationDeltaProbe,
  attentionReadoutGap,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const concepts: RosettaConcept[] = [instructionSetRecovery];
const conceptNames = ['instructionSetRecovery'];
const allDeptConcepts: RosettaConcept[] = [
  ...concepts,
  activationDeltaProbe,
  attentionReadoutGap,
];

describe('AI-Computation Department -- additional-material T1 concepts', () => {
  describe('AICA-01: Valid fields + domain', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has id, name, domain=ai-computation, description', (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('ai-computation');
        expect(c.description.length).toBeGreaterThan(10);
      });
  });
  describe('AICA-02: id prefix ai-computation-', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s id starts with ai-computation-', (_n, c) => {
        expect(c.id.startsWith('ai-computation-')).toBe(true);
      });
  });
  describe('AICA-03: complexPlanePosition', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s magnitude and angle agree', (_n, c) => {
        const p = c.complexPlanePosition!;
        expect(p.magnitude).toBeCloseTo(Math.sqrt(p.real * p.real + p.imaginary * p.imaginary), 5);
        expect(p.angle).toBeCloseTo(Math.atan2(p.imaginary, p.real), 5);
      });
  });
  describe('AICA-04: relationships (>= 2)', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has >= 2 relationships', (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      });
  });
  describe('AICA-05: panels is a Map', () => {
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s has panels as a Map', (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      });
  });
  describe('AICA-06: Dept-local targetId resolution', () => {
    const localIds = new Set(allDeptConcepts.map((c) => c.id));
    it.each(concepts.map((c, i) => [conceptNames[i], c] as const))(
      '%s ai-computation- targetIds resolve', (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith('ai-computation-')) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
        }
      });
  });
});
