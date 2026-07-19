/**
 * ai-computation Department -- June-2026 additional-scan T2 concept tests.
 * Assertions: valid fields, id prefix, complexPlanePosition, relationships >= 2,
 * panels, and dept-local targetId resolution (namespace-import resolution set).
 */

import { describe, it, expect } from 'vitest';
import * as barrel from './index.js';
import { blindToolDeference, conflictRegimeRag, lineageInheritedTruthfulHeads, selfRecognitionSignatures, costAwareEvidenceSelection, contextualEntrainment, categoricalPriorLockIn, matchedEvidenceUtilization } from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const concepts: RosettaConcept[] = [blindToolDeference, conflictRegimeRag, lineageInheritedTruthfulHeads, selfRecognitionSignatures, costAwareEvidenceSelection, contextualEntrainment, categoricalPriorLockIn, matchedEvidenceUtilization];
const names = ["blindToolDeference", "conflictRegimeRag", "lineageInheritedTruthfulHeads", "selfRecognitionSignatures", "costAwareEvidenceSelection", "contextualEntrainment", "categoricalPriorLockIn", "matchedEvidenceUtilization"];
const localIds = new Set(Object.values(barrel as Record<string, RosettaConcept>).map((c) => c.id));

describe('ai-computation Department -- additional-scan T2 concepts', () => {
  describe('AICX-01: Valid fields + domain', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s valid', (_n, c) => {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.domain).toBe('ai-computation');
      expect(c.description.length).toBeGreaterThan(10);
    });
  });
  describe('AICX-02: id prefix ai-computation-', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s prefix', (_n, c) => {
      expect(c.id.startsWith('ai-computation-')).toBe(true);
    });
  });
  describe('AICX-03: complexPlanePosition', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s position', (_n, c) => {
      const p = c.complexPlanePosition!;
      expect(p.magnitude).toBeCloseTo(Math.sqrt(p.real * p.real + p.imaginary * p.imaginary), 5);
      expect(p.angle).toBeCloseTo(Math.atan2(p.imaginary, p.real), 5);
    });
  });
  describe('AICX-04: relationships (>= 2)', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s rels', (_n, c) => {
      expect(c.relationships.length).toBeGreaterThanOrEqual(2);
    });
  });
  describe('AICX-05: panels', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s panels', (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
    });
  });
  describe('AICX-06: Dept-local targetId resolution', () => {
    it.each(concepts.map((c, i) => [names[i], c] as const))('%s resolve', (_n, c) => {
      for (const rel of c.relationships) {
        if (rel.targetId.startsWith('ai-computation-')) {
          expect(localIds.has(rel.targetId)).toBe(true);
        }
      }
    });
  });
});
