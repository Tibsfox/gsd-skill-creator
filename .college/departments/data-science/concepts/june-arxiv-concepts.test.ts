/**
 * Data-Science Department -- June-2026 arXiv concept tests.
 *
 * The 6 T1 concepts from DATA-SCIENCE-CONCEPT-SHORTLIST.md (modern inference &
 * uncertainty). Full DS-0x assertion set (fields, complexPlanePosition,
 * relationships >= 2, python+cpp+unison panels, data-science- id prefix, and
 * dept-local targetId resolution against the full barrel).
 */

import { describe, it, expect } from 'vitest';
import {
  // June-2026 arXiv cohort
  conformalPrediction,
  predictionCalibration,
  predictionPoweredInference,
  sequentialTestingByBetting,
  dSeparation,
  densityEvolution,
  // existing data-science concepts (resolution target set for data-science- refs)
  dataAssimilation4dvar,
  aiWeatherPipeline,
  semanticDrift,
  knowledgeDrift,
  driftDetection,
  compressionSpectrum,
} from './index.js';
import { causalDensityRatio } from './causal-density-ratio.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const juneConcepts: RosettaConcept[] = [
  conformalPrediction,
  predictionCalibration,
  predictionPoweredInference,
  sequentialTestingByBetting,
  dSeparation,
  densityEvolution,
];

const juneConceptNames = [
  'conformalPrediction',
  'predictionCalibration',
  'predictionPoweredInference',
  'sequentialTestingByBetting',
  'dSeparation',
  'densityEvolution',
];

// Every data-science- concept in the barrel -- the resolution target set.
const allDeptConcepts: RosettaConcept[] = [
  ...juneConcepts,
  dataAssimilation4dvar,
  aiWeatherPipeline,
  semanticDrift,
  knowledgeDrift,
  driftDetection,
  compressionSpectrum,
  causalDensityRatio,
  conformalPrediction,
];

describe('Data-Science Department -- June-2026 arXiv concepts', () => {

  describe('DS-J-01: Valid RosettaConcept fields', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=data-science, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('data-science');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('DS-J-02: complexPlanePosition validation', () => {
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

  describe('DS-J-03: relationships (>= 2)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('DS-J-04: panels python + cpp + unison', () => {
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

  describe('DS-J-05: id prefix data-science-', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s id starts with data-science-',
      (_n, c) => {
        expect(c.id.startsWith('data-science-')).toBe(true);
      }
    );
  });

  describe('DS-J-06: Dept-local targetId resolution (data-science- against full barrel)', () => {
    const deptPrefix = 'data-science-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s data-science- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (data-*, math-*, etc.) accepted per D-13
        }
      }
    );
  });
});
