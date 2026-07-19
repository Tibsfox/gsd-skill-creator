/**
 * Agent Systems Department -- June-2026 arXiv concept tests.
 *
 * The 22 T1 concepts from AGENT-SYSTEMS-CONCEPT-VS-SKILL.md, authored in the
 * department's light pattern (empty panels). Assertions: valid RosettaConcept
 * fields, id prefix agent-, complexPlanePosition internal consistency,
 * relationships >= 2, panels is a Map, and dept-local targetId resolution (D-13).
 */

import { describe, it, expect } from 'vitest';
import {
  semanticConcurrencyControl,
  selectorPriorityArbitration,
  latentAgentCommunication,
  causalToolFrontier,
  declarativeAgentControl,
  goalStateInference,
  llmAsCode,
  adaptiveRetrievalStopping,
  admissionTimeHubnessGate,
  answerConditionedInformationGain,
  decisionAwareContextSelection,
  memoryUseWarrant,
  temporalSupersessionMemory,
  capabilityControlledSelfEvolution,
  compositionalBehavioralLeakage,
  compositionalSkillEvolution,
  operationalAnchorPreservation,
  toolContractInference,
  traceToSkillInduction,
  evaluatorValidityAudit,
  silentFailureTaxonomy,
  skillCoverageMetric,
  // existing agent- concepts as resolution targets
  contentAddressedStorage,
  engramMaturation,
  hybridRetrieval,
  intentRouting,
  memoryConsolidation,
  constraintDecay,
  dynamicAutonomy,
  executionGroundedSelection,
  harnessAsSubstrate,
  structuredSpecGate,
  complianceTraceCheck,
  counterfactualUtility,
  episodePackage,
  longRangeDependency,
  pairedTraceAudit,
  constraintDrift,
  coordinationSurface,
  critiqueAndRoute,
  fastSlowCoevolution,
  spectralTopology,
  counterfactualAudit,
  knowingDoingGap,
  skillAsArtifact,
  skillIrCompilation,
  skillPrivilegeBoundary,
} from './index.js';
import { runDependencyGraph } from './integration-evaluation/run-dependency-graph.js';
import { governanceTaxonomy } from './multi-agent-orchestration/governance-taxonomy.js';
import { selfMutatingPoisoning } from './skill-design/self-mutating-poisoning.js';
import { heldOutEvolutionGate } from './skill-design/held-out-evolution-gate.js';
import { multimodalSkillDistillation } from './skill-design/multimodal-skill-distillation.js';
import { planTensorRank } from './multi-agent-orchestration/plan-tensor-rank.js';
import { memoryValidityGate } from './agent-memory/memory-validity-gate.js';
import type { RosettaConcept } from '../../../rosetta-core/types.js';

const juneConcepts: RosettaConcept[] = [
  semanticConcurrencyControl,
  selectorPriorityArbitration,
  latentAgentCommunication,
  causalToolFrontier,
  declarativeAgentControl,
  goalStateInference,
  llmAsCode,
  adaptiveRetrievalStopping,
  admissionTimeHubnessGate,
  answerConditionedInformationGain,
  decisionAwareContextSelection,
  memoryUseWarrant,
  temporalSupersessionMemory,
  capabilityControlledSelfEvolution,
  compositionalBehavioralLeakage,
  compositionalSkillEvolution,
  operationalAnchorPreservation,
  toolContractInference,
  traceToSkillInduction,
  evaluatorValidityAudit,
  silentFailureTaxonomy,
  skillCoverageMetric,
];

const juneConceptNames = [
  'semanticConcurrencyControl',
  'selectorPriorityArbitration',
  'latentAgentCommunication',
  'causalToolFrontier',
  'declarativeAgentControl',
  'goalStateInference',
  'llmAsCode',
  'adaptiveRetrievalStopping',
  'admissionTimeHubnessGate',
  'answerConditionedInformationGain',
  'decisionAwareContextSelection',
  'memoryUseWarrant',
  'temporalSupersessionMemory',
  'capabilityControlledSelfEvolution',
  'compositionalBehavioralLeakage',
  'compositionalSkillEvolution',
  'operationalAnchorPreservation',
  'toolContractInference',
  'traceToSkillInduction',
  'evaluatorValidityAudit',
  'silentFailureTaxonomy',
  'skillCoverageMetric',
];

// Resolution target set for agent- targetIds (new cohort + existing dept concepts).
const allDeptConcepts: RosettaConcept[] = [
  ...juneConcepts,
  contentAddressedStorage,
  engramMaturation,
  hybridRetrieval,
  intentRouting,
  memoryConsolidation,
  constraintDecay,
  dynamicAutonomy,
  executionGroundedSelection,
  harnessAsSubstrate,
  structuredSpecGate,
  complianceTraceCheck,
  counterfactualUtility,
  episodePackage,
  longRangeDependency,
  pairedTraceAudit,
  constraintDrift,
  coordinationSurface,
  critiqueAndRoute,
  fastSlowCoevolution,
  spectralTopology,
  counterfactualAudit,
  knowingDoingGap,
  skillAsArtifact,
  skillIrCompilation,
  skillPrivilegeBoundary,
  runDependencyGraph,
  governanceTaxonomy,
  selfMutatingPoisoning,
  compositionalSkillEvolution,
  heldOutEvolutionGate,
  traceToSkillInduction,
  skillCoverageMetric,
  capabilityControlledSelfEvolution,
  multimodalSkillDistillation,
  selectorPriorityArbitration,
  planTensorRank,
  memoryValidityGate,
];

describe('Agent Systems Department -- June-2026 arXiv concepts', () => {
  describe('ASJ-01: Valid RosettaConcept fields', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has non-empty id, name, domain=agent-systems, and description',
      (_n, c) => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.domain).toBe('agent-systems');
        expect(c.description.length).toBeGreaterThan(10);
      }
    );
  });

  describe('ASJ-02: id prefix agent-', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s id starts with agent-',
      (_n, c) => {
        expect(c.id.startsWith('agent-')).toBe(true);
      }
    );
  });

  describe('ASJ-03: complexPlanePosition validation', () => {
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

  describe('ASJ-04: relationships (>= 2)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has >= 2 relationships',
      (_n, c) => {
        expect(c.relationships.length).toBeGreaterThanOrEqual(2);
      }
    );
  });

  describe('ASJ-05: panels is a Map (empty allowed for this wave)', () => {
    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s has panels as a Map',
      (_n, c) => {
        expect(c.panels).toBeInstanceOf(Map);
      }
    );
  });

  describe('ASJ-06: Dept-local targetId resolution', () => {
    const deptPrefix = 'agent-';
    const localIds = new Set(allDeptConcepts.map((c) => c.id));

    it.each(juneConcepts.map((c, i) => [juneConceptNames[i], c] as const))(
      '%s agent- targetIds resolve within the dept',
      (_n, c) => {
        for (const rel of c.relationships) {
          if (rel.targetId.startsWith(deptPrefix)) {
            expect(localIds.has(rel.targetId)).toBe(true);
          }
          // external refs (ai-computation-*, ct-*, etc.) accepted per D-13
        }
      }
    );
  });
});
