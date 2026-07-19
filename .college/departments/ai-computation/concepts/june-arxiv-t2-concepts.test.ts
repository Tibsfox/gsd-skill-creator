/**
 * AI Computation Department -- June-2026 arXiv T2 concept tests.
 *
 * The 9 T2 concepts from AI-COMPUTATION-CONCEPT-SHORTLIST.md (RAG + representation
 * probing). Same AICT-0x assertion set: valid fields, id prefix ai-computation-,
 * complexPlanePosition consistency, relationships >= 2, panels is a Map, and
 * dept-local targetId resolution (external intent-router / cross-dept refs accepted).
 * Resolution targets cover all 32 existing dept concepts; six orphans not exported
 * from the barrel are imported directly from their files.
 */

import { describe, it, expect } from 'vitest';
import {
  calibratedRetrievalBudget,
  citationAttributionCircuit,
  distributedAttributeRetrieval,
  embeddingNormSpecificity,
  entityRebindingCircuit,
  knowledgeConflictSteering,
  lexicalAnchorProbe,
  permutationInvariantEmbedding,
  utilizationAccuracyGap,
  // existing barrel-exported concepts as resolution targets
  activationDeltaProbe,
  alignmentDrift,
  attentionReadoutGap,
  boundedLearningTheorem,
  capabilityEvolution,
  coldStartSafetyGap,
  dataFreeMiaAttack,
  evidenceCentricReasoning,
  experienceCompressionSpectrum,
  forensicResidualPhysics,
  fourTierTrust,
  goalDrift,
  groundingFaithfulness,
  harnessAsObject,
  hyperbolicRetrievalGeometry,
  koopmanBilinearForm,
  lexicalDensityLimit,
  localLinearitySteering,
  rateDistortionDeductiveSource,
  responseSemanticDrift,
  semanticChannel,
  skilldexConformance,
  sparseAutoencoderDisentanglement,
  spatiotemporalLinkFormation,
  stackelbergDrainability,
  voronoiRetrievalBottleneck,
} from './index.js';
import { characteristicFunctionTest } from './characteristic-function-test.js';
import { instructionTensorPattern } from './instruction-tensor-pattern.js';
import { isotropicEmbedding } from './isotropic-embedding.js';
import { jepaKernelPlanning } from './jepa-kernel-planning.js';
import { latentWorldModel } from './latent-world-model.js';
import { megakernelArchitectureRhyme } from './megakernel-architecture-rhyme.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const t2Concepts: RosettaConcept[] = [
  calibratedRetrievalBudget,
  citationAttributionCircuit,
  distributedAttributeRetrieval,
  embeddingNormSpecificity,
  entityRebindingCircuit,
  knowledgeConflictSteering,
  lexicalAnchorProbe,
  permutationInvariantEmbedding,
  utilizationAccuracyGap,
];

const t2ConceptNames = [
  'calibratedRetrievalBudget',
  'citationAttributionCircuit',
  'distributedAttributeRetrieval',
  'embeddingNormSpecificity',
  'entityRebindingCircuit',
  'knowledgeConflictSteering',
  'lexicalAnchorProbe',
  'permutationInvariantEmbedding',
  'utilizationAccuracyGap',
];

// Resolution target set: T2 cohort + all 32 existing dept concepts.
const allDeptConcepts: RosettaConcept[] = [
  ...t2Concepts,
  activationDeltaProbe,
  alignmentDrift,
  attentionReadoutGap,
  boundedLearningTheorem,
  capabilityEvolution,
  characteristicFunctionTest,
  coldStartSafetyGap,
  dataFreeMiaAttack,
  evidenceCentricReasoning,
  experienceCompressionSpectrum,
  forensicResidualPhysics,
  fourTierTrust,
  goalDrift,
  groundingFaithfulness,
  harnessAsObject,
  hyperbolicRetrievalGeometry,
  instructionTensorPattern,
  isotropicEmbedding,
  jepaKernelPlanning,
  koopmanBilinearForm,
  latentWorldModel,
  lexicalDensityLimit,
  localLinearitySteering,
  megakernelArchitectureRhyme,
  rateDistortionDeductiveSource,
  responseSemanticDrift,
  semanticChannel,
  skilldexConformance,
  sparseAutoencoderDisentanglement,
  spatiotemporalLinkFormation,
  stackelbergDrainability,
  voronoiRetrievalBottleneck,
];

describe('AI Computation Department -- June-2026 arXiv T2 concepts', () => {
  describe('AICT-01: Valid RosettaConcept fields', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=ai-computation, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('ai-computation');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('AICT-02: id prefix ai-computation-', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s id starts with ai-computation-',
      (_n, c) => {
        expect(c.id.startsWith('ai-computation-')).toBe(true);
      }
    );
  });

  describe('AICT-03: complexPlanePosition validation', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
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

  describe('AICT-04: relationships (>= 2)', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('AICT-05: panels is a Map (empty allowed for this wave)', () => {
    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s has panels as a Map',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('AICT-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'ai-computation-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(t2Concepts.map((c, i) => [t2ConceptNames[i], c] as const))(
      '%s ai-computation- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (intent-router skill, cross-dept) accepted
        }
      }
    );
  });
});
