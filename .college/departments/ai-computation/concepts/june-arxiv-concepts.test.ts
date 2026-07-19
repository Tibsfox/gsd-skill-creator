/**
 * AI Computation Department -- June-2026 arXiv concept tests.
 *
 * The 6 T1 concepts from AI-COMPUTATION-CONCEPT-SHORTLIST.md (modern
 * representation & retrieval). Same AIC-0x assertion set as Phase 690: valid
 * fields, id prefix, complexPlanePosition, relationships >= 2, panels is a Map
 * (empty allowed per the dept's wave spec), and dept-local targetId resolution.
 */

import { describe, it, expect } from 'vitest';
import {
  attentionReadoutGap,
  sparseAutoencoderDisentanglement,
  coldStartSafetyGap,
  lexicalDensityLimit,
  hyperbolicRetrievalGeometry,
  voronoiRetrievalBottleneck,
  // existing ai-computation- concepts referenced as resolution targets
  activationDeltaProbe,
  alignmentDrift,
  goalDrift,
  groundingFaithfulness,
  responseSemanticDrift,
  fourTierTrust,
  semanticChannel,
  rateDistortionDeductiveSource,
  localLinearitySteering,
} from './index.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const juneConcepts: RosettaConcept[] = [
  attentionReadoutGap,
  sparseAutoencoderDisentanglement,
  coldStartSafetyGap,
  lexicalDensityLimit,
  hyperbolicRetrievalGeometry,
  voronoiRetrievalBottleneck,
];

const juneConceptNames = [
  'attentionReadoutGap',
  'sparseAutoencoderDisentanglement',
  'coldStartSafetyGap',
  'lexicalDensityLimit',
  'hyperbolicRetrievalGeometry',
  'voronoiRetrievalBottleneck',
];

// Resolution target set for ai-computation- targetIds.
const allDeptConcepts: RosettaConcept[] = [
  ...juneConcepts,
  activationDeltaProbe,
  alignmentDrift,
  goalDrift,
  groundingFaithfulness,
  responseSemanticDrift,
  fourTierTrust,
  semanticChannel,
  rateDistortionDeductiveSource,
  localLinearitySteering,
];

describe('AI Computation Department -- June-2026 arXiv concepts', () => {

  describe('AICJ-01: Valid RosettaConcept fields', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=ai-computation, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('ai-computation');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('AICJ-02: id prefix ai-computation-', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s id starts with ai-computation-',
      (_n, c) => {
        expect(c.id.startsWith('ai-computation-')).toBe(true);
      }
    );
  });

  describe('AICJ-03: complexPlanePosition validation', () => {
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

  describe('AICJ-04: relationships (>= 2)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('AICJ-05: panels is a Map (empty allowed for this wave)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has panels as a Map',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('AICJ-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'ai-computation-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s ai-computation- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (math-*, data-science-*, etc.) accepted per D-13
        }
      }
    );
  });
});
